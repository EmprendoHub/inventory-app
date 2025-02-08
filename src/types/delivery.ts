export type DeliveryType = {
  id: string;
  orderId: string;
  method: "INTERNO" | "EXTERNO";
  driverId: string | null;
  truckId: string | null;
  externalShipId: string | null;
  trackingUrl?: string | null;
  carrier: string;
  otp: string;
  trackingNumber: string;
  deliveryDate: Date | null;
  status: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type DeliveryFormState = {
  errors?: Record<string, string[]>;
  success: boolean;
  message: string;
};
