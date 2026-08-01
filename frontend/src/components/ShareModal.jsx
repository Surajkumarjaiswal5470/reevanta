import React from "react";
import { X, Copy, Share2, MessageCircle, Send, Facebook, Check } from "lucide-react";
import { toast } from "sonner";

export function ShareModal({ isOpen, onClose, product }) {
  const [copied, setCopied] = React.useState(false);
  if (!isOpen || !product) return null;

  const pName = product.name || "Luxury Item";
  const shareUrl = window.location.href;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Product link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: pName,
          text: `Check out ${pName} on RIVAANTA Luxury Wear:`,
          url: shareUrl,
        });
      } catch (err) {}
    } else {
      handleCopyLink();
    }
  };

  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedText = encodeURIComponent(`Check out ${pName} on RIVAANTA Luxury Wear: ${shareUrl}`);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 border border-[#E8DFC9] relative">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E8DFC9] pb-3">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-[#5C1E1E]" />
            <h3 className="font-extrabold text-base text-[#2D2118]">Share Listing</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-[#2D2118] hover:bg-[#5C1E1E] hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Product Preview */}
        <div className="flex items-center gap-3 p-3 bg-[#FAF5EC] rounded-2xl border border-[#E8DFC9]">
          <img src={product.image} alt={pName} className="w-14 h-14 rounded-xl object-cover" />
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-black text-[#2D2118] truncate">{pName}</h4>
            <span className="text-xs font-bold text-[#5C1E1E]">NPR {product.price?.toLocaleString()}</span>
          </div>
        </div>

        {/* Share Channels */}
        <div className="grid grid-cols-4 gap-3 text-center">
          <a
            href={`https://api.whatsapp.com/send?text=${encodedText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition text-emerald-700"
          >
            <MessageCircle className="w-6 h-6" />
            <span className="text-[10px] font-bold">WhatsApp</span>
          </a>

          <a
            href={`viber://forward?text=${encodedText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-purple-50 hover:bg-purple-100 border border-purple-200 transition text-purple-700"
          >
            <Send className="w-6 h-6" />
            <span className="text-[10px] font-bold">Viber</span>
          </a>

          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-blue-50 hover:bg-blue-100 border border-blue-200 transition text-blue-700"
          >
            <Facebook className="w-6 h-6" />
            <span className="text-[10px] font-bold">Facebook</span>
          </a>

          <button
            onClick={handleNativeShare}
            className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-amber-50 hover:bg-amber-100 border border-amber-200 transition text-amber-900"
          >
            <Share2 className="w-6 h-6" />
            <span className="text-[10px] font-bold">More</span>
          </button>
        </div>

        {/* Copy Link Input */}
        <div className="flex gap-2 bg-[#FAF5EC] p-2 rounded-2xl border border-[#E8DFC9]">
          <input
            type="text"
            readOnly
            value={shareUrl}
            className="flex-1 bg-transparent border-none text-xs text-[#2D2118] px-2 font-mono focus:outline-none truncate"
          />
          <button
            onClick={handleCopyLink}
            className="bg-[#5C1E1E] hover:bg-[#4A1717] text-white px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 shrink-0"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
