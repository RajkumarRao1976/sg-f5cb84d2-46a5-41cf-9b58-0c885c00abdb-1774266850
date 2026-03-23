export const EXCHANGE_RATES = {
  USD: 83.5,
  EURO: 91.2,
  INR: 1,
} as const;

export function convertToINR(amount: number, currency: "USD" | "EURO" | "INR"): number {
  return Number((amount * EXCHANGE_RATES[currency]).toFixed(2));
}

export function formatCurrency(amount: number, currency: "USD" | "EURO" | "INR"): string {
  const symbols = { USD: "$", EURO: "€", INR: "₹" };
  return `${symbols[currency]}${amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}