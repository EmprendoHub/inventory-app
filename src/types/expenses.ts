// types/expenses.ts

export type ExpenseGroupType = {
  expenses: ExpenseType[];
  expense?: ExpenseType;
};

export type ExpenseType = {
  id: string;
  type: string;
  amount: number;
  description: string | null;
  reference: string | null;
  status: string;
  paymentDate: Date | null;
  deliveryId: string | null;
  driverId: string | null;
  truckId: string | null;
  externalShipId: string | null;
  supplierId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ExpenseFormState = {
  errors?: Record<string, string[]>;
  success: boolean;
  message: string;
};
