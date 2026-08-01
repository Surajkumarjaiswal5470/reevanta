import React, { useEffect, useRef, useState } from "react";
import { MessageSquare, Headset, Send, User, RefreshCw, Circle, CheckCircle2 } from "lucide-react";
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

  const wsRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Fetch Active Chat Rooms
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

        if (payload.type === "history") {
          // Group history messages by room_id
          const grouped = {};
          (payload.data || []).forEach((m) => {
            const rId = m.room_id || "default";
            if (!grouped[rId]) grouped[rId] = [];
            grouped[rId].push(m);
          });
          setMessages(grouped);
        } else if (payload.type === "message") {
          const m = payload.data;
          const rId = m.room_id;

          setMessages((prev) => {
            const cur = prev[rId] || [];
            if (cur.some((x) => (x._id || x.id) === (m._id || m.id))) return prev;
            return { ...prev, [rId]: [...cur, m] };
          });

          // Refresh rooms list snippet
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

  // Auto scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedRoomId]);

  const handleSendReply = (e) => {
    e.preventDefault();
    if (!replyInput.trim() || !selectedRoomId) return;

    const textToSend = replyInput.trim();
    setReplyInput("");

    const adminMsg = {
      room_id: selectedRoomId,
      sender: "admin",
      user_name: "RIVAANTA Support Agent",
      text: textToSend,
      timestamp: new Date().toISOString()
    };

    // Append locally
    setMessages((prev) => ({
      ...prev,
      [selectedRoomId]: [...(prev[selectedRoomId] || []), adminMsg]
    }));

    // Broadcast via Admin WebSocket
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          room_id: selectedRoomId,
          sender: "admin",
          user_name: "RIVAANTA Support Agent",
          text: textToSend
        })
      );
    }
  };

  const activeMessages = selectedRoomId ? messages[selectedRoomId] || [] : [];
  const selectedRoomInfo = rooms.find((r) => r.room_id === selectedRoomId);

  return (
    <div className="bg-white border border-[#E8DFC9] rounded-3xl overflow-hidden shadow-sm flex flex-col md:flex-row h-[600px]">
      
      {/* Left Sidebar: Active Rooms */}
      <div className="w-full md:w-80 border-r border-[#E8DFC9] bg-[#FAF5EC]/40 flex flex-col justify-between">
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

          <div className="overflow-y-auto max-h-[500px] divide-y divide-[#E8DFC9]/50">
            {rooms.length === 0 ? (
              <div className="p-6 text-center text-xs font-semibold text-gray-400">
                No active chat sessions found
              </div>
            ) : (
              rooms.map((room) => {
                const isSelected = room.room_id === selectedRoomId;
                return (
                  <button
                    key={room.room_id}
                    onClick={() => setSelectedRoomId(room.room_id)}
                    className={`w-full text-left p-3.5 transition flex items-start gap-3 ${
                      isSelected
                        ? "bg-[#FAF5EC] border-l-4 border-[#5C1E1E]"
                        : "hover:bg-[#FAF5EC]/60"
                    }`}
                  >
                    <div className="w-9 h-9 rounded-2xl bg-[#5C1E1E]/10 flex items-center justify-center text-[#5C1E1E] shrink-0 mt-0.5">
                      <User className="w-4 h-4" />
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
                      <p className="text-[11px] text-gray-500 truncate mt-0.5">
                        {room.latest_message || "No messages"}
                      </p>
                    </div>
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
                  <h4 className="text-xs font-black text-[#2D2118]">
                    {selectedRoomInfo?.user_name || selectedRoomId}
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
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Live Reply Form */}
            <form onSubmit={handleSendReply} className="p-3 border-t border-[#E8DFC9] flex gap-2 bg-white">
              <input
                type="text"
                placeholder={`Reply to ${selectedRoomInfo?.user_name || 'Customer'}...`}
                value={replyInput}
                onChange={(e) => setReplyInput(e.target.value)}
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
