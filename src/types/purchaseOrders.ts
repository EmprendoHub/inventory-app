// types/purchaseOrders.ts

import { supplierType } from "./categories";

export type PurchaseOrderGroupType = {
  suppliers: { id: string; name: string }[];
  items: { id: string; name: string; sku: string }[];
  purchaseOrder?: PurchaseOrderType;
  purchaseOrderItems?: PurchaseOrderItemType[];
  formType?: string | null;
};

export type PurchaseOrderType = {
  id: string;
  poNumber?: string | null;
  supplierId?: string;
  supplier?: supplierType;
  status?: string;
  totalAmount?: number;
  taxAmount?: number;
  notes?: string | null;
  expectedDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  items?: PurchaseOrderItemType[];
};

export type PurchaseOrderItemType = {
  id: string;
  purchaseOrderId: string;
  itemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  tax: number;
  receivedQty: number;
  createdAt: Date;
  updatedAt: Date;
};

export type PurchaseOrderFormState = {
  errors?: Record<string, string[]>;
  success: boolean;
  message: string;
};
