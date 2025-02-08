// types/inventoryCounts.ts

export type InventoryCountGroupType = {
  warehouses: { id: string; title: string; description: string }[];
  items: { id: string; name: string; sku: string }[];
  inventoryCount?: InventoryCountType;
  countItems?: CountItemType[];
};

export type InventoryCountType = {
  id: string;
  warehouseId: string;
  status: string;
  countDate: Date;
  notes?: string;
  createdBy: string;
  approvedBy?: string;
  createdAt: Date;
  updatedAt: Date;
  countItems: CountItemType[];
};

export type CountItemType = {
  id: string;
  inventoryCountId: string;
  itemId: string;
  expectedQty: number;
  actualQty: number;
  difference: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type InventoryCountFormState = {
  errors?: Record<string, string[]>;
  success: boolean;
  message: string;
};
