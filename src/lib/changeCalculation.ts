// Utility functions for calculating change from available denominations

import { CashBreakdown } from "@/types/pos";

export interface ChangeResult {
  success: boolean;
  changeGiven: CashBreakdown | null;
  remainingAmount: number;
  error?: string;
}

/**
 * Calculate optimal change distribution from available cash register denominations
 * @param changeAmount - The amount of change needed
 * @param availableBreakdown - Current cash register breakdown
 * @returns ChangeResult with the denominations to give as change
 */
export function calculateOptimalChange(
  changeAmount: number,
  availableBreakdown: CashBreakdown | null
): ChangeResult {
  if (!availableBreakdown || changeAmount <= 0) {
    return {
      success: changeAmount === 0,
      changeGiven: null,
      remainingAmount: changeAmount,
      error: changeAmount < 0 ? "Invalid change amount" : undefined,
    };
  }

  // Create a working copy of available denominations
  const available = JSON.parse(JSON.stringify(availableBreakdown));

  // Initialize the change breakdown
  const changeBreakdown: CashBreakdown = {
    bills: {
      thousands: { value: 1000, count: 0, total: 0 },
      fiveHundreds: { value: 500, count: 0, total: 0 },
      twoHundreds: { value: 200, count: 0, total: 0 },
      hundreds: { value: 100, count: 0, total: 0 },
      fifties: { value: 50, count: 0, total: 0 },
      twenties: { value: 20, count: 0, total: 0 },
      tens: { value: 10, count: 0, total: 0 },
      fives: { value: 5, count: 0, total: 0 },
      ones: { value: 1, count: 0, total: 0 },
    },
    coins: {
      peso20: { value: 20, count: 0, total: 0 },
      peso10: { value: 10, count: 0, total: 0 },
      peso5: { value: 5, count: 0, total: 0 },
      peso2: { value: 2, count: 0, total: 0 },
      peso1: { value: 1, count: 0, total: 0 },
      centavos50: { value: 0.5, count: 0, total: 0 },
      centavos20: { value: 0.2, count: 0, total: 0 },
      centavos10: { value: 0.1, count: 0, total: 0 },
    },
    totalCash: 0,
  };

  let remainingChange = Math.round(changeAmount * 100) / 100; // Round to avoid floating point issues

  // Define denomination order (largest to smallest)
  const denominations = [
    { section: "bills", key: "thousands", value: 1000 },
    { section: "bills", key: "fiveHundreds", value: 500 },
    { section: "bills", key: "twoHundreds", value: 200 },
    { section: "bills", key: "hundreds", value: 100 },
    { section: "bills", key: "fifties", value: 50 },
    { section: "bills", key: "twenties", value: 20 },
    { section: "coins", key: "peso10", value: 10 },
    { section: "coins", key: "peso5", value: 5 },
    { section: "coins", key: "peso2", value: 2 },
    { section: "coins", key: "peso1", value: 1 },
    { section: "coins", key: "centavos50", value: 0.5 },
    { section: "coins", key: "centavos20", value: 0.2 },
    { section: "coins", key: "centavos10", value: 0.1 },
  ];

  // Calculate change using greedy algorithm (largest denominations first)
  for (const denom of denominations) {
    const availableCount =
      (available as any)[denom.section][denom.key].count || 0;
    const neededCount = Math.floor(remainingChange / denom.value);
    const usedCount = Math.min(availableCount, neededCount);

    if (usedCount > 0) {
      (changeBreakdown as any)[denom.section][denom.key].count = usedCount;
      (changeBreakdown as any)[denom.section][denom.key].total =
        usedCount * denom.value;
      remainingChange =
        Math.round((remainingChange - usedCount * denom.value) * 100) / 100;
    }
  }

  // Calculate total change given
  const totalChangeGiven =
    Object.values(changeBreakdown.bills).reduce(
      (sum, bill) => sum + bill.total,
      0
    ) +
    Object.values(changeBreakdown.coins).reduce(
      (sum, coin) => sum + coin.total,
      0
    );

  changeBreakdown.totalCash = totalChangeGiven;

  const success = remainingChange < 0.01; // Allow for small floating point errors

  return {
    success,
    changeGiven: success ? changeBreakdown : null,
    remainingAmount: success ? 0 : remainingChange,
    error: success
      ? undefined
      : `No se puede dar cambio completo. Faltan $${remainingChange.toFixed(
          2
        )}`,
  };
}

/**
 * Subtract change denominations from cash register breakdown
 * @param existing - Current cash register breakdown
 * @param changeGiven - Denominations to subtract (what was given as change)
 * @returns Updated cash register breakdown
 */
export function subtractChangeFromRegister(
  existing: CashBreakdown | null,
  changeGiven: CashBreakdown
): CashBreakdown | null {
  if (!existing) return null;

  const result: CashBreakdown = JSON.parse(JSON.stringify(existing));

  // Subtract bills
  Object.keys(changeGiven.bills).forEach((key) => {
    if ((result.bills as any)[key] && (changeGiven.bills as any)[key]) {
      (result.bills as any)[key].count = Math.max(
        0,
        (result.bills as any)[key].count - (changeGiven.bills as any)[key].count
      );
      (result.bills as any)[key].total =
        (result.bills as any)[key].count * (result.bills as any)[key].value;
    }
  });

  // Subtract coins
  Object.keys(changeGiven.coins).forEach((key) => {
    if ((result.coins as any)[key] && (changeGiven.coins as any)[key]) {
      (result.coins as any)[key].count = Math.max(
        0,
        (result.coins as any)[key].count - (changeGiven.coins as any)[key].count
      );
      (result.coins as any)[key].total =
        (result.coins as any)[key].count * (result.coins as any)[key].value;
    }
  });

  // Recalculate total
  result.totalCash =
    Object.values(result.bills).reduce((sum, bill) => sum + bill.total, 0) +
    Object.values(result.coins).reduce((sum, coin) => sum + coin.total, 0);

  return result;
}

/**
 * Format change breakdown for display purposes
 * @param changeBreakdown - The change breakdown to format
 * @returns Formatted string for display
 */
export function formatChangeBreakdown(changeBreakdown: CashBreakdown): string {
  const parts: string[] = [];

  // Format bills
  Object.entries(changeBreakdown.bills).forEach(([, denom]) => {
    if (denom.count > 0) {
      parts.push(`${denom.count}x$${denom.value}`);
    }
  });

  // Format coins
  Object.entries(changeBreakdown.coins).forEach(([, denom]) => {
    if (denom.count > 0) {
      const valueStr =
        denom.value < 1 ? `$${denom.value.toFixed(2)}` : `$${denom.value}`;
      parts.push(`${denom.count}x${valueStr}`);
    }
  });

  return parts.length > 0 ? parts.join(", ") : "Sin cambio";
}
