export type SalesReportData = {
  date: string;
  totalSales: number;
  numberOfOrders: number;
};

export type InventoryReportData = {
  itemName: string;
  currentStock: number;
  minStock: number;
  status: string;
};

export type ReportType = {
  id: string;
  type: string;
  startDate: Date;
  endDate: Date;
  generatedAt: Date;
  pdfUrl: string;
};

export type ReportFormState = {
  errors?: Record<string, string[]>;
  success: boolean;
  message: string;
  pdf?: Blob;
};
