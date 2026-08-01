import React, { useState, useEffect, useCallback } from "react";
import { X, Trash2, Plus, Minus, ArrowRight, CheckCircle2, ShieldCheck, MapPin, Ticket, Sparkles, ChevronDown, ChevronUp, Truck, User } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../services/api";
import { AddressPicker } from "./AddressPicker";
import { toast } from "sonner";

export function CartDrawer({ onOrderPlaced }) {
  const { cart, removeFromCart, updateCartQty, saveForLater, savedForLater, moveSavedToCart, removeSavedForLater, clearCart, isCartOpen, setIsCartOpen, cartSubtotal } = useCart();
  const { currentUser, setShowAuthModal } = useAuth();

  const [checkoutStep, setCheckoutStep] = useState(1); // 1: Cart Items, 2: Address & Payment
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [orderNotes, setOrderNotes] = useState("");
  const [placingOrder, setPlacingOrder] = useState(false);

  // Guest Checkout State
  const [guestAddress, setGuestAddress] = useState({
    fullName: "",
    phone: "",
    city: "Kathmandu",
    line1: "",
    pincode: "44600"
  });

  // Shipping Estimate State
  const [shippingEstimate, setShippingEstimate] = useState({
    shippingFee: 0,
    isFreeShipping: true,
    method: "Express Free Delivery",
    estimatedDeliveryDate: "Monday, Aug 3, 2026"
  });

  // Voucher State
  const [activeVouchers, setActiveVouchers] = useState([]);
  const [voucherCodeInput, setVoucherCodeInput] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [showVoucherList, setShowVoucherList] = useState(false);
  const [applyingVoucher, setApplyingVoucher] = useState(false);

  // Load Active Vouchers & Addresses
  useEffect(() => {
    if (isCartOpen) {
      apiFetch("/vouchers/active")
        .then((vouchers) => {
          setActiveVouchers(vouchers || []);
        })
        .catch(() => {});
    }
  }, [isCartOpen]);

  useEffect(() => {
    if (currentUser) {
      apiFetch("/addresses")
        .then((addrs) => {
          setAddresses(addrs || []);
          const def = addrs.find((a) => a.isDefault) || addrs[0];
          if (def) setSelectedAddressId(def.id);
        })
        .catch(() => {});
    }
  }, [currentUser]);

  // Recalculate Shipping Estimate on City/Subtotal Change
  useEffect(() => {
    const selectedAddr = addresses.find((a) => a.id === selectedAddressId) || guestAddress;
    const city = selectedAddr?.city || "Kathmandu";
    apiFetch("/shipping/estimate", {
      method: "POST",
      body: { city, cartSubtotal }
    })
      .then(setShippingEstimate)
      .catch(() => {});
  }, [selectedAddressId, addresses, guestAddress.city, cartSubtotal]);

  // Auto-apply eligible voucher
  const evaluateAutoVoucher = useCallback(() => {
    if (!appliedVoucher && activeVouchers.length > 0 && cartSubtotal > 0) {
      const autoVoucher = activeVouchers.find(
        (v) => v.autoApply && v.isActive && cartSubtotal >= (v.minOrderValue || 0)
      );
      if (autoVoucher) {
        apiFetch("/vouchers/apply", {
          method: "POST",
          body: {
            code: autoVoucher.code,
            cartTotal: cartSubtotal,
            customerEmail: currentUser?.email
          }
        })
        .then((res) => {
          setAppliedVoucher(res);
          toast.success(`🎉 Auto-Applied Voucher '${res.code}'! Saved ₹${res.discountAmount}`);
        })
        .catch(() => {});
      }
    }
  }, [activeVouchers, cartSubtotal, appliedVoucher, currentUser]);

  useEffect(() => {
    evaluateAutoVoucher();
  }, [evaluateAutoVoucher]);

  const handleApplyVoucherCode = async (codeToApply) => {
    if (!codeToApply || !codeToApply.trim()) {
      toast.error("Please enter a voucher code");
      return;
    }
    setApplyingVoucher(true);
    try {
      const res = await apiFetch("/vouchers/apply", {
        method: "POST",
        body: {
          code: codeToApply.trim(),
          cartTotal: cartSubtotal,
          customerEmail: currentUser?.email
        }
      });
      setAppliedVoucher(res);
      setVoucherCodeInput("");
      setShowVoucherList(false);
      toast.success(res.message || `Voucher '${res.code}' Applied!`);
    } catch (err) {
      toast.error(err.message || "Invalid voucher code");
    } finally {
      setApplyingVoucher(false);
    }
  };

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    toast.info("Voucher removed from cart");
  };

  if (!isCartOpen) return null;

  const discountAmount = appliedVoucher ? appliedVoucher.discountAmount : 0;
  const shippingFee = shippingEstimate ? shippingEstimate.shippingFee : 0;
  const totalAmount = Math.max(0, cartSubtotal - discountAmount + shippingFee);

  const handlePlaceOrder = async () => {
    let finalAddr = null;
    if (currentUser) {
      finalAddr = addresses.find((a) => a.id === selectedAddressId);
      if (!finalAddr) {
        toast.error("Please select a delivery address");
        return;
      }
    } else {
      if (!guestAddress.fullName || !guestAddress.phone || !guestAddress.line1) {
        toast.error("Please complete all guest delivery address fields");
        return;
      }
      finalAddr = { ...guestAddress, label: "Guest Shipping Address" };
    }

    setPlacingOrder(true);
    try {
      const payload = {
        items: cart.map((item) => ({
          productId: item.id,
          name: item.name,
          price: item.price,
          qty: item.qty,
          image: item.image,
          selectedSize: item.selectedSize || "",
          selectedColor: item.selectedColor || "",
        })),
        subtotal: cartSubtotal,
        discount: discountAmount,
        voucherCode: appliedVoucher ? appliedVoucher.code : "",
        shipping: shippingFee,
        total: totalAmount,
        address: finalAddr,
        paymentMethod: "COD",
        notes: orderNotes,
      };

      const createdOrder = await apiFetch("/orders", {
        method: "POST",
        body: payload,
      });

      toast.success(`Order #${createdOrder.order_number} placed successfully!`);
      clearCart();
      setAppliedVoucher(null);
      setIsCartOpen(false);
      setCheckoutStep(1);
      if (onOrderPlaced) onOrderPlaced(createdOrder);
    } catch (err) {
      toast.error(err.message || "Failed to place order");
    } finally {
      setPlacingOrder(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between border-l border-[#E8DFC9]">
          
          {/* Header */}
          <div className="p-6 bg-[#FAF5EC] border-b border-[#E8DFC9] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-[#2D2118]">
                {checkoutStep === 1 ? "Shopping Cart" : "Checkout Details"}
              </h2>
              <span className="bg-[#5C1E1E] text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {cart.length} items
              </span>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-gray-500 hover:text-black shadow-sm transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {cart.length === 0 ? (
              <div className="text-center py-16 space-y-4">
                <div className="w-16 h-16 bg-[#FAF5EC] text-[#8B7355] rounded-full mx-auto flex items-center justify-center">
                  🛒
                </div>
                <h3 className="font-bold text-[#2D2118]">Your cart is empty</h3>
                <p className="text-xs text-gray-500 max-w-xs mx-auto">
                  Explore our luxury ethnic collection and add your favorite items.
                </p>
              </div>
            ) : checkoutStep === 1 ? (
              /* Step 1: Cart Items List & Vouchers */
              <div className="space-y-6">
                <div className="space-y-4">
                  {cart.map((item, idx) => (
                    <div
                      key={`${item.id}-${idx}`}
                      className="flex gap-4 bg-[#FAF5EC]/50 p-3 rounded-2xl border border-[#E8DFC9]/60 relative group"
                    >
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-20 h-24 object-cover rounded-xl bg-gray-100"
                      />
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <h4 className="font-bold text-xs text-[#2D2118] line-clamp-1">{item.name}</h4>
                          <div className="text-[11px] text-gray-500 space-x-2 mt-0.5">
                            {item.selectedSize && <span>Size: {item.selectedSize}</span>}
                            {item.selectedColor && <span>Color: {item.selectedColor}</span>}
                          </div>
                          <div className="font-extrabold text-sm text-[#2D2118] mt-1">₹{item.price}</div>
                        </div>

                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center border border-gray-300 rounded-lg bg-white">
                            <button
                              onClick={() => updateCartQty(idx, -1)}
                              className="p-1 hover:bg-gray-100 text-gray-600"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="px-2 text-xs font-bold">{item.qty}</span>
                            <button
                              onClick={() => updateCartQty(idx, 1)}
                              className="p-1 hover:bg-gray-100 text-gray-600"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => saveForLater(idx)}
                              className="text-[10px] font-bold text-[#8B7355] hover:text-[#5C1E1E] underline"
                            >
                              Save for Later
                            </button>
                            <button
                              onClick={() => removeFromCart(idx)}
                              className="text-red-500 hover:text-red-700 p-1"
                              title="Remove item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* SAVED FOR LATER SECTION */}
                {savedForLater && savedForLater.length > 0 && (
                  <div className="bg-[#FAF5EC] border border-[#E8DFC9] rounded-2xl p-4 space-y-3">
                    <h4 className="text-xs font-black text-[#2D2118] uppercase tracking-wider">
                      Saved for Later ({savedForLater.length})
                    </h4>
                    <div className="space-y-2">
                      {savedForLater.map((sItem, sIdx) => (
                        <div
                          key={`saved-${sItem.id}-${sIdx}`}
                          className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-[#E8DFC9]/60 text-xs"
                        >
                          <div className="flex items-center gap-3">
                            <img src={sItem.image} alt={sItem.name} className="w-10 h-12 object-cover rounded-lg" />
                            <div>
                              <div className="font-bold text-[#2D2118] line-clamp-1">{sItem.name}</div>
                              <div className="font-extrabold text-[#5C1E1E]">₹{sItem.price}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => moveSavedToCart(sIdx)}
                              className="bg-[#5C1E1E] text-white px-2.5 py-1 rounded-lg text-[10px] font-bold hover:bg-[#4A1717]"
                            >
                              Move to Cart
                            </button>
                            <button
                              onClick={() => removeSavedForLater(sIdx)}
                              className="text-red-500 hover:text-red-700 p-1"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* VOUCHER / COUPON SECTION */}
                <div className="bg-[#FAF5EC] border border-[#E8DFC9] rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[#5C1E1E] font-bold text-xs uppercase tracking-wider">
                      <Ticket className="w-4 h-4 text-amber-600" /> Apply Voucher & Discount
                    </div>
                    {activeVouchers.length > 0 && (
                      <button
                        onClick={() => setShowVoucherList(!showVoucherList)}
                        className="text-[11px] text-[#5C1E1E] font-bold hover:underline flex items-center gap-1"
                      >
                        <span>{activeVouchers.length} Coupons</span>
                        {showVoucherList ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>

                  {/* Applied Voucher Banner */}
                  {appliedVoucher ? (
                    <div className="bg-emerald-50 border border-emerald-300 p-3 rounded-xl flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div>
                          <div className="font-black text-emerald-950 flex items-center gap-1">
                            <span>Code: {appliedVoucher.code}</span>
                            <span className="bg-emerald-600 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold">APPLIED</span>
                          </div>
                          <p className="text-[10px] text-emerald-700">Saved ₹{appliedVoucher.discountAmount} on your order!</p>
                        </div>
                      </div>
                      <button
                        onClick={handleRemoveVoucher}
                        className="text-red-600 hover:text-red-800 text-[11px] font-bold underline"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    /* Enter Custom Code Input */
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="ENTER VOUCHER CODE"
                        value={voucherCodeInput}
                        onChange={(e) => setVoucherCodeInput(e.target.value.toUpperCase())}
                        className="flex-1 bg-white border border-[#E8DFC9] rounded-xl px-3 py-2 text-xs font-bold tracking-wider text-[#2D2118] focus:outline-none focus:border-[#5C1E1E]"
                      />
                      <button
                        onClick={() => handleApplyVoucherCode(voucherCodeInput)}
                        disabled={applyingVoucher || !voucherCodeInput.trim()}
                        className="bg-[#5C1E1E] hover:bg-[#4A1717] text-white px-4 py-2 rounded-xl text-xs font-bold shadow transition disabled:opacity-50"
                      >
                        Apply
                      </button>
                    </div>
                  )}

                  {/* Available Coupons Accordion */}
                  {showVoucherList && (
                    <div className="pt-2 border-t border-[#E8DFC9] space-y-2 animate-in fade-in duration-200">
                      <span className="text-[10px] font-bold uppercase text-gray-500 block">Available Offers:</span>
                      {activeVouchers.map((v) => {
                        const isEligible = cartSubtotal >= (v.minOrderValue || 0);
                        return (
                          <div
                            key={v.id}
                            className={`p-2.5 rounded-xl border text-xs flex justify-between items-center transition ${
                              isEligible ? "bg-white border-emerald-300" : "bg-gray-50 border-gray-200 text-gray-400"
                            }`}
                          >
                            <div>
                              <div className="font-black text-[#2D2118] flex items-center gap-1">
                                <span>{v.code}</span>
                                {v.autoApply && <span className="bg-amber-100 text-amber-900 text-[9px] font-bold px-1.5 py-0.2 rounded-full">AUTO</span>}
                              </div>
                              <p className="text-[10px] text-gray-600 line-clamp-1">{v.description}</p>
                            </div>
                            <button
                              disabled={!isEligible}
                              onClick={() => handleApplyVoucherCode(v.code)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition ${
                                isEligible ? "bg-[#5C1E1E] text-white border-[#5C1E1E]" : "bg-gray-200 text-gray-400 border-gray-200"
                              }`}
                            >
                              Apply
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>
            ) : (
              /* Step 2: Delivery Address & Payment (GUEST CHECKOUT SUPPORTED) */
              <div className="space-y-6">
                {!currentUser ? (
                  /* GUEST CHECKOUT FORM */
                  <div className="bg-[#FAF5EC] border border-[#E8DFC9] p-4 rounded-2xl space-y-3 text-xs">
                    <div className="flex items-center justify-between border-b border-[#E8DFC9] pb-2">
                      <span className="font-black text-[#2D2118] uppercase tracking-wider flex items-center gap-1.5">
                        <User className="w-4 h-4 text-[#5C1E1E]" /> Guest Checkout Details
                      </span>
                      <button
                        onClick={() => setShowAuthModal(true)}
                        className="text-[11px] font-bold text-[#5C1E1E] underline"
                      >
                        Sign in for Saved Addresses
                      </button>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <label className="font-bold text-gray-600 block mb-0.5">Full Name *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Aarav Sharma"
                          value={guestAddress.fullName}
                          onChange={(e) => setGuestAddress({ ...guestAddress, fullName: e.target.value })}
                          className="w-full bg-white border border-[#E8DFC9] rounded-xl p-2.5 font-semibold text-[#2D2118]"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="font-bold text-gray-600 block mb-0.5">Phone (+977 / +91) *</label>
                          <input
                            type="tel"
                            required
                            placeholder="9715102007"
                            value={guestAddress.phone}
                            onChange={(e) => setGuestAddress({ ...guestAddress, phone: e.target.value })}
                            className="w-full bg-white border border-[#E8DFC9] rounded-xl p-2.5 font-semibold text-[#2D2118]"
                          />
                        </div>

                        <div>
                          <label className="font-bold text-gray-600 block mb-0.5">City / Location *</label>
                          <select
                            value={guestAddress.city}
                            onChange={(e) => setGuestAddress({ ...guestAddress, city: e.target.value })}
                            className="w-full bg-white border border-[#E8DFC9] rounded-xl p-2.5 font-bold text-[#2D2118]"
                          >
                            <option value="Kathmandu">Kathmandu Valley</option>
                            <option value="Lalitpur">Lalitpur</option>
                            <option value="Bhaktapur">Bhaktapur</option>
                            <option value="Pokhara">Pokhara</option>
                            <option value="Biratnagar">Biratnagar</option>
                            <option value="Chitwan">Chitwan</option>
                            <option value="Other">Other Nepal District</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="font-bold text-gray-600 block mb-0.5">Street Address Line 1 *</label>
                        <input
                          type="text"
                          required
                          placeholder="House / Street / Tole / Landmark"
                          value={guestAddress.line1}
                          onChange={(e) => setGuestAddress({ ...guestAddress, line1: e.target.value })}
                          className="w-full bg-white border border-[#E8DFC9] rounded-xl p-2.5 font-semibold text-[#2D2118]"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h3 className="text-xs font-bold text-[#2D2118] uppercase tracking-wider mb-3">
                      Select Saved Shipping Address
                    </h3>
                    <AddressPicker
                      addresses={addresses}
                      selectedAddressId={selectedAddressId}
                      onSelectAddress={(addr) => setSelectedAddressId(addr.id)}
                      onRefreshAddresses={() => {
                        apiFetch("/addresses").then(setAddresses).catch(() => {});
                      }}
                      showAddressForm={showAddressForm}
                      setShowAddressForm={setShowAddressForm}
                      editingAddress={editingAddress}
                      setEditingAddress={setEditingAddress}
                    />
                  </div>
                )}

                {/* REAL-TIME SHIPPING ESTIMATOR BANNER */}
                {shippingEstimate && (
                  <div className="bg-[#FAF5EC] border border-[#E8DFC9] p-3.5 rounded-2xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <Truck className="w-5 h-5 text-[#5C1E1E] shrink-0" />
                      <div>
                        <div className="font-bold text-[#2D2118]">{shippingEstimate.method}</div>
                        <div className="text-[11px] text-gray-600">Arrival by <strong>{shippingEstimate.estimatedDeliveryDate}</strong></div>
                      </div>
                    </div>
                    <span className="font-black text-[#5C1E1E]">
                      {shippingEstimate.isFreeShipping ? "FREE" : `₹${shippingEstimate.shippingFee}`}
                    </span>
                  </div>
                )}

                {/* Payment Option */}
                <div>
                  <h3 className="text-xs font-bold text-[#2D2118] uppercase tracking-wider mb-2">
                    Payment Method
                  </h3>
                  <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold text-xs">
                        💵
                      </div>
                      <div>
                        <div className="font-bold text-xs text-emerald-900">Cash on Delivery (COD)</div>
                        <div className="text-[11px] text-emerald-700">Pay when your order arrives at your door.</div>
                      </div>
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  </div>
                </div>

                {/* Optional Notes */}
                <div>
                  <label className="text-xs font-bold text-[#2D2118] uppercase tracking-wider block mb-1">
                    Delivery Notes / Instructions
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Leave at front desk or call before delivery"
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    className="w-full bg-[#FAF5EC] border border-[#E8DFC9] rounded-2xl p-3 text-xs text-[#2D2118]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer Summary & Action */}
          {cart.length > 0 && (
            <div className="p-6 bg-[#FAF5EC] border-t border-[#E8DFC9] space-y-4">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Cart Subtotal</span>
                  <span className="font-bold text-[#2D2118]">₹{cartSubtotal}</span>
                </div>
                
                {appliedVoucher && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Voucher Discount ({appliedVoucher.code})</span>
                    <span>-₹{discountAmount}</span>
                  </div>
                )}

                <div className="flex justify-between text-gray-600">
                  <span>Shipping Fee ({shippingEstimate?.method || "Standard"})</span>
                  <span className="font-bold text-emerald-700">
                    {shippingEstimate?.isFreeShipping ? "FREE" : `₹${shippingFee}`}
                  </span>
                </div>


                <div className="flex justify-between text-sm font-black text-[#2D2118] pt-2 border-t border-[#E8DFC9]">
                  <span>Total Payable Amount</span>
                  <span>₹{totalAmount}</span>
                </div>
              </div>

              {checkoutStep === 1 ? (
                <button
                  onClick={() => setCheckoutStep(2)}
                  className="w-full bg-[#2D2118] hover:bg-[#5C1E1E] text-white py-3.5 rounded-2xl text-xs font-bold shadow-lg transition flex items-center justify-center gap-2"
                >
                  <span>Proceed to Delivery</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => setCheckoutStep(1)}
                    className="px-4 py-3 rounded-2xl border border-gray-300 text-xs font-bold text-gray-700"
                  >
                    Back
                  </button>
                  <button
                    onClick={handlePlaceOrder}
                    disabled={placingOrder}
                    className="flex-1 bg-[#5C1E1E] hover:bg-[#4A1717] text-white py-3.5 rounded-2xl text-xs font-bold shadow-lg transition flex items-center justify-center gap-2"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>{placingOrder ? "Placing Order..." : "Confirm & Place Order"}</span>
                  </button>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
