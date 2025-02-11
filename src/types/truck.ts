export type TruckType = {
  id: string;
  licensePlate: string;
  name: string;
  km: string;
  status: "DISPONIBLE" | "EN_USO" | "MANTENIMIENTO";
  createdAt: Date;
  updatedAt: Date;
};

export type TruckFormState = {
  errors?: Record<string, string[]>;
  success: boolean;
  message: string;
};
