"use client";

import { createContext, useContext } from "react";

const CurrencyContext = createContext<string>("GHS");

export function CurrencyProvider({ currency, children }: { currency: string; children: React.ReactNode }) {
  return <CurrencyContext.Provider value={currency}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  return useContext(CurrencyContext);
}

export function useFormatCurrency() {
  const currency = useCurrency();
  return (amount: number | string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    }).format(Number(amount));
  };
}
