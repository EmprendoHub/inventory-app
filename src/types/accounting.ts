// types/accounting.ts

export type AccountGroupType = {
  accounts: { id: string; code: string; name: string; type: string }[];
  account?: AccountOneType;
};

export type AccountOneType = {
  id: string;
  code: string;
  name: string;
  type: string;
  description: string | null;
  parentAccount: string | null;
  balance: number;
  createdAt: Date;
  updatedAt: Date;
};

export type AccountingFormState = {
  errors?: Record<string, string[]>;
  success: boolean;
  message: string;
};

export type CashRegisterFormData = {
  name: string;
};

export type CashRegisterResponse = {
  id: string;
  name: string;
  balance: number;
  fund: number;
  createdAt: Date;
  updatedAt: Date;
  userId: string | null;
  managerId: string | null;
};

export type CashTransactionFormData = {
  type: "DEPOSIT" | "WITHDRAWAL";
  amount: number;
  description?: string;
  cashRegisterId: string;
};

export type CashTransactionResponse = {
  id: string;
  type: "DEPOSIT" | "WITHDRAWAL";
  amount: number;
  description: string | null;
  cashRegisterId: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string | null;
};

export type CashAuditFormData = {
  cashRegisterId: string;
  startBalance: number;
  endBalance: number;
  auditDate: string; // ISO date string
};

export type CashAuditResponse = {
  id: string;
  cashRegisterId: string;
  startBalance: number;
  endBalance: number;
  auditDate: Date;
  createdAt: Date;
  updatedAt: Date;
  managerId: string | null;
  userId: string | null;
};
