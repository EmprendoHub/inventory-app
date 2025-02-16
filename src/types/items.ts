import { ItemStatus } from "@prisma/client";

export type ItemCompoundType = {
  categories: { id: string; title: string; description: string }[];
  brands: { id: string; name: string; description: string }[];
  units: { id: string; title: string; abbreviation: string }[];
  warehouses: { id: string; title: string }[];
  suppliers: {
    id: string;
    name: string;
    phone: string;
    email: string;
    address: string;
    contactPerson: string;
    supplierCode: string;
    paymentTerms: string;
    taxId: string;
    notes: string;
    image: string;
  }[];
  item?: ItemType;
};

export type ItemType = {
  id: string;
  name: string;
  mainImage: string;
  status: ItemStatus;
  description: string;
  sku: string;
  barcode: string | null;
  dimensions: string | null;
  price: number;
  cost: number;
  minStock: number;
  images: string[];
  weight: number | null;
  maxStock: number | null;
  reorderPoint: number | null;
  tax: number;
  notes: string | null;
  supplierId: string;
  isDigital: boolean;
  categoryId: string;
  brandId: string;
  unitId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type ItemGroupType = {
  id: string;
  name: string;
  mainImage: string | null;
  status: ItemStatus;
  barcode: string | null;
  price: number;
  notes: string | null;
  itemVariantId: string | null;
  itemId?: string[] | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ItemGroupWithItemsType = ItemGroupType & {
  items?: ItemType[];
};

// This matches how we're processing itemGroups in the page
export type ProcessedItemGroup = ItemGroupType & {
  items: ItemType[];
};

// Type for selected items that can be either an Item or an ItemGroup
export type SelectedItemType = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  isGroup: boolean;
  items?: ItemType[]; // For groups
} & (ItemType | (Omit<ItemGroupType, "itemId"> & { items: ItemType[] }));

export type dimensionsType = {
  length: number;
  width: number;
  height: number;
  unit: string;
};

export type ItemFormState = {
  errors?: Record<string, string[]>;
  success: boolean;
  message: string;
};
