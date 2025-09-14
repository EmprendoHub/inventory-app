"use client";

import { useState } from "react";
import PosRegister from "../_components/PosRegister";
import { CartState, PaymentType, Discount, ScanResult } from "@/types/pos";
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

  const handleCheckout = async (cart: CartState, paymentType: PaymentType) => {
    setIsProcessing(true);
    try {
      const result = await createPosOrder(cart, paymentType);

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
              <p style="
                font-size: 1.125rem;
                color: #4b5563;
                margin-bottom: 1.5rem;
              ">La venta se procesó correctamente. Orden: ${result.orderId}</p>
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
      }
    } catch (error) {
      console.error("Checkout error:", error);

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
            ">Error en el Checkout</h2>
            <p style="
              font-size: 1.125rem;
              color: #4b5563;
              margin-bottom: 1.5rem;
            ">${
              error instanceof Error
                ? error.message
                : "Ocurrió un error durante el proceso de pago."
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
