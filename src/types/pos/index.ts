import { CashRegisterStatus } from "@prisma/client";
import { clientType } from "../sales";

// Manual enums until Prisma generates them
export enum PosSessionStatus {
  OPEN = "OPEN",
  CLOSED = "CLOSED",
  SUSPENDED = "SUSPENDED",
}

export enum PosOrderStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  VOIDED = "VOIDED",
  REFUNDED = "REFUNDED",
}

export enum PaymentType {
  CASH = "CASH",
  CARD = "CARD",
  MIXED = "MIXED",
  ACCOUNT = "ACCOUNT",
}

export enum CashCountTypeEnum {
  OPENING = "OPENING",
  CLOSING = "CLOSING",
  MID_SHIFT = "MID_SHIFT",
}

export enum HeldOrderStatus {
  HELD = "HELD",
  RETRIEVED = "RETRIEVED",
  EXPIRED = "EXPIRED",
}

export enum DiscountTypeEnum {
  PERCENTAGE = "PERCENTAGE",
  FIXED_AMOUNT = "FIXED_AMOUNT",
}

export enum ReceiptType {
  SALE = "SALE",
  REFUND = "REFUND",
  VOID = "VOID",
}

// ====================== POS SESSION ======================
export type PosSessionType = {
  id: string;
  sessionNo: string;
  cashRegisterId: string;
  userId: string;
  status: PosSessionStatus;
  openingCash: number;
  closingCash?: number;
  expectedCash?: number;
  variance?: number;
  openedAt: Date;
  closedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type PosSessionWithDetails = PosSessionType & {
  cashRegister: {
    id: string;
    name: string;
    location?: string;
  };
  user: {
    id: string;
    name: string;
    role: string;
  };
  posOrders: PosOrderType[];
  cashCounts: CashCount[];
};

// ====================== POS REGISTER ======================
export type CashRegisterType = {
  id: string;
  name: string;
  balance: number;
  fund: number;
  userId: string;
  managerId?: string;
  status?: CashRegisterStatus;
  location?: string;
  posPin?: string;
  createdAt: Date;
  updatedAt: Date;
};

// ====================== POS ORDER ======================
export type PosOrderType = {
  id: string;
  orderNo: string;
  sessionId: string;
  orderId?: string;
  customerId?: string;
  status: PosOrderStatus;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  tipAmount: number;
  totalAmount: number;
  paymentType: PaymentType;
  cashReceived?: number;
  changeGiven?: number;
  notes?: string;
  receiptPrinted: boolean;
  voidReason?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type PosOrderWithDetails = PosOrderType & {
  customer?: clientType;
  items: PosOrderItemType[];
  payments: PosPaymentType[];
};

// ====================== POS ORDER ITEM ======================
export type PosOrderItemType = {
  id: string;
  posOrderId: string;
  itemId: string;
  name: string;
  sku?: string;
  barcode?: string;
  price: number;
  quantity: number;
  discount: number;
  totalPrice: number;
  modifiers?: string;
  createdAt: Date;
  updatedAt: Date;
};

// ====================== POS PAYMENT ======================
export type PosPaymentType = {
  id: string;
  posOrderId: string;
  type: PaymentType;
  amount: number;
  reference?: string;
  createdAt: Date;
  updatedAt: Date;
};

// ====================== CASH COUNT ======================
export type CashCount = {
  id: string;
  sessionId: string;
  countType: CashCountTypeEnum;
  ones: number;
  fives: number;
  tens: number;
  twenties: number;
  fifties: number;
  hundreds: number;
  fiveHundreds: number;
  thousands: number;
  centavos10: number;
  centavos20: number;
  centavos50: number;
  peso1: number;
  peso2: number;
  peso5: number;
  peso10: number;
  peso20: number;
  totalCash: number;
  countedBy: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
};

// ====================== HELD ORDER ======================
export type HeldOrderType = {
  id: string;
  holdNumber: string;
  cashRegisterId: string;
  customerId?: string;
  items: string; // JSON string
  subtotal: number;
  discountAmount: number;
  notes?: string;
  heldBy: string;
  retrievedBy?: string;
  status: HeldOrderStatus;
  heldAt: Date;
  retrievedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type HeldOrderWithDetails = HeldOrderType & {
  customer?: clientType;
  parsedItems: CartItemType[];
};

// ====================== FAVORITES ======================
export type FavoriteType = {
  id: string;
  itemId: string;
  name: string;
  price: number;
  image?: string;
  position: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

// ====================== DISCOUNT ======================
export type Discount = {
  id: string;
  name: string;
  code?: string;
  type: DiscountTypeEnum;
  value: number;
  minAmount?: number;
  maxAmount?: number;
  isActive: boolean;
  validFrom?: Date;
  validUntil?: Date;
  usageLimit?: number;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
};

// ====================== RECEIPT ======================
export type PosReceiptType = {
  id: string;
  receiptNo: string;
  sessionId: string;
  posOrderId: string;
  type: ReceiptType;
  content: string;
  printed: boolean;
  emailed: boolean;
  emailTo?: string;
  createdAt: Date;
  updatedAt: Date;
};

// ====================== CART & UI TYPES ======================
export type CartItemType = {
  id: string;
  itemId: string;
  name: string;
  price: number;
  quantity: number;
  discount: number;
  image?: string;
  sku?: string;
  barcode?: string;
  modifiers?: ItemModifier[];
};

export type ItemModifier = {
  id: string;
  name: string;
  price: number;
  selected: boolean;
};

export type CartState = {
  items: CartItemType[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  tipAmount: number;
  totalAmount: number;
  customer?: clientType;
};

// ====================== CASH DENOMINATIONS ======================
export type CashDenomination = {
  value: number;
  count: number;
  total: number;
};

export type CashBreakdown = {
  bills: {
    thousands: CashDenomination;
    fiveHundreds: CashDenomination;
    hundreds: CashDenomination;
    fifties: CashDenomination;
    twenties: CashDenomination;
    tens: CashDenomination;
    fives: CashDenomination;
    ones: CashDenomination;
  };
  coins: {
    peso20: CashDenomination;
    peso10: CashDenomination;
    peso5: CashDenomination;
    peso2: CashDenomination;
    peso1: CashDenomination;
    centavos50: CashDenomination;
    centavos20: CashDenomination;
    centavos10: CashDenomination;
  };
  totalCash: number;
};

// ====================== FORM STATES ======================
export type PosFormState = {
  errors?: Record<string, string[]>;
  success: boolean;
  message: string;
};

export type CashCountFormState = PosFormState & {
  data?: CashBreakdown;
};

export type PosSessionFormState = PosFormState & {
  sessionId?: string;
};

// ====================== SCANNING ======================
export type ScanResult = {
  type: "barcode" | "qr";
  data: string;
  timestamp: Date;
};

export type ScanMode = "item" | "customer" | "discount";

// ====================== PAYMENT ======================
export type PaymentMethodType = {
  type: PaymentType;
  name: string;
  icon: string;
  enabled: boolean;
};

export type PaymentSplit = {
  id: string;
  type: PaymentType;
  amount: number;
  reference?: string;
};

// ====================== REPORTS ======================
export type PosReportFilter = {
  startDate?: Date;
  endDate?: Date;
  cashierId?: string;
  registerId?: string;
  status?: PosOrderStatus[];
};

export type PosSalesReport = {
  totalSales: number;
  totalOrders: number;
  averageOrderValue: number;
  totalTax: number;
  totalDiscounts: number;
  totalTips: number;
  paymentBreakdown: {
    cash: number;
    card: number;
    mixed: number;
    account: number;
  };
  topItems: {
    itemId: string;
    name: string;
    quantity: number;
    revenue: number;
  }[];
};

// ====================== TOUCHSCREEN UI ======================
export type TouchMode = "normal" | "large" | "accessibility";

export type PosLayout = {
  showCustomerDisplay: boolean;
  showNumpad: boolean;
  showFavorites: boolean;
  gridColumns: number;
  touchMode: TouchMode;
};

// ====================== OFFLINE SUPPORT ======================
export type OfflineOrder = {
  id: string;
  orderData: Omit<PosOrderType, "id" | "orderNo">;
  items: Omit<PosOrderItemType, "id" | "posOrderId">[];
  payments: Omit<PosPaymentType, "id" | "posOrderId">[];
  syncStatus: "pending" | "syncing" | "failed";
  createdOffline: Date;
};

export type OfflineState = {
  isOnline: boolean;
  pendingOrders: OfflineOrder[];
  lastSync?: Date;
};
