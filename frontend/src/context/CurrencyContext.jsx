import React, { createContext, useContext, useState } from "react";

const CurrencyContext = createContext();

export const CURRENCIES = {
  NPR: { code: "NPR", symbol: "रू", rate: 1.0, label: "NPR (रू)" },
  INR: { code: "INR", symbol: "₹", rate: 0.625, label: "INR (₹)" },
  USD: { code: "USD", symbol: "$", rate: 0.0075, label: "USD ($)" }
};

export function CurrencyProvider({ children }) {
  const [currency, setCurrency] = useState(() => {
    try {
      const stored = localStorage.getItem("reevanta_currency");
      return CURRENCIES[stored] ? CURRENCIES[stored] : CURRENCIES.NPR;
    } catch {
      return CURRENCIES.NPR;
    }
  });

  const changeCurrency = (code) => {
    if (CURRENCIES[code]) {
      setCurrency(CURRENCIES[code]);
      try {
        localStorage.setItem("reevanta_currency", code);
      } catch (e) {}
    }
  };

  const formatPrice = (priceInNpr) => {
    const amount = (Number(priceInNpr) || 0) * currency.rate;
    if (currency.code === "USD") {
      return `${currency.symbol}${amount.toFixed(2)}`;
    }
    return `${currency.symbol} ${Math.round(amount).toLocaleString()}`;
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        changeCurrency,
        formatPrice,
        currencies: CURRENCIES
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
