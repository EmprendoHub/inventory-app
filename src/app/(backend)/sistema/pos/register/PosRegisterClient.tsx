"use client";

import { useState } from "react";
import PosRegister from "../_components/PosRegister";
import {
  CartState,
  PaymentType,
  Discount,
  ScanResult,
  CashBreakdown,
} from "@/types/pos";
import { ItemType } from "@/types/items";
import { clientType } from "@/types/sales";
import { FavoriteType } from "@/types/pos";
import {
  createPosOrder,
  createHeldOrder,
  updateFavorites,
} from "../_actions/pos-actions";

interface PosRegisterClientProps {
  items: ItemType[];
  favorites: FavoriteType[];
  customers: clientType[];
  discounts: Discount[];
}

export default function PosRegisterClient({
  items,
  favorites,
  customers,
  discounts,
}: PosRegisterClientProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  // Print receipt function
  const printReceipt = (receiptData: any) => {
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
                receiptData.paymentType === PaymentType.CASH &&
                receiptData.cashReceived
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
  };

  // Generate receipt
  const generateReceipt = (
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
  };

  const handleCheckout = async (
    cart: CartState,
    paymentType: PaymentType,
    billBreakdown?: CashBreakdown,
    cashReceived?: number
  ) => {
    setIsProcessing(true);
    try {
      const result = await createPosOrder(
        cart,
        paymentType,
        undefined, // customerId
        billBreakdown // billBreakdown as CashBreakdown object
      );

      if (result.success) {
        // Calculate change for cash payments
        const changeAmount =
          paymentType === PaymentType.CASH && cashReceived
            ? cashReceived - cart.totalAmount
            : 0;

        // Generate and print receipt for cash payments
        if (paymentType === PaymentType.CASH && cashReceived) {
          generateReceipt(cart, paymentType, cashReceived, changeAmount);
        }

        // Show success message with change amount instead of order ID for cash payments
        const successModal = document.createElement("div");
        successModal.innerHTML = `
          <div style="
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
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
                color: #16a34a;
                font-size: 3rem;
                margin-bottom: 1rem;
              ">✅</div>
              <h2 style="
                font-size: 1.5rem;
                font-weight: bold;
                color: #1f2937;
                margin-bottom: 1rem;
              ">Venta Completada</h2>
              ${
                paymentType === PaymentType.CASH && changeAmount > 0
                  ? `<p style="
                    font-size: 1.125rem;
                    color: #4b5563;
                    margin-bottom: 0.5rem;
                  ">Cambio a entregar:</p>
                  <p style="
                    font-size: 2rem;
                    font-weight: bold;
                    color: #16a34a;
                    margin-bottom: 1.5rem;
                  ">$${changeAmount.toFixed(2)}</p>`
                  : `<p style="
                    font-size: 1.125rem;
                    color: #4b5563;
                    margin-bottom: 1.5rem;
                  ">La venta se procesó correctamente.</p>`
              }
              <button onclick="this.parentElement.parentElement.remove(); window.location.reload();" style="
                background: #16a34a;
                color: white;
                border: none;
                padding: 0.75rem 1.5rem;
                border-radius: 8px;
                font-size: 1rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s;
              " onmouseover="this.style.background='#15803d'" onmouseout="this.style.background='#16a34a'">
                Continuar
              </button>
            </div>
          </div>
        `;
        document.body.appendChild(successModal);
      } else {
        // Handle error returned from server action
        const errorMessage =
          result.error || "Ocurrió un error durante el proceso de pago.";
        const isStockError =
          result.isStockError || errorMessage.includes("Stock insuficiente");

        console.error("Checkout error:", errorMessage);

        // Create a custom error modal
        const errorModal = document.createElement("div");
        errorModal.innerHTML = `
          <div style="
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
          ">
            <div style="
              background: white;
              padding: 2rem;
              border-radius: 12px;
              box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
              text-align: center;
              max-width: 500px;
              margin: 1rem;
            ">
              <div style="
                color: ${isStockError ? "#f59e0b" : "#dc2626"};
                font-size: 3rem;
                margin-bottom: 1rem;
              ">${isStockError ? "📦" : "⚠️"}</div>
              <h2 style="
                font-size: 1.5rem;
                font-weight: bold;
                color: #1f2937;
                margin-bottom: 1rem;
              ">${
                isStockError ? "Stock Insuficiente" : "Error en el Checkout"
              }</h2>
              <p style="
                font-size: 1rem;
                color: #4b5563;
                margin-bottom: 1.5rem;
                text-align: left;
                background: #f3f4f6;
                padding: 1rem;
                border-radius: 8px;
                border-left: 4px solid ${isStockError ? "#f59e0b" : "#dc2626"};
              ">${errorMessage}</p>
              ${
                isStockError
                  ? `<p style="
                  font-size: 0.875rem;
                  color: #6b7280;
                  margin-bottom: 1.5rem;
                ">Por favor, ajuste las cantidades y vuelva a intentar. El carrito se ha mantenido.</p>`
                  : ""
              }
              <button onclick="this.parentElement.parentElement.remove()" style="
                background: ${isStockError ? "#f59e0b" : "#dc2626"};
                color: white;
                border: none;
                padding: 0.75rem 1.5rem;
                border-radius: 8px;
                font-size: 1rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s;
              " onmouseover="this.style.background='${
                isStockError ? "#d97706" : "#b91c1c"
              }'" onmouseout="this.style.background='${
          isStockError ? "#f59e0b" : "#dc2626"
        }'">
                ${isStockError ? "Entendido" : "Cerrar"}
              </button>
            </div>
          </div>
        `;
        document.body.appendChild(errorModal);

        // Note: We don't clear the cart here when there's an error
        // The cart should remain intact so user can adjust quantities
      }
    } catch (error) {
      console.error("Unexpected checkout error:", error);

      // Handle any unexpected errors (network issues, etc.)
      const errorModal = document.createElement("div");
      errorModal.innerHTML = `
        <div style="
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
        ">
          <div style="
            background: white;
            padding: 2rem;
            border-radius: 12px;
            box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
            text-align: center;
            max-width: 500px;
            margin: 1rem;
          ">
            <div style="
              color: #dc2626;
              font-size: 3rem;
              margin-bottom: 1rem;
            ">⚠️</div>
            <h2 style="
              font-size: 1.5rem;
              font-weight: bold;
              color: #1f2937;
              margin-bottom: 1rem;
            ">Error de Conexión</h2>
            <p style="
              font-size: 1rem;
              color: #4b5563;
              margin-bottom: 1.5rem;
              text-align: left;
              background: #f3f4f6;
              padding: 1rem;
              border-radius: 8px;
              border-left: 4px solid #dc2626;
            ">Ocurrió un error de conexión. Por favor, verifique su conexión a internet e intente nuevamente.</p>
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
    } finally {
      setIsProcessing(false);
    }
  };

  const handleHoldOrder = async (cart: CartState) => {
    setIsProcessing(true);
    try {
      const result = await createHeldOrder(cart);

      if (result.success) {
        // Show success message
        const successModal = document.createElement("div");
        successModal.innerHTML = `
          <div style="
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
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
              ">⏸️</div>
              <h2 style="
                font-size: 1.5rem;
                font-weight: bold;
                color: #1f2937;
                margin-bottom: 1rem;
              ">Orden Suspendida</h2>
              <p style="
                font-size: 1.125rem;
                color: #4b5563;
                margin-bottom: 1.5rem;
              ">La orden se suspendió correctamente. ID: ${result.heldOrderId}</p>
              <button onclick="this.parentElement.parentElement.remove(); window.location.reload();" style="
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
                Continuar
              </button>
            </div>
          </div>
        `;
        document.body.appendChild(successModal);
      }
    } catch (error) {
      console.error("Hold order error:", error);

      // Show error message
      const errorModal = document.createElement("div");
      errorModal.innerHTML = `
        <div style="
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
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
            ">Error al Suspender</h2>
            <p style="
              font-size: 1.125rem;
              color: #4b5563;
              margin-bottom: 1.5rem;
            ">${
              error instanceof Error
                ? error.message
                : "No se pudo suspender la orden."
            }</p>
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
    } finally {
      setIsProcessing(false);
    }
  };

  const handleScanBarcode = () => {
    console.log("Barcode scan initiated");
    // In a real app, this would open camera or barcode scanner
  };

  // Handler for barcode scan results
  const handleScanResult = (scanResult: ScanResult) => {
    // Process scan result - could be item lookup by barcode
    console.log("Scanned:", scanResult);
    // TODO: Implement item lookup by barcode
  };

  // Handler for applying discounts
  const handleApplyDiscount = (discount: Discount) => {
    // Apply discount to the sale
    console.log("Applied discount:", discount);
    // TODO: Implement discount calculation logic
  };

  // Handler for favorites updates
  const handleUpdateFavorites = async (favorites: FavoriteType[]) => {
    try {
      await updateFavorites(favorites);
      console.log("Favorites updated successfully");
    } catch (error) {
      console.error("Error updating favorites:", error);
    }
  };

  return (
    <div className="min-h-screen bg-card">
      <PosRegister
        items={items}
        favorites={favorites}
        customers={customers}
        onCheckout={handleCheckout}
        onHoldOrder={handleHoldOrder}
        onScanBarcode={handleScanBarcode}
        isProcessing={isProcessing}
        discounts={discounts}
        onScanResult={handleScanResult}
        onApplyDiscount={handleApplyDiscount}
        onUpdateFavorites={handleUpdateFavorites}
      />
    </div>
  );
}
