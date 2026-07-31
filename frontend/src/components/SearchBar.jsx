import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Search, X, TrendingUp } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const RECENT_KEY = "lb_recent_searches";

function getRecent() {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
  } catch {
    return [];
  }
}

function pushRecent(q) {
  const cur = getRecent().filter((x) => x.toLowerCase() !== q.toLowerCase());
  cur.unshift(q);
  localStorage.setItem(RECENT_KEY, JSON.stringify(cur.slice(0, 5)));
}

const TRENDING = ["Hoodie", "Sneakers", "Lipstick", "Handbag", "Jeans", "Watch"];

export const SearchBar = ({ value, onChange, onSubmit, onSelectProduct }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value || value.trim().length < 1) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API}/products/search-suggest`, { params: { q: value.trim(), limit: 6 } });
        setSuggestions(res.data || []);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 200);
  }, [value]);

  const submit = (q) => {
    if (!q || !q.trim()) return;
    pushRecent(q.trim());
    onSubmit(q.trim());
    setOpen(false);
  };

  const handleKey = (e) => {
    if (e.key === "Enter") submit(value);
  };

  const recent = getRecent();

  return (
    <div ref={boxRef} className="relative w-full">
      <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-[#535766]">
        <Search className="w-4 h-4" />
      </span>
      <input
        data-testid="search-input"
        type="text"
        placeholder="Search for clothes, shoes, makeup, bags & more..."
        value={value}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onKeyDown={handleKey}
        className="w-full bg-[#FAFAFC] border border-[#EAEAEC] rounded-full pl-10 pr-10 py-2.5 text-sm text-[#282C3F] placeholder-[#535766]/70 focus:outline-none focus:ring-2 focus:ring-[#FF3F6C] transition shadow-inner"
      />
      {value && (
        <button
          data-testid="search-clear-btn"
          onClick={() => onChange("")}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-[#535766] hover:text-[#FF3F6C]"
          type="button"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {open && (
        <div data-testid="search-dropdown" className="absolute z-50 top-full left-0 right-0 mt-2 bg-white border border-[#EAEAEC] rounded-2xl shadow-2xl overflow-hidden">
          {value.trim().length > 0 && suggestions.length > 0 && (
            <div className="p-2">
              <div className="text-[10px] font-black uppercase tracking-wider text-[#535766] px-3 py-1.5">Matching products</div>
              <div className="space-y-1">
                {suggestions.map((s) => (
                  <button
                    key={s.id}
                    data-testid={`suggest-${s.id}`}
                    onClick={() => {
                      onSelectProduct && onSelectProduct(s);
                      setOpen(false);
                    }}
                    className="w-full text-left flex items-center gap-3 p-2 rounded-xl hover:bg-[#FAFAFC] transition"
                    type="button"
                  >
                    <img src={s.image} alt={s.name} className="w-10 h-10 rounded-lg object-cover bg-gray-100" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-[#282C3F] line-clamp-1">{s.name}</div>
                      <div className="text-[10px] text-[#535766] uppercase tracking-wider">{s.brand} · {s.category}</div>
                    </div>
                    <div className="text-xs font-black text-[#FF3F6C]">₹{s.price}</div>
                  </button>
                ))}
              </div>
              <button
                data-testid="search-see-all-btn"
                onClick={() => submit(value)}
                className="w-full text-xs font-bold text-[#FF3F6C] hover:underline py-2 mt-1"
                type="button"
              >
                See all results for "{value}" →
              </button>
            </div>
          )}

          {value.trim().length > 0 && suggestions.length === 0 && !loading && (
            <div className="p-4 text-center">
              <p className="text-xs text-[#535766]">No products matching "{value}".</p>
              <button onClick={() => submit(value)} className="text-xs font-bold text-[#FF3F6C] hover:underline mt-1">
                Search anyway
              </button>
            </div>
          )}

          {value.trim().length === 0 && (
            <div className="p-2">
              {recent.length > 0 && (
                <div>
                  <div className="text-[10px] font-black uppercase tracking-wider text-[#535766] px-3 py-1.5">Recent searches</div>
                  <div className="flex flex-wrap gap-1.5 px-3 pb-2">
                    {recent.map((r) => (
                      <button
                        key={r}
                        data-testid={`recent-${r}`}
                        onClick={() => {
                          onChange(r);
                          submit(r);
                        }}
                        className="px-2.5 py-1 bg-[#FAFAFC] border border-[#EAEAEC] rounded-full text-[11px] font-bold text-[#282C3F] hover:border-[#FF3F6C]"
                        type="button"
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <div className="text-[10px] font-black uppercase tracking-wider text-[#535766] px-3 py-1.5 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> Trending searches
                </div>
                <div className="flex flex-wrap gap-1.5 px-3 pb-3">
                  {TRENDING.map((r) => (
                    <button
                      key={r}
                      data-testid={`trending-${r}`}
                      onClick={() => {
                        onChange(r);
                        submit(r);
                      }}
                      className="px-2.5 py-1 bg-gradient-to-r from-[#FFF0F3] to-[#FFF8F0] border border-[#FF3F6C]/20 rounded-full text-[11px] font-bold text-[#FF3F6C] hover:border-[#FF3F6C]"
                      type="button"
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
