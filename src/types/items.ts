export type ItemGroupType = {
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
  status: string;
  description: string;
  sku: string;
  barcode: string | null;
  dimensions: string | null;
  price: number;
  cost: number;
  minStock: number;
  tax: number;
  notes: string | null;
  supplierId: string;
  categoryId: string;
  brandId: string;
  unitId: string;
  createdAt: Date;
  updatedAt: Date;
};

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
