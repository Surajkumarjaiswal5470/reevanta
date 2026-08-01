import React from "react";
import { X, Ruler, CheckCircle2 } from "lucide-react";

const SIZE_CHART = [
  { size: "S", bust: "34\"", waist: "28\"", hip: "37\"", shoulder: "14.5\"" },
  { size: "M", bust: "36\"", waist: "30\"", hip: "39\"", shoulder: "15.0\"" },
  { size: "L", bust: "38\"", waist: "32\"", hip: "41\"", shoulder: "15.5\"" },
  { size: "XL", bust: "40\"", waist: "34\"", hip: "43\"", shoulder: "16.0\"" },
  { size: "XXL", bust: "42\"", waist: "36\"", hip: "45\"", shoulder: "16.5\"" }
];

export function SizeGuideModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl relative border border-[#E8DFC9] space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-[#E8DFC9] pb-3">
          <div className="flex items-center gap-2 font-black text-lg text-[#2D2118]">
            <Ruler className="w-5 h-5 text-[#5C1E1E]" />
            <span>RIVAANTA Luxury Size Guide</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-[#2D2118] hover:bg-[#5C1E1E] hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Size Chart Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-[#FAF5EC] text-[#5C1E1E] font-black uppercase border-b border-[#E8DFC9]">
                <th className="p-2.5">Size</th>
                <th className="p-2.5">Bust (in)</th>
                <th className="p-2.5">Waist (in)</th>
                <th className="p-2.5">Hip (in)</th>
                <th className="p-2.5">Shoulder</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8DFC9]">
              {SIZE_CHART.map((row) => (
                <tr key={row.size} className="hover:bg-[#FAF5EC]/50 font-bold text-[#2D2118]">
                  <td className="p-2.5 font-black text-[#5C1E1E]">{row.size}</td>
                  <td className="p-2.5">{row.bust}</td>
                  <td className="p-2.5">{row.waist}</td>
                  <td className="p-2.5">{row.hip}</td>
                  <td className="p-2.5">{row.shoulder}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Measuring Tips */}
        <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 space-y-1">
          <div className="font-bold flex items-center gap-1.5 text-amber-950">
            <CheckCircle2 className="w-4 h-4 text-amber-700" /> How to Measure Yourself
          </div>
          <ul className="list-disc list-inside text-[11px] text-amber-800 space-y-0.5">
            <li><strong>Bust:</strong> Measure around the fullest part of your chest with tape snug.</li>
            <li><strong>Waist:</strong> Measure around your natural waistline above your belly button.</li>
            <li><strong>Hip:</strong> Stand with feet together and measure around the widest part of your hips.</li>
          </ul>
        </div>

        <button
          onClick={onClose}
          className="w-full bg-[#2D2118] hover:bg-[#5C1E1E] text-white font-bold py-3 rounded-2xl text-xs transition shadow-md"
        >
          Got It, Back to Product
        </button>
      </div>
    </div>
  );
}
