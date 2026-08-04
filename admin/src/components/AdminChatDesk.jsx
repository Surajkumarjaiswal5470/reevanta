import React, { useEffect, useRef, useState } from "react";
import { MessageSquare, Headset, Send, User, RefreshCw, Circle, CheckCheck, Check, BellRing } from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || (process.env.NODE_ENV === 'production' ? 'https://reevanta-backend-pg3v.onrender.com' : 'http://localhost:8001');
const API_URL = `${BACKEND_URL}/api`;
const WS_URL = BACKEND_URL.replace(/^http/, 'ws');

export function AdminChatDesk() {
  const [rooms, setRooms] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [messages, setMessages] = useState({});
  const [replyInput, setReplyInput] = useState("");
  const [connected, setConnected] = useState(false);
  const [customerTyping, setCustomerTyping] = useState({});
  const [roomPresence, setRoomPresence] = useState({});

  const wsRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimerRef = useRef(null);

  // Request Notification permission
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission().catch(() => {});
      }
    }
  }, []);

  // Fetch Active Rooms
  const fetchActiveRooms = async () => {
    try {
      const res = await fetch(`${API_URL}/chat/active-rooms`);
      if (res.ok) {
        const data = await res.json();
        setRooms(data || []);
        if (data.length > 0 && !selectedRoomId) {
          setSelectedRoomId(data[0].room_id);
        }
      }
    } catch (err) {
      console.error("Error fetching chat rooms:", err);
    }
  };

  useEffect(() => {
    fetchActiveRooms();
  }, []);

  // Send Read Receipt when selected room changes
  useEffect(() => {
    if (selectedRoomId && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "read_receipt",
          room_id: selectedRoomId,
          sender: "admin"
        })
      );

      // Clear unread badge in local rooms state
      setRooms((prev) =>
        prev.map((r) => (r.room_id === selectedRoomId ? { ...r, unread_count: 0 } : r))
      );
    }
  }, [selectedRoomId]);

  // Connect to Admin WebSocket
  useEffect(() => {
    const ws = new WebSocket(`${WS_URL}/ws/chat/admin`);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      console.log("Admin Desk WebSocket Connected");
    };

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);

        // 1. History Event
        if (payload.type === "history") {
          const grouped = {};
          (payload.data || []).forEach((m) => {
            const rId = m.room_id || "default";
            if (!grouped[rId]) grouped[rId] = [];
            grouped[rId].push(m);
          });
          setMessages(grouped);
        }
        
        // 2. Typing Indicator Event
        else if (payload.type === "typing") {
          if (payload.sender === "user") {
            setCustomerTyping((prev) => ({ ...prev, [payload.room_id]: !!payload.is_typing }));
          }
        }

        // 3. Read Receipt Event
        else if (payload.type === "read_receipt") {
          const rId = payload.room_id;
          setMessages((prev) => {
            if (!prev[rId]) return prev;
            return {
              ...prev,
              [rId]: prev[rId].map((m) => ({ ...m, read: true }))
            };
          });
        }

        // 4. Presence Event
        else if (payload.type === "presence") {
          setRoomPresence((prev) => ({ ...prev, [payload.room_id]: payload.status || "online" }));
        }

        // 5. Message Event
        else if (payload.type === "message") {
          const m = payload.data;
          const rId = m.room_id;

          setCustomerTyping((prev) => ({ ...prev, [rId]: false }));

          // Push Notification if customer messages while admin tab is backgrounded
          if (m.sender === "user" && document.hidden && "Notification" in window && Notification.permission === "granted") {
            try {
              new Notification(`New Customer Message (${m.user_name || 'Customer'})`, {
                body: m.text,
                icon: "/favicon.ico"
              });
            } catch (err) {}
          }

          setMessages((prev) => {
            const cur = prev[rId] || [];
            if (cur.some((x) => (x._id || x.id) === (m._id || m.id))) return prev;
            return { ...prev, [rId]: [...cur, m] };
          });

          fetchActiveRooms();
        }
      } catch (err) {
        console.error("Error processing admin websocket message:", err);
      }
    };

    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);

    return () => {
      if (ws) ws.close();
    };
  }, []);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedRoomId, customerTyping]);

  // Handle Typing on input
  const handleInputChange = (e) => {
    setReplyInput(e.target.value);

    if (selectedRoomId && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "typing",
          room_id: selectedRoomId,
          sender: "admin",
          is_typing: true
        })
      );

      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        if (selectedRoomId && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(
            JSON.stringify({
              type: "typing",
              room_id: selectedRoomId,
              sender: "admin",
              is_typing: false
            })
          );
        }
      }, 1500);
    }
  };

  const handleSendReply = (e) => {
    e.preventDefault();
    if (!replyInput.trim() || !selectedRoomId) return;

    const textToSend = replyInput.trim();
    setReplyInput("");

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "typing",
          room_id: selectedRoomId,
          sender: "admin",
          is_typing: false
        })
      );

      wsRef.current.send(
        JSON.stringify({
          type: "message",
          room_id: selectedRoomId,
          sender: "admin",
          user_name: "Support Agent",
          text: textToSend
        })
      );
    }
  };

  const activeMessages = selectedRoomId ? messages[selectedRoomId] || [] : [];
  const selectedRoomInfo = rooms.find((r) => r.room_id === selectedRoomId);
  const isSelectedRoomTyping = selectedRoomId ? customerTyping[selectedRoomId] : false;

  return (
    <div className="bg-white border border-[#E8DFC9] rounded-3xl overflow-hidden shadow-sm flex flex-col md:flex-row min-h-[520px] md:h-[620px]">
      
      {/* Left Sidebar: Active Rooms */}
      <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-[#E8DFC9] bg-[#FAF5EC]/40 flex flex-col justify-between max-h-[200px] md:max-h-none shrink-0">
        <div>
          <div className="p-4 border-b border-[#E8DFC9] flex items-center justify-between">
            <h3 className="font-black text-sm text-[#2D2118] flex items-center gap-2">
              <Headset className="w-4 h-4 text-[#5C1E1E]" />
              <span>Customer Conversations</span>
            </h3>
            <button
              onClick={fetchActiveRooms}
              className="p-1 hover:bg-[#E8DFC9]/50 rounded-lg text-gray-500 transition"
              title="Refresh Rooms"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-y-auto max-h-[510px] divide-y divide-[#E8DFC9]/50">
            {rooms.length === 0 ? (
              <div className="p-6 text-center text-xs font-semibold text-gray-400">
                No active chat sessions found
              </div>
            ) : (
              rooms.map((room) => {
                const isSelected = room.room_id === selectedRoomId;
                const isOnline = roomPresence[room.room_id] !== "offline";
                const isTyping = customerTyping[room.room_id];

                return (
                  <button
                    key={room.room_id}
                    onClick={() => setSelectedRoomId(room.room_id)}
                    className={`w-full text-left p-3.5 transition flex items-start gap-3 relative ${
                      isSelected
                        ? "bg-[#FAF5EC] border-l-4 border-[#5C1E1E]"
                        : "hover:bg-[#FAF5EC]/60"
                    }`}
                  >
                    <div className="relative shrink-0 mt-0.5">
                      <div className="w-9 h-9 rounded-2xl bg-[#5C1E1E]/10 flex items-center justify-center text-[#5C1E1E]">
                        <User className="w-4 h-4" />
                      </div>
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                          isOnline ? "bg-emerald-500" : "bg-gray-300"
                        }`}
                        title={isOnline ? "Online" : "Offline"}
                      />
                    </div>

                    <div className="flex-1 overflow-hidden">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-[#2D2118] truncate">
                          {room.user_name || room.room_id}
                        </span>
                        <span className="text-[9px] text-gray-400">
                          {room.latest_timestamp ? new Date(room.latest_timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 truncate mt-0.5 flex items-center gap-1">
                        {isTyping ? (
                          <span className="text-[#5C1E1E] font-bold animate-pulse">Typing...</span>
                        ) : (
                          room.latest_message || "No messages"
                        )}
                      </p>
                    </div>

                    {room.unread_count > 0 && (
                      <span className="bg-[#5C1E1E] text-white text-[9px] font-black px-1.5 py-0.5 rounded-full shadow">
                        {room.unread_count}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Connection Status Bar */}
        <div className="p-3 border-t border-[#E8DFC9] bg-white text-[10px] font-bold text-gray-500 flex items-center justify-between">
          <span>Desk Socket Status:</span>
          {connected ? (
            <span className="text-emerald-700 flex items-center gap-1">
              <Circle className="w-2 h-2 fill-emerald-500 text-emerald-500" /> Connected Live
            </span>
          ) : (
            <span className="text-amber-600 flex items-center gap-1">
              <Circle className="w-2 h-2 fill-amber-500 text-amber-500" /> Connecting...
            </span>
          )}
        </div>
      </div>

      {/* Right Area: Selected Chat Conversation */}
      <div className="flex-1 flex flex-col justify-between bg-white">
        {selectedRoomId ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-[#E8DFC9] bg-[#FAF5EC]/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-[#5C1E1E] text-white flex items-center justify-center font-black text-xs">
                  {selectedRoomInfo?.user_name?.substring(0, 2)?.toUpperCase() || "CU"}
                </div>
                <div>
                  <h4 className="text-xs font-black text-[#2D2118] flex items-center gap-2">
                    <span>{selectedRoomInfo?.user_name || selectedRoomId}</span>
                    <span className={`w-2 h-2 rounded-full ${roomPresence[selectedRoomId] !== 'offline' ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`} />
                  </h4>
                  <span className="text-[10px] text-gray-400 font-mono">
                    Room: {selectedRoomId}
                  </span>
                </div>
              </div>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#FAF5EC]/20">
              {activeMessages.length === 0 ? (
                <div className="text-center py-12 text-xs text-gray-400 font-semibold">
                  No message history in this room.
                </div>
              ) : (
                activeMessages.map((m, idx) => {
                  const isAdmin = m.sender === "admin";
                  return (
                    <div
                      key={m._id || m.id || idx}
                      className={`flex gap-2.5 max-w-[80%] ${
                        isAdmin ? "ml-auto flex-row-reverse" : "mr-auto"
                      }`}
                    >
                      <div>
                        <div
                          className={`p-3 rounded-2xl text-xs leading-relaxed ${
                            isAdmin
                              ? "bg-[#5C1E1E] text-white rounded-tr-none shadow"
                              : "bg-white text-[#2D2118] border border-[#E8DFC9] rounded-tl-none shadow-sm font-medium"
                          }`}
                        >
                          <span className="text-[9px] font-bold block mb-1 opacity-70">
                            {isAdmin ? "Admin Desk" : m.user_name || "Customer"}
                          </span>
                          {m.text}
                        </div>

                        {/* Read Receipts (✓✓) & Timestamp */}
                        <div className={`flex items-center gap-1 text-[9px] text-gray-400 mt-1 ${isAdmin ? "justify-end" : "justify-start"}`}>
                          <span>{m.timestamp ? new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                          {isAdmin && (
                            m.read ? (
                              <CheckCheck className="w-3.5 h-3.5 text-blue-500 font-bold" title="Read by Customer" />
                            ) : (
                              <Check className="w-3 h-3 text-gray-400" title="Delivered" />
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}

              {/* Customer Typing Indicator */}
              {isSelectedRoomTyping && (
                <div className="flex gap-2.5 max-w-[80%] mr-auto items-center">
                  <div className="bg-white text-[#5C1E1E] border border-[#E8DFC9] px-3 py-2 rounded-2xl text-xs font-bold flex items-center gap-1.5 shadow-sm">
                    <span>Customer is typing</span>
                    <span className="flex gap-0.5">
                      <span className="w-1 h-1 bg-[#5C1E1E] rounded-full animate-bounce" />
                      <span className="w-1 h-1 bg-[#5C1E1E] rounded-full animate-bounce [animation-delay:0.2s]" />
                      <span className="w-1 h-1 bg-[#5C1E1E] rounded-full animate-bounce [animation-delay:0.4s]" />
                    </span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Live Reply Form */}
            <form onSubmit={handleSendReply} className="p-3 border-t border-[#E8DFC9] flex gap-2 bg-white">
              <input
                type="text"
                placeholder={`Reply to ${selectedRoomInfo?.user_name || 'Customer'}...`}
                value={replyInput}
                onChange={handleInputChange}
                className="flex-1 bg-[#FAF5EC] border border-[#E8DFC9] rounded-xl px-4 py-2.5 text-xs font-semibold text-[#2D2118] focus:outline-none focus:border-[#5C1E1E]"
              />
              <button
                type="submit"
                disabled={!replyInput.trim()}
                className="bg-[#5C1E1E] hover:bg-[#4A1717] text-white px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Reply</span>
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-xs font-bold text-gray-400">
            Select a customer conversation room from the left to start live messaging
          </div>
        )}
      </div>

    </div>
  );
}
