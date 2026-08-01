import React, { useEffect, useRef, useState } from "react";
import { MessageSquare, X, Send, Bot, Headset, CheckCheck, Check, Wifi, WifiOff, BellRing } from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || (process.env.NODE_ENV === 'production' ? 'https://reevanta-backend-pg3v.onrender.com' : 'http://localhost:8001');
const WS_URL = BACKEND_URL.replace(/^http/, 'ws');

export function LiveChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [connected, setConnected] = useState(false);
  const [agentIsTyping, setAgentIsTyping] = useState(false);
  const [deskPresence, setDeskPresence] = useState("online");

  // Persistent room ID for user session
  const [roomId] = useState(() => {
    let stored = localStorage.getItem("reevanta_chat_room_id");
    if (!stored) {
      stored = `user_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem("reevanta_chat_room_id", stored);
    }
    return stored;
  });

  const wsRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimerRef = useRef(null);

  // Auto-scroll messages to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, agentIsTyping]);

  // Request Push Notification Permission on initial mount
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission().catch(() => {});
      }
    }
  }, []);

  // Send Read Receipt when chat modal opens
  const markMessagesAsRead = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "read_receipt",
          room_id: roomId,
          sender: "user"
        })
      );
    }
  };

  // Connect WebSocket when chat is opened
  useEffect(() => {
    if (!isOpen) return;

    const socketUrl = `${WS_URL}/ws/chat/${roomId}`;
    const ws = new WebSocket(socketUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      markMessagesAsRead();
    };

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);

        // 1. History Event
        if (payload.type === "history") {
          const loadedMsgs = (payload.data || []).map((m) => ({
            id: m._id || m.id,
            sender: m.sender,
            text: m.text,
            read: m.read,
            time: new Date(m.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }));

          if (loadedMsgs.length === 0) {
            setMessages([
              {
                id: "welcome-1",
                sender: "bot",
                text: "Namaste! 🙏 Welcome to RIVAANTA Live Support Desk. How may we assist you today?",
                read: true,
                time: "Just now"
              }
            ]);
          } else {
            setMessages(loadedMsgs);
          }
        }
        
        // 2. Typing Indicator Event
        else if (payload.type === "typing") {
          if (payload.sender === "admin") {
            setAgentIsTyping(!!payload.is_typing);
          }
        }

        // 3. Read Receipt Event
        else if (payload.type === "read_receipt") {
          setMessages((prev) => prev.map((m) => ({ ...m, read: true })));
        }

        // 4. Presence Event
        else if (payload.type === "presence") {
          setDeskPresence(payload.status || "online");
        }

        // 5. Message Event
        else if (payload.type === "message") {
          const m = payload.data;
          setAgentIsTyping(false);

          // Web Push Notification if tab is in background
          if (m.sender === "admin" && document.hidden && "Notification" in window && Notification.permission === "granted") {
            try {
              new Notification("New message from RIVAANTA Support Desk", {
                body: m.text,
                icon: "/favicon.ico"
              });
            } catch (err) {}
          }

          setMessages((prev) => {
            if (prev.some((x) => x.id === (m._id || m.id))) return prev;
            return [
              ...prev,
              {
                id: m._id || m.id,
                sender: m.sender,
                text: m.text,
                read: m.read || false,
                time: new Date(m.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              }
            ];
          });

          if (m.sender === "admin" && isOpen) {
            markMessagesAsRead();
          }
        }
      } catch (err) {
        console.error("WebSocket message parse error:", err);
      }
    };

    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);

    return () => {
      if (ws) ws.close();
    };
  }, [isOpen, roomId]);

  // Emit typing status on input change
  const handleInputChange = (e) => {
    setInput(e.target.value);

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "typing",
          room_id: roomId,
          sender: "user",
          is_typing: true
        })
      );

      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(
            JSON.stringify({
              type: "typing",
              room_id: roomId,
              sender: "user",
              is_typing: false
            })
          );
        }
      }, 1500);
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const textToSend = input.trim();
    setInput("");

    // Clear typing state immediately on send
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "typing",
          room_id: roomId,
          sender: "user",
          is_typing: false
        })
      );

      wsRef.current.send(
        JSON.stringify({
          type: "message",
          room_id: roomId,
          sender: "user",
          user_name: "Customer",
          text: textToSend
        })
      );
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-gradient-to-r from-[#5C1E1E] to-[#2D2118] text-white p-4 rounded-full shadow-2xl hover:scale-105 transition flex items-center gap-2.5 border border-[#B8956A]/50 group"
        >
          <div className="relative">
            <MessageSquare className="w-6 h-6 text-amber-300" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white animate-pulse" />
          </div>
          <span className="text-xs font-bold tracking-wider hidden sm:inline pr-1">Kathmandu Live Support</span>
        </button>
      ) : (
        <div className="w-[340px] sm:w-[380px] h-[500px] bg-white rounded-3xl shadow-2xl border border-[#E8DFC9] flex flex-col justify-between overflow-hidden animate-in zoom-in-95 duration-200">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-[#2D2118] via-[#5C1E1E] to-[#2D2118] text-white p-4 flex items-center justify-between border-b border-[#B8956A]/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-400/20 flex items-center justify-center text-amber-300">
                <Headset className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-[#FAF5EC] flex items-center gap-1.5">
                  RIVAANTA Live Support
                </h3>
                <span className="text-[10px] font-bold flex items-center gap-1">
                  {connected ? (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" /> Kathmandu Desk Online
                    </span>
                  ) : (
                    <span className="text-amber-300 flex items-center gap-1">
                      <WifiOff className="w-3 h-3" /> Connecting...
                    </span>
                  )}
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-7 h-7 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#FAF5EC]/30">
            {messages.map((m) => {
              const isUser = m.sender === "user";
              return (
                <div
                  key={m.id}
                  className={`flex gap-2.5 max-w-[85%] ${
                    isUser ? "ml-auto flex-row-reverse" : "mr-auto"
                  }`}
                >
                  {!isUser && (
                    <div className="w-7 h-7 rounded-full bg-[#5C1E1E] text-white flex items-center justify-center shrink-0 mt-0.5 shadow">
                      {m.sender === "admin" ? <Headset className="w-4 h-4 text-emerald-300" /> : <Bot className="w-4 h-4 text-amber-300" />}
                    </div>
                  )}
                  <div>
                    {m.sender === "admin" && (
                      <span className="text-[9px] font-black text-[#5C1E1E] block mb-0.5 ml-1">
                        Support Agent
                      </span>
                    )}
                    <div
                      className={`p-3 rounded-2xl text-xs leading-relaxed ${
                        isUser
                          ? "bg-[#5C1E1E] text-white rounded-tr-none shadow"
                          : m.sender === "admin"
                          ? "bg-emerald-50 text-emerald-950 border border-emerald-200 rounded-tl-none shadow-sm font-semibold"
                          : "bg-white text-[#2D2118] border border-[#E8DFC9] rounded-tl-none shadow-sm font-medium"
                      }`}
                    >
                      {m.text}
                    </div>

                    {/* Read Receipts (✓✓) & Timestamp */}
                    <div className={`flex items-center gap-1 text-[9px] text-gray-400 mt-1 ${isUser ? "justify-end" : "justify-start"}`}>
                      <span>{m.time}</span>
                      {isUser && (
                        m.read ? (
                          <CheckCheck className="w-3.5 h-3.5 text-blue-500 font-bold" title="Read by Agent" />
                        ) : (
                          <Check className="w-3 h-3 text-gray-400" title="Delivered" />
                        )
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Typing Indicator Bubble */}
            {agentIsTyping && (
              <div className="flex gap-2.5 max-w-[85%] mr-auto items-center">
                <div className="w-7 h-7 rounded-full bg-[#5C1E1E] text-white flex items-center justify-center shrink-0 shadow">
                  <Headset className="w-4 h-4 text-emerald-300" />
                </div>
                <div className="bg-white text-gray-500 border border-[#E8DFC9] px-3 py-2 rounded-2xl text-xs font-bold flex items-center gap-1.5 shadow-sm">
                  <span>Support Agent is typing</span>
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

          {/* Input Form */}
          <form onSubmit={handleSend} className="p-3 bg-white border-t border-[#E8DFC9] flex gap-2">
            <input
              type="text"
              placeholder="Ask a question..."
              value={input}
              onChange={handleInputChange}
              className="flex-1 bg-[#FAF5EC] border border-[#E8DFC9] rounded-xl px-3 py-2 text-xs font-semibold text-[#2D2118] focus:outline-none focus:border-[#5C1E1E]"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="bg-[#5C1E1E] hover:bg-[#4A1717] text-white p-2.5 rounded-xl transition disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>
      )}
    </div>
  );
}
