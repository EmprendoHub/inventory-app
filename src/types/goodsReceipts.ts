// types/goodsReceipts.ts

import { PurchaseOrderType } from "./purchaseOrders";

export type GoodsReceiptGroupType = {
  purchaseOrders: PurchaseOrderType[];
  items: { id: string; name: string; sku: string }[];
  goodsReceipt?: GoodsReceiptType;
  receivedItems?: ReceivedItemType[];
};

export type GoodsReceiptType = {
  id: string;
  receiptNumber: string;
  purchaseOrderId: string;
  receivedDate: Date;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
  items?: ReceivedItemType[];
};

export type ReceivedItemType = {
  id: string;
  goodsReceiptId: string;
  itemId: string;
  quantity: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type GoodsReceiptFormState = {
  errors?: Record<string, string[]>;
  success: boolean;
  message: string;
};
