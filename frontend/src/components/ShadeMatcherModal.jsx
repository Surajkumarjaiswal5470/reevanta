import React, { useState } from "react";
import { X, Sparkles, Check, ArrowRight, RotateCcw } from "lucide-react";
import { toast } from "sonner";

export function ShadeMatcherModal({ onClose, onSelectShade }) {
  const [step, setStep] = useState(1);
  const [complexion, setComplexion] = useState("Medium");
  const [undertone, setUndertone] = useState("Warm");
  const [finish, setFinish] = useState("Radiant Velvet");
  const [recommendedShade, setRecommendedShade] = useState(null);

  const handleCalculateShade = () => {
    let shadeName = "";
    if (complexion === "Fair") {
      shadeName = undertone === "Cool" ? "01 Porcelain Rose" : "02 Ivory Solitaire";
    } else if (complexion === "Medium") {
      shadeName = undertone === "Warm" ? "04 Warm Honey Nude" : "03 Golden Saffron";
    } else {
      shadeName = undertone === "Warm" ? "06 Rich Mocha Velvet" : "05 Deep Himalayan Amber";
    }
    setRecommendedShade(shadeName);
    setStep(4);
  };

  const handleApplyRecommended = () => {
    if (recommendedShade && onSelectShade) {
      onSelectShade(recommendedShade);
      toast.success(`Matched Shade '${recommendedShade}' applied!`);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative border border-[#E8DFC9] space-y-5">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-[#E8DFC9] pb-3">
          <div className="flex items-center gap-2 font-black text-lg text-[#2D2118]">
            <Sparkles className="w-5 h-5 text-amber-600" />
            <span>Beauty Shade-Matcher Quiz</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-[#2D2118] hover:bg-[#5C1E1E] hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quiz Steps */}
        {step === 1 && (
          <div className="space-y-4 text-xs">
            <div className="font-bold text-[#8B7355] uppercase tracking-wider">Step 1 of 3: Select Your Complexion</div>
            <div className="grid grid-cols-3 gap-3">
              {["Fair", "Medium", "Deep / Dusky"].map((c) => (
                <button
                  key={c}
                  onClick={() => { setComplexion(c); setStep(2); }}
                  className={`p-4 rounded-2xl border text-center font-bold transition ${
                    complexion === c ? "bg-[#5C1E1E] text-white border-[#5C1E1E] shadow-md" : "bg-[#FAF5EC] text-[#2D2118] border-[#E8DFC9] hover:border-[#5C1E1E]"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 text-xs">
            <div className="font-bold text-[#8B7355] uppercase tracking-wider">Step 2 of 3: Select Skin Undertone</div>
            <p className="text-[11px] text-gray-500">Look at your wrist veins under natural sunlight.</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { name: "Warm", desc: "Greenish Veins · Gold Jewelry" },
                { name: "Cool", desc: "Bluish Veins · Silver Jewelry" },
                { name: "Neutral", desc: "Mix Veins · All Jewelry" }
              ].map((u) => (
                <button
                  key={u.name}
                  onClick={() => { setUndertone(u.name); setStep(3); }}
                  className={`p-3 rounded-2xl border text-center space-y-1 transition ${
                    undertone === u.name ? "bg-[#5C1E1E] text-white border-[#5C1E1E] shadow-md" : "bg-[#FAF5EC] text-[#2D2118] border-[#E8DFC9] hover:border-[#5C1E1E]"
                  }`}
                >
                  <div className="font-bold">{u.name}</div>
                  <div className="text-[9px] opacity-80">{u.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 text-xs">
            <div className="font-bold text-[#8B7355] uppercase tracking-wider">Step 3 of 3: Desired Finish</div>
            <div className="grid grid-cols-2 gap-3">
              {["Radiant Velvet", "Matte Longwear", "Hydrating Dewy", "Satin Natural"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFinish(f)}
                  className={`p-3 rounded-2xl border text-center font-bold transition ${
                    finish === f ? "bg-[#5C1E1E] text-white border-[#5C1E1E] shadow-md" : "bg-[#FAF5EC] text-[#2D2118] border-[#E8DFC9] hover:border-[#5C1E1E]"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            <button
              onClick={handleCalculateShade}
              className="w-full bg-[#2D2118] hover:bg-[#5C1E1E] text-white font-bold py-3 rounded-2xl text-xs transition shadow-lg flex items-center justify-center gap-2"
            >
              <span>Match My Perfect Shade</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {step === 4 && recommendedShade && (
          <div className="space-y-4 text-xs text-center py-2 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-full mx-auto flex items-center justify-center">
              ✨
            </div>
            <div>
              <div className="text-[10px] font-black uppercase text-[#8B7355] tracking-widest">Your AI Matched Shade</div>
              <h3 className="text-xl font-black text-[#5C1E1E] mt-1">{recommendedShade}</h3>
              <p className="text-[11px] text-gray-500 mt-1">Matched for {complexion} Complexion with {Undertone} Undertone.</p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2.5 rounded-xl border border-gray-300 font-bold text-gray-700 flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Retake
              </button>
              <button
                onClick={handleApplyRecommended}
                className="flex-1 bg-[#5C1E1E] hover:bg-[#4A1717] text-white font-bold py-2.5 rounded-xl shadow-md transition"
              >
                Apply Matched Shade to Order
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
