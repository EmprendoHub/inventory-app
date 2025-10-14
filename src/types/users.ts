// types/users.ts

import { CashTransactionResponse } from "./accounting";

export type UserGroupType = {
  roles: { name: string; value: string; label: string }[];
  user?: UserType;
};

export type UserType = {
  id: string;
  active: boolean;
  name: string;
  email: string;
  verificationToken: string | null;
  authCode: string | null;
  phone: string | null;
  stripeId: string | null;
  password: string | null;
  avatar: string | null;
  loginAttempts: number;
  points: number | null;
  role: string | null;
  warehouseId: string | null;
  warehouse?: {
    id: string;
    title: string;
    code: string;
    type: string;
    status: string;
  } | null;
  createdAt: Date;
  updatedAt: Date;
  cashRegister?: CashTransactionResponse | null;
};

export type UserFormState = {
  errors?: Record<string, string[]>;
  success: boolean;
  message: string;
};
