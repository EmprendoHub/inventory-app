export type DeliveryType = {
  id: string;
  orderId: string;
  orderNo: string;
  method: "INTERNO" | "EXTERNO";
  driverId: string | null;
  truckId: string | null;
  externalShipId: string | null;
  trackingUrl?: string | null;
  carrier: string;
  otp: string;
  price: number;
  trackingNumber: string;
  deliveryDate: Date | null;
  status: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type DeliveryAndDriverType = {
  id: string;
  orderId: string;
  orderNo: string;
  method: "INTERNO" | "EXTERNO";
  driverId: string | null;
  truckId: string | null;
  externalShipId: string | null;
  trackingUrl?: string | null;
  carrier: string;
  otp: string;
  price: number;
  trackingNumber: string;
  deliveryDate: Date | null;
  status: string | null;
  createdAt: Date;
  updatedAt: Date;
  userId: string | null;
  driver: DriverType | null;
};

export type DeliveryFormState = {
  errors?: Record<string, string[]>;
  success: boolean;
  message: string;
};

export type DriverType = {
  id: string;
  name: string | null;
  userId: string | null;
  licenseNumber: string | null;
  status: string | null;
  createdAt: Date;
  updatedAt: Date;
};
