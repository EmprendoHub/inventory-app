// types/accounting.ts

export type AccountGroupType = {
  accounts: { id: string; code: string; name: string; type: string }[];
  account?: AccountType;
};

export type AccountType = {
  id: string;
  code: string;
  name: string;
  type: string;
  description?: string;
  parentAccount?: string;
  balance: number;
  createdAt: Date;
  updatedAt: Date;
};

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
  type: string;
  reference?: string;
  accountId: string;
  orderId?: string;
  purchaseOrderId?: string;
  expenseId?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type ExpenseGroupType = {
  expenses: ExpenseType[];
  expense?: ExpenseType;
};

export type ExpenseType = {
  id: string;
  type: string;
  amount: number;
  description?: string;
  reference?: string;
  status: string;
  paymentDate?: Date;
  deliveryId?: string;
  driverId?: string;
  truckId?: string;
  externalShipId?: string;
  supplierId?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type AccountingFormState = {
  errors?: Record<string, string[]>;
  success: boolean;
  message: string;
};
