import React, { useState } from "react";
import { MessageSquare, X, Send, Bot, Headset, Sparkles } from "lucide-react";
import { toast } from "sonner";

export function LiveChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "bot",
      text: "Namaste! 🙏 Welcome to RIVAANTA Luxury Wear & Cosmetics. How may I assist you today?",
      time: "Just now"
    }
  ]);
  const [input, setInput] = useState("");

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = { id: Date.now(), sender: "user", text: input, time: "Just now" };
    setMessages((prev) => [...prev, userMsg]);
    const userQuery = input.toLowerCase();
    setInput("");

    // Automated smart response logic
    setTimeout(() => {
      let botReply = "Thank you for reaching out! A customer support representative from our Kathmandu desk is reviewing your message.";
      
      if (userQuery.includes("ship") || userQuery.includes("deliver")) {
        botReply = "📦 Free shipping is available across Nepal on orders above NPR 3,000! Kathmandu Valley orders arrive in 24 hours.";
      } else if (userQuery.includes("return") || userQuery.includes("exchange")) {
        botReply = "↺ We offer a 7-day hassle-free doorstep return policy for unworn items with original tags intact.";
      } else if (userQuery.includes("track") || userQuery.includes("order")) {
        botReply = "🚚 You can track your order live from the 'My Orders' section in your account dashboard.";
      } else if (userQuery.includes("discount") || userQuery.includes("coupon") || userQuery.includes("code")) {
        botReply = "🎟️ Use coupon code WELCOME500 for NPR 500 OFF on your first luxury order!";
      }

      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, sender: "bot", text: botReply, time: "Just now" }
      ]);
    }, 600);
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
        <div className="w-[340px] sm:w-[380px] h-[480px] bg-white rounded-3xl shadow-2xl border border-[#E8DFC9] flex flex-col justify-between overflow-hidden animate-in zoom-in-95 duration-200">
          
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
                <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" /> Kathmandu Desk Online
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

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#FAF5EC]/30">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-2.5 max-w-[85%] ${
                  m.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                }`}
              >
                {m.sender === "bot" && (
                  <div className="w-7 h-7 rounded-full bg-[#5C1E1E] text-white flex items-center justify-center shrink-0 mt-0.5 shadow">
                    <Bot className="w-4 h-4 text-amber-300" />
                  </div>
                )}
                <div
                  className={`p-3 rounded-2xl text-xs leading-relaxed ${
                    m.sender === "user"
                      ? "bg-[#5C1E1E] text-white rounded-tr-none shadow"
                      : "bg-white text-[#2D2118] border border-[#E8DFC9] rounded-tl-none shadow-sm font-medium"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="p-3 bg-white border-t border-[#E8DFC9] flex gap-2">
            <input
              type="text"
              placeholder="Ask a question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
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
