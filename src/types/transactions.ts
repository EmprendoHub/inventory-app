// types/transactions.ts

export type TransactionGroupType = {
  accounts: { id: string; code: string; name: string }[];
  transactions: TransactionType[];
  transaction?: TransactionType;
};

export type TransactionType = {
  id: string;
  date: Date;
  description: string;
  amount: number;
  type?: string;
  reference: string | null;
  accountId: string;
  orderId: string | null;
  purchaseOrderId: string | null;
  expenseId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type TransactionFormState = {
  errors?: Record<string, string[]>;
  success: boolean;
  message: string;
};
