export type TruckType = {
  id: string;
  licensePlate: string;
  status: "DISPONIBLE" | "EN_USO" | "MANTENIMIENTO";
  createdAt: Date;
  updatedAt: Date;
};

export type TruckFormState = {
  errors?: Record<string, string[]>;
  success: boolean;
  message: string;
};
