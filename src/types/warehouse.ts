import { Address, WarehouseStatus, WarehouseType } from "@prisma/client";

export type warehouseType = {
  id: string;
  title: string;
  code: string;
  type?: WarehouseType;
  address: Address;
  status: WarehouseStatus;
  createdAt: Date;
  updatedAt: Date;
};
