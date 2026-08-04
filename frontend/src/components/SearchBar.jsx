import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Search, X, TrendingUp, Loader2, Bookmark } from "lucide-react";
import { toast } from "sonner";
import { httpClient } from "./httpClient";

const RECENT_KEY = "lb_recent_searches";
const RECENT_LIMIT = 5;
const SUGGESTION_LIMIT = 6;
const DEBOUNCE_MS = 300;
const TRENDING = ["Hoodie", "Sneakers", "Lipstick", "Handbag", "Jeans", "Watch"];

// In-memory suggestion cache: avoids refetching when the user retypes a
// query they've already searched in this session (e.g. type -> delete ->
// retype). Session-scoped only, with a short TTL so results don't go
// noticeably stale, and an LRU-ish cap so it can't grow unbounded.
const CACHE_LIMIT = 50;
const CACHE_TTL_MS = 60_000;

function getRecent() {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function pushRecent(q) {
  try {
    const cur = getRecent().filter((x) => x.toLowerCase() !== q.toLowerCase());
    cur.unshift(q);
    localStorage.setItem(RECENT_KEY, JSON.stringify(cur.slice(0, RECENT_LIMIT)));
  } catch {
    // localStorage may be unavailable (private mode, quota exceeded) - non-fatal
  }
}

function getStoredUserId() {
  try {
    return localStorage.getItem("reevanta_user_id") || "guest";
  } catch {
    return "guest";
  }
}

export const SearchBar = ({ value: externalValue, onChange: externalOnChange, onSubmit: externalOnSubmit, onSelectProduct }) => {
  // Internal state for self-contained mode (when value/onChange not provided)
  const [internalValue, setInternalValue] = useState("");
  const value = externalValue !== undefined ? externalValue : internalValue;
  const onChange = externalOnChange || setInternalValue;
  const onSubmit = externalOnSubmit || (() => { });

  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [recent, setRecent] = useState(() => getRecent());
  const [savingSearch, setSavingSearch] = useState(false);

  const boxRef = useRef(null);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);
  const abortRef = useRef(null);
  const requestSeq = useRef(0);
  const cacheRef = useRef(new Map());
  const chipRefs = useRef([]);

  const getCached = useCallback((key) => {
    const entry = cacheRef.current.get(key);
    if (!entry) return null;
    if (Date.now() - entry.ts > CACHE_TTL_MS) {
      cacheRef.current.delete(key);
      return null;
    }
    return entry.items;
  }, []);

  const setCached = useCallback((key, items) => {
    const cache = cacheRef.current;
    cache.delete(key); // re-insert to refresh recency order
    cache.set(key, { items, ts: Date.now() });
    if (cache.size > CACHE_LIMIT) {
      const oldestKey = cache.keys().next().value;
      cache.delete(oldestKey);
    }
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const onClick = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // Debounced suggestion fetch, with cancellation, cache, and stale-response guard
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = value ? value.trim() : "";

    if (trimmed.length < 1 || !httpClient.isConfigured()) {
      // Invalidate any in-flight request so its response can't repopulate
      // the dropdown after the query has already been cleared/changed.
      requestSeq.current++;
      if (abortRef.current) {
        abortRef.current.abort();
        abortRef.current = null;
      }
      setSuggestions([]);
      setLoading(false);
      setActiveIndex(-1);
      return;
    }

    const cacheKey = trimmed.toLowerCase();
    const cached = getCached(cacheKey);
    if (cached) {
      requestSeq.current++; // invalidate any older in-flight request
      if (abortRef.current) {
        abortRef.current.abort();
        abortRef.current = null;
      }
      setSuggestions(cached);
      setLoading(false);
      setActiveIndex(-1);
      return;
    }

    const seq = ++requestSeq.current;

    debounceRef.current = setTimeout(async () => {
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      try {
        const data = await httpClient.get("/search", {
          params: { q: trimmed, limit: SUGGESTION_LIMIT },
          signal: controller.signal,
        });
        // Ignore stale responses if a newer request has since started
        if (seq === requestSeq.current) {
          const items = data?.items || (Array.isArray(data) ? data : []);
          setSuggestions(items);
          setActiveIndex(-1);
          setCached(cacheKey, items);
        }
      } catch (err) {
        if (httpClient.isCancelError(err)) return;
        if (seq === requestSeq.current) {
          setSuggestions([]);
        }
      } finally {
        if (seq === requestSeq.current) setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(debounceRef.current);
  }, [value, getCached, setCached]);

  // Cleanup in-flight request on unmount
  useEffect(() => {
    return () => {
      if (abortRef.current) abortRef.current.abort();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const submit = useCallback(
    (q) => {
      if (!q || !q.trim()) return;
      pushRecent(q.trim());
      setRecent(getRecent());
      onSubmit(q.trim());
      setOpen(false);
      setActiveIndex(-1);
    },
    [onSubmit]
  );

  const selectSuggestion = useCallback(
    (s) => {
      onSelectProduct && onSelectProduct(s);
      setOpen(false);
      setActiveIndex(-1);
      inputRef.current?.focus();
    },
    [onSelectProduct]
  );

  const handleSaveSearch = useCallback(
    async (e) => {
      e.stopPropagation();
      if (!value || savingSearch) return;

      if (!httpClient.isConfigured()) {
        toast.error("Saved searches aren't available right now");
        return;
      }

      setSavingSearch(true);
      try {
        await httpClient.post("/marketplace/saved-searches", {
          user_id: getStoredUserId(),
          query: value,
          filters: {},
        });
        toast.success(`Saved search "${value}"!`, { icon: "🔖" });
      } catch {
        toast.error("Failed to save search");
      } finally {
        setSavingSearch(false);
      }
    },
    [value, savingSearch]
  );

  const trimmedValue = value ? value.trim() : "";
  const showSuggestions = trimmedValue.length > 0 && suggestions.length > 0;
  const showNoResults = trimmedValue.length > 0 && suggestions.length === 0 && !loading;
  const showChips = trimmedValue.length === 0;

  // Flat, ordered list of chip labels (recent first, then trending) so
  // keyboard nav indices line up with DOM order regardless of section.
  const chipList = useMemo(() => [...recent, ...TRENDING], [recent]);

  useEffect(() => {
    chipRefs.current = chipRefs.current.slice(0, chipList.length);
  }, [chipList.length]);

  const focusChip = (idx) => {
    const el = chipRefs.current[idx];
    el?.focus();
  };

  const handleChipKeyDown = (e, idx) => {
    if (chipList.length === 0) return;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      focusChip((idx + 1) % chipList.length);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      focusChip((idx - 1 + chipList.length) % chipList.length);
    } else if (e.key === "Home") {
      e.preventDefault();
      focusChip(0);
    } else if (e.key === "End") {
      e.preventDefault();
      focusChip(chipList.length - 1);
    } else if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
      return;
    }

    if (open && showChips && chipList.length > 0 && e.key === "ArrowDown") {
      e.preventDefault();
      focusChip(0);
      return;
    }

    if (!open || !showSuggestions) {
      if (e.key === "Enter") submit(value);
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === "Enter") {
      if (activeIndex >= 0 && activeIndex < suggestions.length) {
        e.preventDefault();
        selectSuggestion(suggestions[activeIndex]);
      } else {
        submit(value);
      }
    }
  };

  const listboxId = "search-suggestions-listbox";

  return (
    <div ref={boxRef} className="relative w-full">
      <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-[#8B7355]">
        <Search className="w-4 h-4" />
      </span>
      <input
        ref={inputRef}
        data-testid="search-input"
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-autocomplete="list"
        aria-activedescendant={activeIndex >= 0 ? `suggest-option-${activeIndex}` : undefined}
        placeholder="Search for clothes, shoes, makeup, bags & more..."
        value={value}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onKeyDown={handleKeyDown}
        className="w-full bg-[#FAF5EC] border border-[#E8DFC9] rounded-full pl-10 pr-10 py-2.5 text-sm text-[#2D2118] placeholder-[#8B7355]/70 focus:outline-none focus:ring-2 focus:ring-[#5C1E1E] transition shadow-inner"
      />
      {loading && (
        <span className="absolute inset-y-0 right-9 flex items-center text-[#8B7355]" aria-hidden="true">
          <Loader2 className="w-4 h-4 animate-spin" />
        </span>
      )}
      {value && (
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 gap-1">
          <button
            type="button"
            onClick={handleSaveSearch}
            disabled={savingSearch}
            title="Save This Search"
            aria-label="Save this search"
            className="text-[#8B7355] hover:text-[#5C1E1E] transition p-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {savingSearch ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Bookmark className="w-3.5 h-3.5" />
            )}
          </button>

          <button
            data-testid="search-clear-btn"
            onClick={() => {
              onChange("");
              inputRef.current?.focus();
            }}
            aria-label="Clear search"
            className="text-[#8B7355] hover:text-[#5C1E1E] p-1"
            type="button"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {open && (
        <div
          id={listboxId}
          role="listbox"
          data-testid="search-dropdown"
          className="absolute z-50 top-full left-0 right-0 mt-2 bg-white border border-[#E8DFC9] rounded-2xl shadow-2xl overflow-hidden max-h-96 overflow-y-auto"
        >
          {showSuggestions && (
            <div className="p-2">
              <div className="text-[10px] font-black uppercase tracking-wider text-[#8B7355] px-3 py-1.5">
                Matching products
              </div>
              <div className="space-y-1">
                {suggestions.map((s, idx) => (
                  <button
                    key={s.id ?? `${s.name}-${idx}`}
                    id={`suggest-option-${idx}`}
                    role="option"
                    aria-selected={activeIndex === idx}
                    data-testid={`suggest-${s.id ?? idx}`}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onClick={() => selectSuggestion(s)}
                    className={`w-full text-left flex items-center gap-3 p-2 rounded-xl transition ${activeIndex === idx ? "bg-[#FAF5EC]" : "hover:bg-[#FAF5EC]"
                      }`}
                    type="button"
                  >
                    <img
                      src={s.image}
                      alt={s.name}
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.style.visibility = "hidden";
                      }}
                      className="w-10 h-10 rounded-lg object-cover bg-gray-100"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-[#2D2118] line-clamp-1">{s.name}</div>
                      <div className="text-[10px] text-[#8B7355] uppercase tracking-wider">
                        {s.brand} · {s.category}
                      </div>
                    </div>
                    <div className="text-xs font-black text-[#5C1E1E]">₹{s.price}</div>
                  </button>
                ))}
              </div>
              <button
                data-testid="search-see-all-btn"
                onClick={() => submit(value)}
                className="w-full text-xs font-bold text-[#5C1E1E] hover:underline py-2 mt-1"
                type="button"
              >
                See all results for "{value}" →
              </button>
            </div>
          )}

          {showNoResults && (
            <div className="p-4 text-center">
              <p className="text-xs text-[#8B7355]">No products matching "{value}".</p>
              <button onClick={() => submit(value)} className="text-xs font-bold text-[#5C1E1E] hover:underline mt-1" type="button">
                Search anyway
              </button>
            </div>
          )}

          {showChips && (
            <div className="p-2">
              {recent.length > 0 && (
                <div>
                  <div className="flex items-center justify-between px-3 py-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#8B7355]">
                      Recent searches
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        try {
                          localStorage.removeItem(RECENT_KEY);
                        } catch {
                          // non-fatal
                        }
                        setRecent([]);
                      }}
                      className="text-[10px] font-bold text-[#8B7355] hover:text-[#5C1E1E] hover:underline"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 px-3 pb-2" role="group" aria-label="Recent searches">
                    {recent.map((r, i) => (
                      <button
                        key={r}
                        ref={(el) => (chipRefs.current[i] = el)}
                        data-testid={`recent-${r}`}
                        onClick={() => {
                          onChange(r);
                          submit(r);
                        }}
                        onKeyDown={(e) => handleChipKeyDown(e, i)}
                        tabIndex={-1}
                        className="px-2.5 py-1 bg-[#FAF5EC] border border-[#E8DFC9] rounded-full text-[11px] font-bold text-[#2D2118] hover:border-[#5C1E1E] focus:outline-none focus:ring-2 focus:ring-[#5C1E1E]"
                        type="button"
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <div className="text-[10px] font-black uppercase tracking-wider text-[#8B7355] px-3 py-1.5 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> Trending searches
                </div>
                <div className="flex flex-wrap gap-1.5 px-3 pb-3" role="group" aria-label="Trending searches">
                  {TRENDING.map((r, i) => {
                    const chipIdx = recent.length + i;
                    return (
                      <button
                        key={r}
                        ref={(el) => (chipRefs.current[chipIdx] = el)}
                        data-testid={`trending-${r}`}
                        onClick={() => {
                          onChange(r);
                          submit(r);
                        }}
                        onKeyDown={(e) => handleChipKeyDown(e, chipIdx)}
                        tabIndex={-1}
                        className="px-2.5 py-1 bg-gradient-to-r from-[#F5EBDC] to-[#FAF5EC] border border-[#5C1E1E]/20 rounded-full text-[11px] font-bold text-[#5C1E1E] hover:border-[#5C1E1E] focus:outline-none focus:ring-2 focus:ring-[#5C1E1E]"
                        type="button"
                      >
                        {r}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};