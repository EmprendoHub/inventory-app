"use client";

import React, { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
// import { useSession } from "next-auth/react"; // Commented out - not currently used
import {
  ShoppingCart,
  Plus,
  Minus,
  X,
  Search,
  CreditCard,
  Banknote,
  QrCode,
  Tag,
  // PauseCircle,
  // MoreHorizontal,
  Trash2,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SearchSelectInput } from "@/components/SearchSelectInput";
import {
  CartState,
  CartItemType,
  PaymentType,
  CashBreakdown,
} from "@/types/pos";
import { ItemType } from "@/types/items";
import { clientType } from "@/types/sales";
import {
  FavoriteType,
  Discount,
  DiscountTypeEnum,
  ScanResult,
} from "@/types/pos";
import CashCalculator from "./CashCalculator";
import FavoritesGrid from "./FavoritesGrid";
import BarcodeScanner from "./BarcodeScanner";
import DiscountSystem from "./DiscountSystem";
import Image from "next/image";
import { GiCash } from "react-icons/gi";

interface PosRegisterProps {
  items: ItemType[];
  favorites: FavoriteType[];
  customers: clientType[];
  discounts?: Discount[];
  onCheckout: (
    cart: CartState,
    paymentType: PaymentType,
    billBreakdown?: CashBreakdown,
    cashReceived?: number,
    referenceNumber?: string
  ) => Promise<void>;
  onHoldOrder: (cart: CartState) => Promise<void>;
  onScanBarcode?: () => void;
  onScanResult?: (scanResult: ScanResult) => void;
  onApplyDiscount?: (discount: Discount) => void;
  onUpdateFavorites?: (favorites: FavoriteType[]) => Promise<void>;
  isProcessing: boolean;
}

export default function PosRegister({
  items,
  favorites,
  customers,
  discounts = [],
  onCheckout,
  // onHoldOrder,
  onUpdateFavorites,
  isProcessing,
}: PosRegisterProps) {
  // const { data: session } = useSession(); // Commented out - not currently used
  const [cart, setCart] = useState<CartState>({
    items: [],
    subtotal: 0,
    taxAmount: 0,
    discountAmount: 0,
    tipAmount: 0,
    totalAmount: 0,
    customer: undefined,
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [customerSearchKey, setCustomerSearchKey] = useState("");

  // Form state for SearchSelectInput (even though we don't use it for validation)
  const [formState] = useState({
    errors: {},
    success: false,
    message: "",
  });
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCashCalculator, setShowCashCalculator] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [showReferenceModal, setShowReferenceModal] = useState(false);
  const [isManagingFavorites, setIsManagingFavorites] = useState(false);
  const [activeView, setActiveView] = useState<
    "favorites" | "search" | "categories"
  >("favorites");
  const [selectedPaymentType, setSelectedPaymentType] =
    useState<PaymentType | null>(null);
  const [referenceNumber, setReferenceNumber] = useState("");

  // Customer modal state
  const [showClientModal, setShowClientModal] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [customerError, setCustomerError] = useState("");
  const [sending, setSending] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [internalProcessing, setInternalProcessing] = useState(false);

  // Combined processing state
  const isCurrentlyProcessing = isProcessing || internalProcessing;

  // Calculate cart totals
  const calculateTotals = useCallback(
    (cartItems: CartItemType[]) => {
      const subtotal = cartItems.reduce(
        (sum, item) => sum + (item.price * item.quantity - item.discount),
        0
      );
      const taxRate = 0.0; // 16% IVA
      const taxAmount = subtotal * taxRate;
      const totalAmount =
        subtotal + taxAmount - cart.discountAmount + cart.tipAmount;

      return {
        subtotal,
        taxAmount,
        totalAmount,
      };
    },
    [cart.discountAmount, cart.tipAmount]
  );

  // Update cart totals whenever items change
  useEffect(() => {
    const totals = calculateTotals(cart.items);
    setCart((prev) => ({
      ...prev,
      ...totals,
    }));
  }, [cart.items, calculateTotals]);

  // Add item to cart
  const addToCart = useCallback((item: ItemType) => {
    setCart((prev) => {
      const existingItem = prev.items.find(
        (cartItem) => cartItem.itemId === item.id
      );

      if (existingItem) {
        return {
          ...prev,
          items: prev.items.map((cartItem) =>
            cartItem.itemId === item.id
              ? { ...cartItem, quantity: cartItem.quantity + 1 }
              : cartItem
          ),
        };
      } else {
        const newItem: CartItemType = {
          id: `cart_${Date.now()}_${item.id}`,
          itemId: item.id,
          name: item.name,
          price: item.price,
          quantity: 1,
          discount: 0,
          image: item.mainImage,
          sku: item.sku,
          barcode: item.barcode || undefined,
        };

        return {
          ...prev,
          items: [...prev.items, newItem],
        };
      }
    });
  }, []);

  // Remove item from cart
  const removeFromCart = useCallback((cartItemId: string) => {
    setCart((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== cartItemId),
    }));
  }, []);

  // Update item quantity
  const updateQuantity = useCallback(
    (cartItemId: string, newQuantity: number) => {
      if (newQuantity <= 0) {
        removeFromCart(cartItemId);
        return;
      }

      setCart((prev) => ({
        ...prev,
        items: prev.items.map((item) =>
          item.id === cartItemId ? { ...item, quantity: newQuantity } : item
        ),
      }));
    },
    [removeFromCart]
  );

  // Clear cart
  const clearCart = useCallback(() => {
    setCart({
      items: [],
      subtotal: 0,
      taxAmount: 0,
      discountAmount: 0,
      tipAmount: 0,
      totalAmount: 0,
      customer: undefined,
    });
    // Reset customer selection by generating new key
    setCustomerSearchKey(Math.random().toString(36).substring(7));
  }, []);

  // Customer modal functions
  const handleCustomerNameChange = (name: string) => {
    setCustomerName(name);
    if (name.trim()) {
      // Remove spaces and special characters, convert to lowercase
      const cleanName = name.replace(/\s+/g, "").toLowerCase();
      // Add timestamp (current date and time as number)
      const timestamp = Date.now();
      // Generate email
      const generatedEmail = `${cleanName}${timestamp}@yunuencompany.com`;
      setEmail(generatedEmail);
    } else {
      setEmail("");
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputPhone = e.target.value.replace(/\D/g, ""); // Remove non-numeric characters
    let formattedPhone = "";

    if (inputPhone.length <= 10) {
      formattedPhone = inputPhone.replace(
        /(\d{3})(\d{0,3})(\d{0,4})/,
        "$1$2$3"
      );
    } else {
      // If the phone number exceeds 10 digits, truncate it
      formattedPhone = inputPhone
        .slice(0, 10)
        .replace(/(\d{3})(\d{0,3})(\d{0,4})/, "$1$2$3");
    }

    setPhone(formattedPhone);
  };

  const handleClientSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSending(true);
    setCustomerError("");

    try {
      // Import the createClient action
      const { createClient } = await import(
        "../../ventas/clientes/_actions/clientActions"
      );

      const formData = new FormData();
      formData.append("name", customerName);
      formData.append("email", email);
      formData.append("phone", phone);
      formData.append("address", "Sin Dirección");

      const result = await createClient(
        { errors: {}, success: false, message: "" },
        formData
      );

      if (result.success) {
        // Reset form and close modal
        setCustomerName("");
        setEmail("");
        setPhone("");
        setCustomerError("");
        setShowClientModal(false);

        // Show success modal and auto-close after 2 seconds
        setShowSuccessModal(true);
        setTimeout(() => {
          setShowSuccessModal(false);
        }, 2000);
      } else {
        // Handle errors
        let errorMessage = "Error desconocido";

        if (
          result.errors &&
          result.errors.email &&
          result.errors.email.length > 0
        ) {
          errorMessage = result.errors.email[0];
        } else if (
          result.errors &&
          result.errors.phone &&
          result.errors.phone.length > 0
        ) {
          errorMessage = result.errors.phone[0];
        } else if (
          result.errors &&
          result.errors.name &&
          result.errors.name.length > 0
        ) {
          errorMessage = result.errors.name[0];
        } else if (result.message) {
          errorMessage = result.message;
        }

        setCustomerError(errorMessage);
      }
    } catch (error) {
      console.error("Error creating client:", error);
      setCustomerError("Error al crear el cliente");
    } finally {
      setSending(false);
    }
  };

  // Stock check state for notifications
  const [showStockAlert, setShowStockAlert] = useState(false);
  const [stockAlerts, setStockAlerts] = useState<any[]>([]);
  const [stockMessages, setStockMessages] = useState<string[]>([]);
  // const [canProceedWithSale, setCanProceedWithSale] = useState(true); // Commented out - not currently used
  const [pendingCashPayment, setPendingCashPayment] = useState<{
    cashReceived: number;
    breakdown: CashBreakdown;
  } | null>(null);

  // Process cash payment (separated from stock check)
  const processCashPayment = useCallback(
    async (cashReceived: number, breakdown: CashBreakdown) => {
      if (cart.items.length === 0) {
        return;
      }

      // Log breakdown for future use (can be sent to backend)
      console.log("Cash breakdown:", breakdown);

      try {
        // Process the checkout with bill breakdown

        await onCheckout(cart, PaymentType.CASH, breakdown, cashReceived);

        // Only clear cart and print receipt if checkout was successful
        // The success handling will be done by PosRegisterClient
        // We don't clear cart or close modals here anymore
      } catch (error) {
        console.error("Cash payment error:", error);
        // Error handling will be done by PosRegisterClient
        throw error;
      }
    },
    [cart, onCheckout]
  );

  // Check stock before proceeding with cash payment
  const checkStockBeforeCashPayment = useCallback(
    async (cashReceived: number, breakdown: CashBreakdown) => {
      if (cart.items.length === 0) {
        console.log("No items in cart, returning");
        return;
      }

      try {
        // Proceed directly with cash payment without stock checking
        await processCashPayment(cashReceived, breakdown);
        return;
      } catch (error) {
        console.error("Stock check error:", error);
        // Proceed with payment if stock check fails
        await processCashPayment(cashReceived, breakdown);
      }
    },
    [cart, processCashPayment]
  );

  // Handle cash payment completion
  const handleCashPayment = useCallback(
    async (cashReceived: number, breakdown: CashBreakdown) => {
      console.log("handleCashPayment called with:", {
        cashReceived,
        breakdown,
      });

      setInternalProcessing(true);
      try {
        // First check stock, then proceed with payment
        await checkStockBeforeCashPayment(cashReceived, breakdown);
      } catch (error) {
        console.error("Cash payment error:", error);
      } finally {
        setInternalProcessing(false);
        setShowCashCalculator(false);
      }
    },
    [checkStockBeforeCashPayment]
  );

  // Handle proceeding with sale after stock alert
  const handleProceedAfterStockAlert = useCallback(async () => {
    setShowStockAlert(false);

    if (pendingCashPayment) {
      await processCashPayment(
        pendingCashPayment.cashReceived,
        pendingCashPayment.breakdown
      );
      setPendingCashPayment(null);
    }

    setStockAlerts([]);
    setStockMessages([]);
  }, [pendingCashPayment, processCashPayment]);

  // Handle canceling sale after stock alert
  const handleCancelAfterStockAlert = useCallback(() => {
    setShowStockAlert(false);
    setPendingCashPayment(null);
    setStockAlerts([]);
    setStockMessages([]);
    setShowCashCalculator(false);
    setShowPaymentModal(true);
  }, []);

  // Handle barcode scan result
  const handleScanResult = useCallback(
    (result: ScanResult) => {
      const foundItem = items.find(
        (item) =>
          item.barcode === result.data ||
          item.id === result.data ||
          item.name.toLowerCase().includes(result.data.toLowerCase())
      );

      if (foundItem) {
        addToCart(foundItem);
        setShowBarcodeScanner(false);
      } else {
        // Show item not found modal
        const notFoundModal = document.createElement("div");
        notFoundModal.innerHTML = `
        <div style="
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
        ">
          <div style="
            background: white;
            padding: 2rem;
            border-radius: 12px;
            box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
            text-align: center;
            max-width: 400px;
            margin: 1rem;
          ">
            <div style="
              color: #f59e0b;
              font-size: 3rem;
              margin-bottom: 1rem;
            ">⚠</div>
            <h2 style="
              font-size: 1.5rem;
              font-weight: bold;
              color: #1f2937;
              margin-bottom: 1rem;
            ">Producto No Encontrado</h2>
            <p style="
              font-size: 1.125rem;
              color: #4b5563;
              margin-bottom: 1.5rem;
            ">No se encontró un producto con el código: ${result.data}</p>
            <button onclick="this.parentElement.parentElement.remove()" style="
              background: #f59e0b;
              color: white;
              border: none;
              padding: 0.75rem 1.5rem;
              border-radius: 8px;
              font-size: 1rem;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.2s;
            " onmouseover="this.style.background='#d97706'" onmouseout="this.style.background='#f59e0b'">
              Cerrar
            </button>
          </div>
        </div>
      `;
        document.body.appendChild(notFoundModal);
      }
    },
    [items, addToCart]
  );

  // Handle discount application
  const handleApplyDiscount = useCallback(
    (
      type: "item" | "order",
      discount:
        | Discount
        | { type: DiscountTypeEnum; value: number; name: string },
      itemId?: string
    ) => {
      if (type === "item" && itemId) {
        // Apply discount to specific item
        setCart((prev) => ({
          ...prev,
          items: prev.items.map((item) => {
            if (item.id === itemId) {
              const discountAmount =
                discount.type === DiscountTypeEnum.PERCENTAGE
                  ? (item.price * discount.value) / 100
                  : discount.value;
              return {
                ...item,
                discount: Math.min(discountAmount, item.price * item.quantity),
              };
            }
            return item;
          }),
        }));
      } else {
        // Apply discount to entire order
        const discountAmount =
          discount.type === DiscountTypeEnum.PERCENTAGE
            ? (cart.subtotal * discount.value) / 100
            : discount.value;
        setCart((prev) => ({
          ...prev,
          discountAmount: Math.min(discountAmount, prev.subtotal),
        }));
      }
      setShowDiscountModal(false);
    },
    [cart.subtotal]
  );

  // Handle favorites management
  const handleUpdateFavorites = useCallback(
    async (newFavorites: FavoriteType[]) => {
      if (onUpdateFavorites) {
        try {
          await onUpdateFavorites(newFavorites);
        } catch (error) {
          console.error("Error updating favorites:", error);
        }
      }
    },
    [onUpdateFavorites]
  );

  // Filter items based on search and category
  const filteredItems = React.useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.barcode && item.barcode.includes(searchTerm));

      return matchesSearch;
    });
  }, [items, searchTerm]);

  // Handle checkout with reference number
  const handleCheckoutWithReference = useCallback(
    async (paymentType: PaymentType, reference?: string) => {
      if (cart.items.length === 0) return;

      try {
        // For now, we'll modify onCheckout to accept the reference
        // This will need to be handled in the parent component
        await onCheckout(cart, paymentType, undefined, undefined, reference);
        clearCart();
        setShowPaymentModal(false);
        setShowReferenceModal(false);
        setReferenceNumber("");
        setSelectedPaymentType(null);
      } catch (error) {
        console.error("Checkout error:", error);
      }
    },
    [cart, onCheckout, clearCart]
  );

  // Handle checkout
  // const handleCheckout = useCallback(
  //   async (paymentType: PaymentType, billBreakdown?: CashBreakdown) => {
  //     if (cart.items.length === 0) return;

  //     try {
  //       await onCheckout(cart, paymentType, billBreakdown);
  //       clearCart();
  //       setShowPaymentModal(false);
  //     } catch (error) {
  //       console.error("Checkout error:", error);
  //     }
  //   },
  //   [cart, onCheckout, clearCart]
  // );

  // Prepare customer options with enhanced search capability
  const customerOptions = React.useMemo(() => {
    return [
      {
        value: "",
        name: "Cliente Ocasional",
        description: "",
      },
      ...customers.map((customer) => ({
        value: customer.id,
        // Combine name and phone in the name field for searchability
        name: `${customer.name}${customer.phone ? ` - ${customer.phone}` : ""}`,
        description: customer.phone || "",
      })),
    ];
  }, [customers]);

  return (
    <div className="min-h-screen bg-card flex flex-col">
      {/* Header */}
      <header className="bg-card shadow-sm border-b px-4 py-3 flex items-center gap-x-14 justify-between fixed top-12 right-10 z-20 ">
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="bg-green-50 text-green-700">
            Sesión Activa
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowBarcodeScanner(true)}
          >
            <QrCode className="w-4 h-4 mr-2" />
            Scanner
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden mt-5">
        {/* Products Section */}
        <div className="flex-1 p-4 pr-[360px]">
          {/* Search and Categories */}
          <div className="mb-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar productos por nombre, SKU o código de barras..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 text-base py-3"
              />
            </div>

            {/* View Toggle */}
            <div className="flex gap-2">
              <Button
                variant={activeView === "favorites" ? "default" : "outline"}
                onClick={() => setActiveView("favorites")}
                className="flex-1"
              >
                Favoritos
              </Button>
              <Button
                variant={activeView === "search" ? "default" : "outline"}
                onClick={() => setActiveView("search")}
                className="flex-1"
              >
                Todos los Productos
              </Button>
            </div>
          </div>

          {/* Products Grid */}
          <div className="pb-4">
            {activeView === "favorites" && (
              <FavoritesGrid
                favorites={favorites}
                items={items}
                onAddToCart={(itemId) => {
                  const item = items.find((i) => i.id === itemId);
                  if (item) addToCart(item);
                }}
                onUpdateFavorites={handleUpdateFavorites}
                isManageMode={isManagingFavorites}
                onToggleManageMode={() =>
                  setIsManagingFavorites(!isManagingFavorites)
                }
              />
            )}

            {activeView === "search" && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {filteredItems.map((item) => (
                  <motion.div
                    key={item.id}
                    whileTap={{ scale: isCurrentlyProcessing ? 1 : 0.95 }}
                    className={`cursor-pointer ${
                      isCurrentlyProcessing
                        ? "pointer-events-none opacity-50"
                        : ""
                    }`}
                    onClick={() => !isCurrentlyProcessing && addToCart(item)}
                  >
                    <Card className="h-full hover:shadow-md transition-shadow">
                      <CardContent className="p-3 text-center">
                        <div className="aspect-square bg-gray-100 rounded-lg mb-2 overflow-hidden">
                          {(item.images && item.images.length > 0) ||
                          item.mainImage ? (
                            <Image
                              src={
                                item.images && item.images.length > 0
                                  ? item.images[0]
                                  : item.mainImage
                              }
                              alt={item.name}
                              width={120}
                              height={120}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <Tag className="w-8 h-8" />
                            </div>
                          )}
                        </div>
                        <h3 className="font-medium text-sm leading-tight mb-1 line-clamp-2">
                          {item.name}
                        </h3>
                        <p className="text-lg font-semibold text-blue-600">
                          ${item.price.toFixed(2)}
                        </p>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isCurrentlyProcessing) {
                              addToCart(item);
                            }
                          }}
                          size="sm"
                          className="w-full mt-2"
                          disabled={isCurrentlyProcessing}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Cart Section */}
        <div className="w-80 bg-card border-l flex flex-col fixed top-32 right-4 h-[calc(100vh-10.0rem)]">
          {/* Cart Header */}
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Carrito ({cart.items.length})
              </h2>
              {cart.items.length > 0 && (
                <Button variant="ghost" size="sm" onClick={clearCart}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* Enhanced Customer Selection */}
            <div className="space-y-2">
              <SearchSelectInput
                key={customerSearchKey} // Force re-render when cart is cleared
                label="Cliente"
                name="customer"
                state={formState}
                className="w-full"
                placeholder="Buscar por nombre o teléfono..."
                options={customerOptions}
                onChange={(value) => {
                  const customer = customers.find((c) => c.id === value);
                  setCart((prev) => ({
                    ...prev,
                    customer: customer || undefined,
                  }));
                }}
              />

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowClientModal(true)}
                className="w-full text-xs"
              >
                + Agregar nuevo cliente
              </Button>
            </div>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <AnimatePresence>
              {cart.items.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-card rounded-lg p-3"
                >
                  <div className="flex items-start justify-between mb-2">
                    <Image
                      src={
                        item.image ||
                        "https://via.placeholder.com/150?text=No+Image"
                      }
                      alt={item.name}
                      width={50}
                      height={50}
                      className="w-6 h-6 object-cover rounded-md mb-1 pr-3"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium text-sm leading-tight">
                        {item.name.substring(0, 20)}...
                      </h4>
                      <p className="text-xs text-gray-500">
                        ${item.price.toFixed(2)} each
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFromCart(item.id)}
                      className="p-1 h-auto"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          updateQuantity(item.id, item.quantity - 1)
                        }
                        className="p-1 h-8 w-8"
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="w-8 text-center font-medium">
                        {item.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          updateQuantity(item.id, item.quantity + 1)
                        }
                        className="p-1 h-8 w-8"
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                    <span className="font-semibold">
                      ${(item.price * item.quantity - item.discount).toFixed(2)}
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {cart.items.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Carrito está vacío</p>
                <p className="text-sm">Agregar productos para comenzar</p>
              </div>
            )}
          </div>

          {/* Cart Summary & Actions */}
          {cart.items.length > 0 && (
            <div className="border-t p-4 space-y-3">
              {/* Totals */}
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>${cart.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Impuesto (16%):</span>
                  <span>${cart.taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Descuento:</span>
                  <div className="flex items-center gap-2">
                    {cart.discountAmount > 0 ? (
                      <span className="text-green-600">
                        -${cart.discountAmount.toFixed(2)}
                      </span>
                    ) : (
                      <span>$0.00</span>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowDiscountModal(true)}
                      className="h-6 w-6 p-0"
                    >
                      <Tag className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <div className="flex justify-between font-semibold text-base border-t pt-1">
                  <span>Total:</span>
                  <span>${cart.totalAmount.toFixed(2)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <Button
                  className="w-full py-10 text-base bg-emerald-600 hover:bg-emerald-700 flex items-center justify-center text-white min-h-10"
                  onClick={() => setShowPaymentModal(true)}
                  disabled={isCurrentlyProcessing}
                >
                  <GiCash className="w-4 h-4 mr-2" />
                  {isCurrentlyProcessing ? "Procesando..." : "Finalizar Venta"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-background rounded-lg p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Método de Pago</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPaymentModal(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-3">
                <div className="text-center mb-4">
                  <p className="text-2xl font-bold">
                    ${cart.totalAmount.toFixed(2)}
                  </p>
                  <p className="text-gray-500">Total a pagar</p>
                </div>

                <Button
                  className="w-full h-16 py-4 text-lg font-bold bg-green-700 hover:bg-green-800 active:bg-green-900 text-white transition-colors touch-manipulation"
                  onClick={() => {
                    setShowPaymentModal(false);
                    setShowCashCalculator(true);
                  }}
                  disabled={isProcessing}
                >
                  <Banknote className="w-6 h-6 mr-3" />
                  Pago en Efectivo
                </Button>

                <Button
                  className="w-full h-16 py-4 text-lg font-bold bg-yellow-600 hover:bg-yellow-700 active:bg-yellow-800 text-white transition-colors touch-manipulation"
                  onClick={() => {
                    setSelectedPaymentType(PaymentType.CARD);
                    setShowPaymentModal(false);
                    setShowReferenceModal(true);
                  }}
                  disabled={isProcessing}
                >
                  <CreditCard className="w-6 h-6 mr-3" />
                  Pago con Tarjeta
                </Button>

                <Button
                  className="w-full h-16 py-4 text-lg font-bold bg-blue-700 hover:bg-blue-800 active:bg-blue-900 text-white transition-colors touch-manipulation"
                  onClick={() => {
                    setSelectedPaymentType(PaymentType.TRANSFER);
                    setShowPaymentModal(false);
                    setShowReferenceModal(true);
                  }}
                  disabled={isProcessing}
                >
                  <svg
                    className="w-6 h-6 mr-3"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                  </svg>
                  Transferencia
                </Button>

                {/* <Button
                  variant="outline"
                  className="w-full py-3 text-base"
                  onClick={() => handleCheckout(PaymentType.MIXED)}
                >
                  <MoreHorizontal className="w-5 h-5 mr-2" />
                  Pago Fraccionado
                </Button> */}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cash Calculator Modal */}
      {showCashCalculator && (
        <CashCalculator
          totalAmount={cart.totalAmount}
          onCashReceived={(cashReceived: number, breakdown: CashBreakdown) => {
            handleCashPayment(cashReceived, breakdown);
          }}
          onClose={() => setShowCashCalculator(false)}
        />
      )}

      {/* Barcode Scanner Modal */}
      {showBarcodeScanner && (
        <BarcodeScanner
          isOpen={showBarcodeScanner}
          onClose={() => setShowBarcodeScanner(false)}
          onScanResult={handleScanResult}
          scanMode="item"
        />
      )}

      {/* Discount System Modal */}
      {showDiscountModal && (
        <DiscountSystem
          isOpen={showDiscountModal}
          onClose={() => setShowDiscountModal(false)}
          discounts={discounts}
          cartItems={cart.items}
          onApplyDiscount={handleApplyDiscount}
        />
      )}

      {/* Reference Number Modal */}
      <AnimatePresence>
        {showReferenceModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-background rounded-lg p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">
                  {selectedPaymentType === PaymentType.CARD
                    ? "Número de Referencia - Tarjeta"
                    : "Número de Referencia - Transferencia"}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowReferenceModal(false);
                    setReferenceNumber("");
                    setSelectedPaymentType(null);
                    setShowPaymentModal(true);
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div className="text-center mb-4">
                  <p className="text-2xl font-bold">
                    ${cart.totalAmount.toFixed(2)}
                  </p>
                  <p className="text-gray-500">Total a pagar</p>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="referenceNumber"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Número de Referencia *
                  </label>
                  <Input
                    id="referenceNumber"
                    type="text"
                    placeholder="Ingrese el número de referencia"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    className="w-full"
                    autoFocus
                  />
                  <p className="text-xs text-gray-500">
                    {selectedPaymentType === PaymentType.CARD
                      ? "Ingrese el número de autorización de la tarjeta"
                      : "Ingrese el número de referencia de la transferencia"}
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setShowReferenceModal(false);
                      setReferenceNumber("");
                      setSelectedPaymentType(null);
                      setShowPaymentModal(true);
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => {
                      if (selectedPaymentType && referenceNumber.trim()) {
                        handleCheckoutWithReference(
                          selectedPaymentType,
                          referenceNumber.trim()
                        );
                      }
                    }}
                    disabled={!referenceNumber.trim() || isProcessing}
                  >
                    {isProcessing ? "Procesando..." : "Procesar Pago"}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stock Alert Modal */}
      <AnimatePresence>
        {showStockAlert && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-background rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-orange-600">
                  📦 Verificación de Stock
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancelAfterStockAlert}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-4">
                {/* Messages */}
                {stockMessages.length > 0 && (
                  <div className="space-y-2">
                    {stockMessages.map((message, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg text-sm ${
                          message.includes("❌")
                            ? "bg-red-50 text-red-800 border border-red-200"
                            : message.includes("✅")
                            ? "bg-green-50 text-green-800 border border-green-200"
                            : "bg-blue-50 text-blue-800 border border-blue-200"
                        }`}
                      >
                        {message}
                      </div>
                    ))}
                  </div>
                )}

                {/* Stock Alerts Details */}
                {stockAlerts.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium">Detalles de Stock:</h4>
                    {stockAlerts.map((alert, index) => (
                      <div key={index} className="border rounded-lg p-3">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h5 className="font-medium">{alert.itemName}</h5>
                            <p className="text-sm text-gray-600">
                              Necesario: {alert.requestedQty} | Disponible:{" "}
                              {alert.availableQty} | Faltante: {alert.shortfall}
                            </p>
                          </div>
                          {alert.notificationCreated && (
                            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                              Solicitud Enviada
                            </span>
                          )}
                        </div>

                        {alert.branchesWithStock.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-1">
                              Disponible en otras sucursales:
                            </p>
                            <div className="space-y-1">
                              {alert.branchesWithStock.map(
                                (branch: any, branchIndex: number) => (
                                  <div
                                    key={branchIndex}
                                    className="text-sm text-gray-600 bg-gray-50 px-2 py-1 rounded"
                                  >
                                    {branch.warehouseName}:{" "}
                                    {branch.availableQty} unidades
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Total Amount */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-center">
                    <p className="text-lg font-bold">
                      Total: ${cart.totalAmount.toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-600">
                      Puede proceder con la venta usando el stock disponible
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handleCancelAfterStockAlert}
                  >
                    Cancelar Venta
                  </Button>
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={handleProceedAfterStockAlert}
                    disabled={isProcessing}
                  >
                    {isProcessing ? "Procesando..." : "Continuar con Venta"}
                  </Button>
                </div>

                {/* Information */}
                <div className="bg-blue-50 p-3 rounded text-sm text-blue-800">
                  <p className="font-medium mb-1">ℹ️ Información:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>
                      Las solicitudes de stock se envían automáticamente a otras
                      sucursales
                    </li>
                    <li>
                      Puede continuar con la venta usando el stock disponible
                    </li>
                    <li>
                      Las sucursales responderán a las solicitudes por separado
                    </li>
                  </ul>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Customer Creation Modal */}
      {showClientModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Agregar Nuevo Cliente
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowClientModal(false);
                  setCustomerName("");
                  setEmail("");
                  setPhone("");
                  setCustomerError("");
                }}
                className="p-1"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <form onSubmit={handleClientSubmit} className="space-y-4">
              {/* Name Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre completo *
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => handleCustomerNameChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ingrese el nombre del cliente"
                  required
                />
              </div>

              {/* Phone Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono *
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={handlePhoneChange}
                  className="w-full px-3 py-2 border border-gray-300 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Número de teléfono"
                  maxLength={10}
                  required
                />
              </div>

              {/* Email Input (Auto-generated) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email (generado automáticamente)
                </label>
                <input
                  type="email"
                  value={email}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                  placeholder="Se generará automáticamente"
                />
              </div>

              {/* Error Message */}
              {customerError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{customerError}</p>
                </div>
              )}

              {/* Form Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowClientModal(false);
                    setCustomerName("");
                    setEmail("");
                    setPhone("");
                    setCustomerError("");
                  }}
                  disabled={sending}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={sending || !customerName.trim() || !phone.trim()}
                >
                  {sending ? "Creando..." : "Crear Cliente"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm mx-4"
          >
            <div className="text-center">
              {/* Success Icon */}
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                <svg
                  className="h-8 w-8 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>

              {/* Success Message */}
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                ¡Cliente creado exitosamente!
              </h3>
              <p className="text-sm text-gray-600">
                El cliente ha sido agregado al sistema
              </p>

              {/* Auto-close indicator */}
              <div className="mt-4">
                <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: "100%" }}
                    animate={{ width: "0%" }}
                    transition={{ duration: 2, ease: "linear" }}
                    className="h-full bg-green-500"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Se cerrará automáticamente
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Processing Overlay */}
      {isCurrentlyProcessing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70]">
          <div className="bg-white rounded-lg shadow-xl p-8 text-center">
            <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Procesando Pago
            </h3>
            <p className="text-sm text-gray-600">
              Por favor espere mientras procesamos su transacción...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
