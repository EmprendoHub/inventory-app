"use client";

import React, { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingCart,
  Plus,
  Minus,
  X,
  Search,
  User,
  CreditCard,
  Banknote,
  QrCode,
  Tag,
  PauseCircle,
  MoreHorizontal,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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

interface PosRegisterProps {
  items: ItemType[];
  favorites: FavoriteType[];
  customers: clientType[];
  discounts?: Discount[];
  onCheckout: (cart: CartState, paymentType: PaymentType) => Promise<void>;
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
  onHoldOrder,
  onUpdateFavorites,
  isProcessing,
}: PosRegisterProps) {
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
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCashCalculator, setShowCashCalculator] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [isManagingFavorites, setIsManagingFavorites] = useState(false);
  const [activeView, setActiveView] = useState<
    "favorites" | "search" | "categories"
  >("favorites");

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
  }, []);

  // Print receipt function
  const printReceipt = useCallback((receiptData: any) => {
    const receiptWindow = window.open("", "_blank");
    if (receiptWindow) {
      receiptWindow.document.write(`
        <html>
          <head>
            <title>Recibo de Venta</title>
            <style>
              body { font-family: Arial, sans-serif; width: 300px; margin: 0 auto; }
              .header { text-align: center; margin-bottom: 20px; }
              .item { display: flex; justify-content: space-between; margin-bottom: 5px; }
              .total { font-weight: bold; border-top: 2px solid black; padding-top: 10px; }
              .center { text-align: center; }
            </style>
          </head>
          <body>
            <div class="header">
              <h2>RECIBO DE VENTA</h2>
              <p>Orden: ${receiptData.orderNumber}</p>
              <p>Fecha: ${receiptData.date}</p>
              <p>Cliente: ${receiptData.customer}</p>
            </div>
            
            <div>
              ${receiptData.items
                .map(
                  (item: any) => `
                <div class="item">
                  <span>${item.name} x ${item.quantity}</span>
                  <span>$${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              `
                )
                .join("")}
            </div>
            
            <div class="total">
              <div class="item">
                <span>Subtotal:</span>
                <span>$${receiptData.subtotal.toFixed(2)}</span>
              </div>
              ${
                receiptData.tax > 0
                  ? `
                <div class="item">
                  <span>IVA (16%):</span>
                  <span>$${receiptData.tax.toFixed(2)}</span>
                </div>
              `
                  : ""
              }
              ${
                receiptData.discount > 0
                  ? `
                <div class="item">
                  <span>Descuento:</span>
                  <span>-$${receiptData.discount.toFixed(2)}</span>
                </div>
              `
                  : ""
              }
              ${
                receiptData.tip > 0
                  ? `
                <div class="item">
                  <span>Propina:</span>
                  <span>$${receiptData.tip.toFixed(2)}</span>
                </div>
              `
                  : ""
              }
              <div class="item">
                <span><strong>TOTAL:</strong></span>
                <span><strong>$${receiptData.total.toFixed(2)}</strong></span>
              </div>
              ${
                receiptData.paymentType === "CASH" && receiptData.cashReceived
                  ? `
                <div class="item">
                  <span>Efectivo recibido:</span>
                  <span>$${receiptData.cashReceived.toFixed(2)}</span>
                </div>
                <div class="item">
                  <span>Cambio:</span>
                  <span>$${
                    receiptData.changeAmount?.toFixed(2) || "0.00"
                  }</span>
                </div>
              `
                  : ""
              }
            </div>
            
            <div class="center" style="margin-top: 20px;">
              <p>¡Gracias por su compra!</p>
            </div>
            
            <script>
              window.onload = function() {
                window.print();
                window.onafterprint = function() {
                  window.close();
                };
              };
            </script>
          </body>
        </html>
      `);
      receiptWindow.document.close();
    }
  }, []);

  // Generate receipt
  const generateReceipt = useCallback(
    (
      cartData: CartState,
      paymentType: PaymentType,
      cashReceived?: number,
      changeAmount?: number
    ) => {
      const receiptData = {
        orderNumber: `POS-${Date.now()}`,
        date: new Date().toLocaleString("es-ES"),
        items: cartData.items,
        subtotal: cartData.subtotal,
        tax: cartData.taxAmount,
        discount: cartData.discountAmount,
        tip: cartData.tipAmount,
        total: cartData.totalAmount,
        paymentType,
        cashReceived,
        changeAmount,
        customer: cartData.customer?.name || "Cliente General",
      };

      // For now, just log the receipt data - in production you'd send to printer
      console.log("Receipt Data:", receiptData);

      // You can also trigger browser print dialog
      printReceipt(receiptData);
    },
    [printReceipt]
  );

  // Handle cash payment completion
  const handleCashPayment = useCallback(
    async (cashReceived: number, breakdown: CashBreakdown) => {
      console.log("handleCashPayment called with:", {
        cashReceived,
        breakdown,
      });

      if (cart.items.length === 0) {
        console.log("No items in cart, returning");
        return;
      }

      const changeAmount = cashReceived - cart.totalAmount;

      // Log breakdown for future use (can be sent to backend)
      console.log("Cash breakdown:", breakdown);

      try {
        // Process the checkout
        await onCheckout(cart, PaymentType.CASH);

        // Generate and print receipt
        generateReceipt(cart, PaymentType.CASH, cashReceived, changeAmount);

        // Clear cart and close calculator
        clearCart();
        setShowCashCalculator(false);
        setShowPaymentModal(false);

        // Show success message with change using a custom toast/modal instead of alert
        const message =
          changeAmount > 0
            ? `Cambio a entregar:`
            : "Pago completado exitosamente.";

        // Create a temporary success modal instead of ugly browser alert
        const successModal = document.createElement("div");
        successModal.innerHTML = `
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
                color: #059669;
                font-size: 3rem;
                margin-bottom: 1rem;
              ">✓</div>
              <h2 style="
                font-size: 1.5rem;
                font-weight: bold;
                color: #1f2937;
                margin-bottom: 1rem;
              ">¡Pago Exitoso!</h2>
              <p style="
                font-size: 1.125rem;
                color: #4b5563;
                margin-bottom: 0.5rem;
              ">${message}</p>
              <p style="
                font-size: 4.125rem;
                font-weight: bold;
                color: #059669;
                margin-bottom: 1.5rem;
              ">$${changeAmount.toFixed(2)}</p>
              <button onclick="this.parentElement.parentElement.remove()" style="
                background: #059669;
                color: white;
                border: none;
                padding: 0.75rem 1.5rem;
                border-radius: 8px;
                font-size: 1rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s;
              " onmouseover="this.style.background='#047857'" onmouseout="this.style.background='#059669'">
                Continuar
              </button>
            </div>
          </div>
        `;
        document.body.appendChild(successModal);
      } catch (error) {
        console.error("Cash payment error:", error);

        // Create a custom error modal instead of ugly browser alert
        const errorModal = document.createElement("div");
        errorModal.innerHTML = `
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
                color: #dc2626;
                font-size: 3rem;
                margin-bottom: 1rem;
              ">⚠</div>
              <h2 style="
                font-size: 1.5rem;
                font-weight: bold;
                color: #1f2937;
                margin-bottom: 1rem;
              ">Error de Pago</h2>
              <p style="
                font-size: 1.125rem;
                color: #4b5563;
                margin-bottom: 1.5rem;
              ">Error al procesar el pago en efectivo. Por favor, intente nuevamente.</p>
              <button onclick="this.parentElement.parentElement.remove()" style="
                background: #dc2626;
                color: white;
                border: none;
                padding: 0.75rem 1.5rem;
                border-radius: 8px;
                font-size: 1rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s;
              " onmouseover="this.style.background='#b91c1c'" onmouseout="this.style.background='#dc2626'">
                Cerrar
              </button>
            </div>
          </div>
        `;
        document.body.appendChild(errorModal);
      }
    },
    [cart, onCheckout, clearCart, generateReceipt]
  );

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

  // Handle checkout
  const handleCheckout = useCallback(
    async (paymentType: PaymentType) => {
      if (cart.items.length === 0) return;

      try {
        await onCheckout(cart, paymentType);
        clearCart();
        setShowPaymentModal(false);
      } catch (error) {
        console.error("Checkout error:", error);
      }
    },
    [cart, onCheckout, clearCart]
  );

  // Handle hold order
  const handleHoldOrder = useCallback(async () => {
    if (cart.items.length === 0) return;

    try {
      await onHoldOrder(cart);
      clearCart();
    } catch (error) {
      console.error("Hold order error:", error);
    }
  }, [cart, onHoldOrder, clearCart]);

  return (
    <div className="min-h-screen bg-card flex flex-col">
      {/* Header */}
      <header className="bg-background shadow-sm border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold ">CAJA</h1>
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
          {/* <Button variant="outline" size="sm">
            <Settings className="w-4 h-4" />
          </Button> */}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Products Section */}
        <div className="flex-1 p-4 pr-80">
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
                    whileTap={{ scale: 0.95 }}
                    className="cursor-pointer"
                    onClick={() => addToCart(item)}
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
                            addToCart(item);
                          }}
                          size="sm"
                          className="w-full mt-2"
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

            {/* Customer Selection */}
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => setShowCustomerModal(true)}
            >
              <User className="w-4 h-4 mr-2" />
              {cart.customer ? cart.customer.name : "Seleccionar Cliente"}
            </Button>
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
                    <div className="flex-1">
                      <h4 className="font-medium text-sm leading-tight">
                        {item.name}
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
                  className="w-full py-3 text-base"
                  onClick={() => setShowPaymentModal(true)}
                  disabled={isProcessing}
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Finalizar Venta
                </Button>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    onClick={handleHoldOrder}
                    disabled={isProcessing}
                  >
                    <PauseCircle className="w-4 h-4 mr-1" />
                    Retener
                  </Button>
                  <Button variant="outline">
                    <MoreHorizontal className="w-4 h-4 mr-1" />
                    Más
                  </Button>
                </div>
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
                  className="w-full py-3 text-base"
                  onClick={() => {
                    setShowPaymentModal(false);
                    setShowCashCalculator(true);
                  }}
                  disabled={isProcessing}
                >
                  <Banknote className="w-5 h-5 mr-2" />
                  Pago en Efectivo
                </Button>

                <Button
                  variant="outline"
                  className="w-full py-3 text-base"
                  onClick={() => handleCheckout(PaymentType.MIXED)}
                  disabled={isProcessing}
                >
                  <CreditCard className="w-5 h-5 mr-2" />
                  Pago con Tarjeta
                </Button>

                <Button
                  variant="outline"
                  className="w-full py-3 text-base"
                  onClick={() => handleCheckout(PaymentType.MIXED)}
                >
                  <MoreHorizontal className="w-5 h-5 mr-2" />
                  Pago Fraccionado
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Customer Modal */}
      <AnimatePresence>
        {showCustomerModal && (
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
              className="bg-background rounded-lg p-6 w-full max-w-md max-h-96 overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Seleccionar Cliente</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCustomerModal(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    setCart((prev) => ({ ...prev, customer: undefined }));
                    setShowCustomerModal(false);
                  }}
                >
                  Cliente Ocasional
                </Button>

                {customers.map((customer) => (
                  <Button
                    key={customer.id}
                    variant="outline"
                    className="w-full justify-start text-left"
                    onClick={() => {
                      setCart((prev) => ({ ...prev, customer }));
                      setShowCustomerModal(false);
                    }}
                  >
                    <div>
                      <div className="font-medium">{customer.name}</div>
                      <div className="text-xs text-gray-500">
                        {customer.phone}
                      </div>
                    </div>
                  </Button>
                ))}
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
    </div>
  );
}
