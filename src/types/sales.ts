export type layawayAndProductType = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  clientId: string;
  deposit: number;
  balance: number;
  status: string;
};

export type ordersAndProductType = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  clientId: string;
  deposit: number;
  balance: number;
  status: string;
};

export type receiptsAndProductType = {
  id: string;
  invoiceId: string;
  paymentId: string;
  issuedDate: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type clientsAndProductType = {
  clients: {
    id: string;

    name: string;

    email: string;

    phone: string;

    image: string;

    address: string;

    createdAt: Date;

    updatedAt: Date;
  }[];
};

export type clientType = {
  id: string;
  name: string;
  email: string;
  phone: string;
  image: string;
  address: string;
  createdAt: Date;
  updatedAt: Date;
};

export type deliveriesAndProductType = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  packageId: string;
  carrier: string;
  deliveryDate: Date | null;
  status: string;
};

export type invoicesAndProductType = {
  invoices: {
    id: string;
    orderId: string;
    totalAmount: number;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  }[];
};

export type invoiceType = {
  id: string;
  orderId: string;
  totalAmount: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

export type paymentType = {
  id: string;
  status: string;
  createdAt: Date;
  orderId?: string;
  updatedAt: Date;
  amount: number;
  method: string;
  reference: string | null;
};

export type packagesType = {
  id: string;
  orderId: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  trackingId: string;
};

export type SearchSelectInputProps = {
  // ... other props
  multiple?: boolean;
  onChange?: (value: string | string[]) => void;
  // Add a discriminated union type
} & (
  | { multiple: true; onChange?: (value: string[]) => void }
  | { multiple?: false; onChange?: (value: string) => void }
);

export type ordersAndItem = {
  id: string;
  clientId: string;
  status: string;
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
  invoiceId: string | null;
  orderItems: {
    id: string;
    orderId: string;
    itemId: string;
    image: string | null;
    name: string;
    description: string;
    quantity: number;
    price: number;
  }[];
};

export type OrderType = {
  id: string;
  name: string;
  image: string;
  description: string;
  itemId: string;
  quantity: number;
  price: number;
  orderId: string;
};

export type FullOderType = {
  id: string;
  orderNo: string;
  clientId: string;
  status: string;
  totalAmount: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  dueDate: Date;
  invoiceId: string | null;
  orderItems?: OrderItemsType[];
  payments?: PaymentType[];
  client?: clientType;
};

export type PaymentType = {
  id: string;
  amount: number;
  method: string;
  reference: string | null;
  status: string;
  orderId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type OrderItemsType = {
  id: string;
  orderId: string;
  itemId: string;
  image: string | null;
  name: string;
  description: string;
  quantity: number;
  price: number;
};
