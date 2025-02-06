// Define the form state type
export type FormState = {
  success?: string;
  error?: string;
};

export type ProductFormProps = {
  action: (
    prevState: undefined,
    formData: FormData
  ) => Promise<{ success: boolean; message: string }>;
};

export type categoryAndProductType = {
  productCount: number;
  items: { id: string }[];
  id: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  title: string;
};

export type unitAndProductType = {
  productCount: number;
  items: { id: string }[];
  id: string;
  abbreviation: string;
  createdAt: Date;
  updatedAt: Date;
  title: string;
};

export type supplierAndProductType = {
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
  createdAt: Date;
  updatedAt: Date;
  productCount: number;
  item: { id: string }[];
};

export type warehouseAndProductType = {
  id: string;
  title: string;
  description: string;
  location: string;
  type: string;
  createdAt: Date;
  updatedAt: Date;
};

export type brandAndProductType = {
  productCount: number;
  items: { id: string }[];
  id: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  name: string;
};

export type userType = {
  id: string;
  active: boolean;
  name: string;
  email: string;
  verificationToken?: string;
  phone?: string;
  stripeId?: string;
  password?: string;
  avatar?: string;
  loginAttempts: number;
  points?: number;
  role: string;
  createdAt: Date;
  updatedAt: Date;
};
