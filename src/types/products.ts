export type ItemGroupType = {
  categories: { id: string; title: string; description: string }[];
  brands: { id: string; name: string; description: string }[];
  units: { id: string; title: string; abbreviation: string }[];
  warehouses: { id: string; title: string; description: string }[];
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
};

export type ProductType = {
  id: string;
  name: string;
  description: string;
  sku: string;
  barcode: string;
  dimensions: string;
  price: number;
  cost: number;
  minStock: number;
  tax: number;
  notes: string;
  image: string;
  supplierId: string;
  categoryId: string;
  brandId: string;
  unitId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type ProductListType = {
  items: {
    id: string;
    name: string;
    description: string;
    sku: string;
    barcode: string;
    dimensions: string;
    price: number;
    cost: number;
    minStock: number;
    tax: number;
    notes: string;
    image: string;
    supplierId: string;
    categoryId: string;
    brandId: string;
    unitId: string;
    createdAt: Date;
    updatedAt: Date;
  }[];
};

export type ItemFormState = {
  errors?: Record<string, string[]>;
  success: boolean;
  message: string;
};
