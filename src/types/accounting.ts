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
