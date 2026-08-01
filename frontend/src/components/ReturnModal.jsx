import React, { useState } from "react";
import { X, RotateCcw, Building2, Smartphone, ShieldCheck, CheckCircle2, ArrowRight, Upload, AlertCircle, MapPin, CreditCard } from "lucide-react";
import { apiFetch } from "../services/api";
import { toast } from "sonner";

export function ReturnModal({ order, onClose, onSuccess }) {
  const [step, setStep] = useState(1);
  const [reason, setReason] = useState("Size / Fit issue (Too small or large)");
  const [reasonDetails, setReasonDetails] = useState("");
  const [proofImage, setProofImage] = useState("");
  const [refundMethod, setRefundMethod] = useState("bank_account"); // bank_account, digital_wallet, original_payment
  
  // Bank Account State
  const [bankName, setBankName] = useState("Nabil Bank");
  const [accountHolderName, setAccountHolderName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [confirmAccountNumber, setConfirmAccountNumber] = useState("");
  const [branchOrIfsc, setBranchOrIfsc] = useState("Kathmandu Branch");

  // Wallet State
  const [walletType, setWalletType] = useState("eSewa");
  const [walletNumber, setWalletNumber] = useState("9715102007");

  const [loading, setLoading] = useState(false);

  const returnReasons = [
    "Size / Fit issue (Too small or large)",
    "Defective / Damaged product received",
    "Color / Fabric differs from website photo",
    "Received wrong item",
    "Quality not as expected for luxury wear",
    "Changed mind / Ordered by mistake"
  ];

  const popularBanks = [
    "Nabil Bank",
    "NIC Asia Bank",
    "Global IME Bank",
    "Himalayan Bank",
    "Nepal Investment Mega Bank",
    "Everest Bank",
    "Sanima Bank",
    "Standard Chartered Bank Nepal",
    "State Bank of India (SBI)",
    "HDFC Bank",
    "ICICI Bank",
    "Other Bank"
  ];

  const digitalWallets = [
    "eSewa Nepal",
    "Khalti Digital Wallet",
    "IME Pay",
    "PhonePe / Google Pay / UPI",
    "PayTM"
  ];

  const handleSubmitReturn = async (e) => {
    e.preventDefault();
    if (refundMethod === "bank_account") {
      if (!accountHolderName || !accountNumber) {
        toast.error("Please enter Account Holder Name and Bank Account Number.");
        return;
      }
      if (accountNumber !== confirmAccountNumber) {
        toast.error("Account Numbers do not match! Please re-verify.");
        return;
      }
    } else if (refundMethod === "digital_wallet") {
      if (!walletNumber) {
        toast.error("Please enter your registered wallet mobile number / ID.");
        return;
      }
    }

    setLoading(true);
    try {
      const payload = {
        reason,
        reasonDetails,
        proofImage,
        refundMethod,
        bankDetails: refundMethod === "bank_account" ? {
          accountHolderName,
          bankName,
          accountNumber,
          branchOrIfsc
        } : null,
        walletDetails: refundMethod === "digital_wallet" ? {
          walletType,
          walletNumberOrId: walletNumber
        } : null,
        pickupAddress: order.address
      };

      const res = await apiFetch(`/orders/${order.id}/return`, {
        method: "POST",
        body: payload
      });

      toast.success(res.message || "Return Request Submitted Successfully!");
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.message || "Failed to submit return request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative border border-[#E8DFC9] max-h-[90vh] overflow-y-auto space-y-6">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 hover:text-black transition hover:bg-gray-200"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 border-b border-[#E8DFC9] pb-4">
          <div className="w-12 h-12 rounded-2xl bg-[#5C1E1E] text-white flex items-center justify-center shadow-lg shadow-[#5C1E1E]/30">
            <RotateCcw className="w-6 h-6 text-amber-300" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-[#8B7355]">Amazon / Meesho Style Return Portal</span>
            <h2 className="text-xl font-black text-[#2D2118]">Item Return & Refund Request</h2>
            <p className="text-xs text-gray-500">Order #{order.order_number} • Total: ₹{order.total}</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center justify-between text-xs font-bold text-[#8B7355] bg-[#FAF5EC] p-2.5 rounded-2xl border border-[#E8DFC9]">
          <span className={step >= 1 ? "text-[#5C1E1E]" : "text-gray-400"}>1. Return Reason</span>
          <span>→</span>
          <span className={step >= 2 ? "text-[#5C1E1E]" : "text-gray-400"}>2. Refund Bank / Wallet</span>
          <span>→</span>
          <span className={step >= 3 ? "text-[#5C1E1E]" : "text-gray-400"}>3. Confirm Pickup</span>
        </div>

        <form onSubmit={handleSubmitReturn} className="space-y-6">
          
          {/* STEP 1: Select Reason & Upload Proof */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div>
                <label className="text-xs font-bold text-[#2D2118] uppercase tracking-wider block mb-2">
                  Select Primary Reason for Return *
                </label>
                <div className="space-y-2">
                  {returnReasons.map((r, idx) => (
                    <label
                      key={idx}
                      className={`flex items-center p-3 rounded-2xl border cursor-pointer text-xs font-semibold transition ${
                        reason === r ? "bg-[#FAF5EC] border-[#5C1E1E] text-[#5C1E1E] shadow-sm" : "border-gray-200 hover:bg-gray-50 text-gray-700"
                      }`}
                    >
                      <input
                        type="radio"
                        name="return_reason"
                        checked={reason === r}
                        onChange={() => setReason(r)}
                        className="mr-3 accent-[#5C1E1E]"
                      />
                      <span>{r}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#2D2118] block mb-1">
                  Issue Description & Feedback (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe the sizing or defect details to help our quality control team..."
                  value={reasonDetails}
                  onChange={(e) => setReasonDetails(e.target.value)}
                  className="w-full bg-[#FAF5EC] border border-[#E8DFC9] rounded-2xl p-3 text-xs font-semibold focus:outline-none focus:border-[#5C1E1E]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#2D2118] block mb-1">
                  Photo Proof Image URL (Required for Damaged Items)
                </label>
                <input
                  type="text"
                  placeholder="https://images.example.com/item-defect.jpg"
                  value={proofImage}
                  onChange={(e) => setProofImage(e.target.value)}
                  className="w-full bg-[#FAF5EC] border border-[#E8DFC9] rounded-2xl p-3 text-xs font-semibold focus:outline-none focus:border-[#5C1E1E]"
                />
              </div>

              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full bg-[#5C1E1E] text-white py-3.5 rounded-2xl text-xs font-bold shadow-lg shadow-[#5C1E1E]/30 hover:bg-[#4A1717] transition flex items-center justify-center gap-2"
              >
                <span>Continue to Refund Payment Method</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* STEP 2: Refund Method & Bank Account / Wallet Form */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              <div>
                <label className="text-xs font-bold text-[#2D2118] uppercase tracking-wider block mb-2">
                  Choose Where You Want to Receive Your Refund *
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setRefundMethod("bank_account")}
                    className={`p-4 rounded-2xl border text-left flex flex-col items-center justify-center text-center gap-2 transition ${
                      refundMethod === "bank_account" ? "bg-[#FAF5EC] border-[#5C1E1E] text-[#5C1E1E] font-bold shadow-md" : "border-gray-200 text-gray-700"
                    }`}
                  >
                    <Building2 className="w-6 h-6" />
                    <span className="text-xs">Direct Bank Account Transfer</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRefundMethod("digital_wallet")}
                    className={`p-4 rounded-2xl border text-left flex flex-col items-center justify-center text-center gap-2 transition ${
                      refundMethod === "digital_wallet" ? "bg-[#FAF5EC] border-[#5C1E1E] text-[#5C1E1E] font-bold shadow-md" : "border-gray-200 text-gray-700"
                    }`}
                  >
                    <Smartphone className="w-6 h-6" />
                    <span className="text-xs">eSewa / Khalti / Mobile Wallet</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRefundMethod("original_payment")}
                    className={`p-4 rounded-2xl border text-left flex flex-col items-center justify-center text-center gap-2 transition ${
                      refundMethod === "original_payment" ? "bg-[#FAF5EC] border-[#5C1E1E] text-[#5C1E1E] font-bold shadow-md" : "border-gray-200 text-gray-700"
                    }`}
                  >
                    <CreditCard className="w-6 h-6" />
                    <span className="text-xs">Original Payment Source</span>
                  </button>
                </div>
              </div>

              {/* BANK ACCOUNT FORM */}
              {refundMethod === "bank_account" && (
                <div className="bg-[#FAF5EC] p-5 rounded-2xl border border-[#E8DFC9] space-y-4">
                  <div className="flex items-center gap-2 font-bold text-xs text-[#5C1E1E] uppercase tracking-wider">
                    <Building2 className="w-4 h-4 text-emerald-600" /> Bank Transfer Account Details (Amazon / Meesho Style)
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">Select Bank Name *</label>
                    <select
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full bg-white border border-[#E8DFC9] rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:border-[#5C1E1E]"
                    >
                      {popularBanks.map((b, i) => (
                        <option key={i} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">Account Holder Full Name (as per Bank) *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Suraj Kumar Jaiswal"
                      value={accountHolderName}
                      onChange={(e) => setAccountHolderName(e.target.value)}
                      className="w-full bg-white border border-[#E8DFC9] rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:border-[#5C1E1E]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-gray-700 block mb-1">Account Number *</label>
                      <input
                        type="text"
                        required
                        placeholder="01234567891234"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))}
                        className="w-full bg-white border border-[#E8DFC9] rounded-xl p-2.5 text-xs font-bold tracking-wider focus:outline-none focus:border-[#5C1E1E]"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-gray-700 block mb-1">Re-Enter Account Number *</label>
                      <input
                        type="password"
                        required
                        placeholder="••••••••••••"
                        value={confirmAccountNumber}
                        onChange={(e) => setConfirmAccountNumber(e.target.value.replace(/\D/g, ""))}
                        className="w-full bg-white border border-[#E8DFC9] rounded-xl p-2.5 text-xs font-bold tracking-wider focus:outline-none focus:border-[#5C1E1E]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">Branch Name / IFSC / SWIFT Code</label>
                    <input
                      type="text"
                      placeholder="e.g. Kathmandu New Road Branch / NABIL001"
                      value={branchOrIfsc}
                      onChange={(e) => setBranchOrIfsc(e.target.value)}
                      className="w-full bg-white border border-[#E8DFC9] rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:border-[#5C1E1E]"
                    />
                  </div>

                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-800 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Refund will be directly credited to your bank account within 24 hours of doorstep pickup quality check.</span>
                  </div>
                </div>
              )}

              {/* DIGITAL WALLET FORM */}
              {refundMethod === "digital_wallet" && (
                <div className="bg-[#FAF5EC] p-5 rounded-2xl border border-[#E8DFC9] space-y-4">
                  <div className="flex items-center gap-2 font-bold text-xs text-[#5C1E1E] uppercase tracking-wider">
                    <Smartphone className="w-4 h-4 text-emerald-600" /> Digital Wallet & UPI Refund
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">Select Wallet Service *</label>
                    <select
                      value={walletType}
                      onChange={(e) => setWalletType(e.target.value)}
                      className="w-full bg-white border border-[#E8DFC9] rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:border-[#5C1E1E]"
                    >
                      {digitalWallets.map((w, i) => (
                        <option key={i} value={w}>{w}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">Registered Wallet Phone Number / ID *</label>
                    <input
                      type="text"
                      required
                      placeholder="9715102007 or user@esewa"
                      value={walletNumber}
                      onChange={(e) => setWalletNumber(e.target.value)}
                      className="w-full bg-white border border-[#E8DFC9] rounded-xl p-2.5 text-xs font-bold text-[#2D2118] focus:outline-none focus:border-[#5C1E1E]"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 bg-gray-100 text-gray-700 py-3.5 rounded-2xl text-xs font-bold hover:bg-gray-200"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="flex-[2] bg-[#5C1E1E] text-white py-3.5 rounded-2xl text-xs font-bold shadow-lg shadow-[#5C1E1E]/30 hover:bg-[#4A1717] transition flex items-center justify-center gap-2"
                >
                  <span>Review Doorstep Pickup & Submit</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

            </div>
          )}

          {/* STEP 3: Doorstep Pickup Review & Final Submission */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              <div className="bg-[#FAF5EC] p-5 rounded-2xl border border-[#E8DFC9] space-y-3">
                <div className="flex items-center gap-2 font-bold text-xs text-[#5C1E1E] uppercase tracking-wider">
                  <MapPin className="w-4 h-4 text-amber-600" /> Doorstep Pickup Address (Kathmandu Courier)
                </div>
                <div className="text-xs text-gray-700 space-y-1 bg-white p-3.5 rounded-xl border border-[#E8DFC9]">
                  <div className="font-bold text-[#2D2118]">{order.address?.fullName || "Valued Customer"}</div>
                  <div>Phone: {order.address?.phone || "+977 9715102007"}</div>
                  <div>Address: {order.address?.line1}, {order.address?.city}, {order.address?.state} {order.address?.pincode}</div>
                </div>
              </div>

              {/* Summary of Return & Refund Destination */}
              <div className="bg-white p-4 rounded-2xl border border-[#E8DFC9] space-y-2 text-xs">
                <div className="font-bold text-[#2D2118]">Return Summary:</div>
                <div className="flex justify-between text-gray-600">
                  <span>Return Reason:</span>
                  <span className="font-semibold text-[#5C1E1E]">{reason}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Refund Amount:</span>
                  <span className="font-black text-emerald-700 text-sm">₹{order.total}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Refund Destination:</span>
                  <span className="font-bold text-[#2D2118]">
                    {refundMethod === "bank_account" ? `${bankName} (${accountHolderName})` : refundMethod === "digital_wallet" ? `${walletType} (${walletNumber})` : "Original COD Source"}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex-1 bg-gray-100 text-gray-700 py-3.5 rounded-2xl text-xs font-bold hover:bg-gray-200"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-[2] bg-[#5C1E1E] hover:bg-[#4A1717] text-white py-3.5 rounded-2xl text-xs font-bold shadow-lg shadow-[#5C1E1E]/30 transition active:scale-95 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 text-amber-300" />
                  <span>{loading ? "Submitting Request..." : "Confirm & Request Return Pickup"}</span>
                </button>
              </div>

            </div>
          )}

        </form>

      </div>
    </div>
  );
}
