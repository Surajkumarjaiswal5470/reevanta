import React from "react";
import { CheckCircle2, Package, Truck, Home, Clock, XCircle } from "lucide-react";

const STEPS = [
  { id: "Order Placed", icon: CheckCircle2, label: "Order Placed" },
  { id: "Packed", icon: Package, label: "Packed" },
  { id: "Shipped", icon: Truck, label: "Shipped" },
  { id: "Out for Delivery", icon: Truck, label: "Out for Delivery" },
  { id: "Delivered", icon: Home, label: "Delivered" },
];

function formatTime(ts) {
  if (!ts) return "";
  try {
    const d = new Date(ts);
    return d.toLocaleString(undefined, {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (e) {
    return "";
  }
}

export const OrderTimeline = ({ status, timeline }) => {
  if (status === "Cancelled") {
    return (
      <div data-testid="order-timeline-cancelled" className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl p-4">
        <XCircle className="w-6 h-6 text-red-600" />
        <div>
          <div className="text-sm font-bold text-red-800">Order Cancelled</div>
          <div className="text-xs text-red-600">This order was cancelled and will not be delivered.</div>
        </div>
      </div>
    );
  }

  const timelineMap = {};
  (timeline || []).forEach((t) => {
    timelineMap[t.status] = t;
  });
  const currentIdx = STEPS.findIndex((s) => s.id === status);

  return (
    <div data-testid="order-timeline" className="relative">
      {/* Horizontal timeline (desktop) */}
      <div className="hidden md:flex items-start justify-between relative">
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200" />
        <div
          className="absolute top-5 left-0 h-0.5 bg-gradient-to-r from-[#5C1E1E] to-[#B8956A] transition-all"
          style={{ width: `${Math.max(0, (currentIdx / (STEPS.length - 1)) * 100)}%` }}
        />
        {STEPS.map((step, idx) => {
          const t = timelineMap[step.id];
          const done = idx <= currentIdx;
          const isCurrent = idx === currentIdx;
          const Icon = step.icon;
          return (
            <div key={step.id} className="flex flex-col items-center relative z-10 flex-1">
              <div
                className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all shadow-sm ${
                  done
                    ? "bg-[#5C1E1E] border-[#5C1E1E] text-white"
                    : "bg-white border-gray-300 text-gray-400"
                } ${isCurrent ? "ring-4 ring-[#5C1E1E]/20 scale-110" : ""}`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div className="mt-2 text-center px-1">
                <div className={`text-[11px] font-bold ${done ? "text-[#2D2118]" : "text-gray-400"}`}>
                  {step.label}
                </div>
                <div className={`text-[10px] mt-0.5 ${isCurrent ? "text-[#5C1E1E] font-bold" : "text-gray-500"}`}>
                  {t?.completed ? formatTime(t.timestamp) : t?.eta ? `ETA ${formatTime(t.eta)}` : ""}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Vertical timeline (mobile) */}
      <div className="md:hidden space-y-3">
        {STEPS.map((step, idx) => {
          const t = timelineMap[step.id];
          const done = idx <= currentIdx;
          const isCurrent = idx === currentIdx;
          const Icon = step.icon;
          return (
            <div key={step.id} className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    done ? "bg-[#5C1E1E] text-white" : "bg-gray-100 text-gray-400"
                  } ${isCurrent ? "ring-4 ring-[#5C1E1E]/20" : ""}`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                {idx < STEPS.length - 1 && (
                  <div className={`w-0.5 h-6 ${done ? "bg-[#5C1E1E]" : "bg-gray-200"}`} />
                )}
              </div>
              <div className="flex-1 pb-2">
                <div className={`text-sm font-bold ${done ? "text-[#2D2118]" : "text-gray-400"}`}>
                  {step.label}
                </div>
                <div className={`text-[11px] flex items-center gap-1 ${isCurrent ? "text-[#5C1E1E] font-bold" : "text-gray-500"}`}>
                  <Clock className="w-3 h-3" />
                  {t?.completed ? formatTime(t.timestamp) : t?.eta ? `ETA ${formatTime(t.eta)}` : "Pending"}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
