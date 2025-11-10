"use client";

import { useState } from "react";
import PosRegister from "../_components/PosRegister";
import { CartState, PaymentType, Discount, ScanResult } from "@/types/pos";
import { ItemType } from "@/types/items";
import { clientType } from "@/types/sales";
import { FavoriteType } from "@/types/pos";
import {
  createPosOrder,
  updateFavorites,
  createBranchNotificationFromPos,
  verifyOrderExists,
} from "../_actions/pos-actions";
import { printReceipt as printReceiptUtil } from "@/lib/receiptPrinter";

// Cross-warehouse fulfillment is now handled directly in the POS order creation

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

  // Helper function to show success modal with cross-warehouse notifications
  const showSuccessModalWithNotifications = (crossWarehouseNeeds: any[]) => {
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
          max-width: 500px;
          margin: 1rem;
        ">
          <div style="color: #10b981; font-size: 3rem; margin-bottom: 1rem;">✅</div>
          <h3 style="
            font-size: 1.25rem;
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 1rem;
          ">¡Venta Completada!</h3>
          <p style="
            font-size: 0.875rem;
            color: #6b7280;
            margin-bottom: 1.5rem;
          ">La venta se ha procesado exitosamente.</p>
          
          ${
            crossWarehouseNeeds.length > 0
              ? `
            <div style="
              background: #f3f4f6;
              padding: 1rem;
              border-radius: 8px;
              margin-bottom: 1.5rem;
              text-align: left;
            ">
              <h4 style="
                font-size: 1rem;
                font-weight: 600;
                color: #1f2937;
                margin-bottom: 0.75rem;
              ">⚠️ Productos por surtir desde otras sucursales:</h4>
              <ul style="
                list-style: none;
                padding: 0;
                margin: 0;
              ">
                ${crossWarehouseNeeds
                  .map(
                    (need) => `
                  <li style="
                    padding: 0.5rem 0;
                    border-bottom: 1px solid #e5e7eb;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                  ">
                    <span style="font-weight: 500; color:#1f2937;">${need.itemName}</span>.
                    <span style="color: #6b7280;">Cantidad: ${need.requiredQuantity}</span>
                  </li>
                `
                  )
                  .join("")}
              </ul>
              <p style="
                font-size: 0.875rem;
                color: #f59e0b;
                margin-top: 1rem;
                margin-bottom: 0;
              ">💡 ¿Quiere notificar a otras sucursales para completar esta venta?</p>
            </div>
            
            <div style="
              display: flex;
              gap: 0.75rem;
              justify-content: center;
              flex-wrap: wrap;
            ">
              <button 
                onclick="skipNotifications()"
                style="
                  background: #6b7280;
                  color: white;
                  border: none;
                  padding: 0.75rem 1.5rem;
                  border-radius: 8px;
                  cursor: pointer;
                  font-size: 0.875rem;
                "
              >
                Omitir notificaciones
              </button>
              ${crossWarehouseNeeds
                .map(
                  (need) => `
                <button 
                  onclick="showWarehouseOptions('${need.itemId}', '${need.itemName}', ${need.requiredQuantity})"
                  style="
                    background: #3b82f6;
                    color: white;
                    border: none;
                    padding: 0.75rem 1rem;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 0.875rem;
                  "
                >
                  Solicitar ${need.itemName}
                </button>
              `
                )
                .join("")}
            </div>
          `
              : `
            <button 
              onclick="this.parentElement.parentElement.remove(); window.location.reload();"
              style="
                background: #10b981;
                color: white;
                border: none;
                padding: 0.75rem 1.5rem;
                border-radius: 8px;
                cursor: pointer;
              "
            >
              Continuar
            </button>
          `
          }
        </div>
      </div>
    `;
    document.body.appendChild(successModal);

    // Add global functions for cross-warehouse notifications if needed
    if (crossWarehouseNeeds.length > 0) {
      (window as any).skipNotifications = () => {
        successModal.remove();
        window.location.reload();
      };

      (window as any).showWarehouseOptions = async (
        itemId: string,
        itemName: string,
        quantity: number
      ) => {
        try {
          // Fetch available warehouses for this item
          const response = await fetch(`/api/items/${itemId}/stocks`);
          const stockData = await response.json();

          if (
            stockData.otherWarehouses &&
            stockData.otherWarehouses.length > 0
          ) {
            const warehousesWithStock = stockData.otherWarehouses.filter(
              (w: any) => w.stock >= quantity
            );

            if (warehousesWithStock.length === 0) {
              alert(
                "No hay suficiente stock en otras sucursales para este producto."
              );
              return;
            }

            // Show warehouse selection modal
            const warehouseModal = document.createElement("div");
            let warehouseButtonsHtml = "";
            warehousesWithStock.forEach((warehouse: any) => {
              warehouseButtonsHtml += `
                <button 
                  onclick="selectDeliveryMethod('${itemId}', '${itemName}', ${quantity}, '${warehouse.id}', '${warehouse.name}')" 
                  style="
                    background: #f3f4f6; color: #1f2937; 
                    border: 1px solid #d1d5db; 
                    padding: 0.75rem 1rem; 
                    border-radius: 8px; 
                    cursor: pointer; 
                    transition: all 0.2s; 
                    text-align: left; 
                    width: 100%; 
                    margin-bottom: 0.5rem;
                  " 
                  onmouseover="this.style.background='#e5e7eb'" 
                  onmouseout="this.style.background='#f3f4f6'"
                >
                  <strong>${warehouse.name}</strong><br>
                  <small style="color: #6b7280;">Stock disponible: ${warehouse.stock}</small>
                </button>
              `;
            });

            warehouseModal.innerHTML = `
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
                z-index: 10001;
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
                  <h3 style="
                    font-size: 1.25rem; 
                    font-weight: bold; 
                    color: #1f2937; 
                    margin-bottom: 1rem;
                  ">Seleccionar Sucursal</h3>
                  <p style="
                    font-size: 0.875rem; 
                    color: #6b7280; 
                    margin-bottom: 1.5rem;
                  ">Solicitar ${quantity} unidades de ${itemName}</p>
                  <div style="
                    display: flex; 
                    flex-direction: column; 
                    gap: 0.75rem; 
                    margin-bottom: 1.5rem;
                  ">
                    ${warehouseButtonsHtml}
                  </div>
                  <button 
                    onclick="this.parentElement.parentElement.remove()" 
                    style="
                      background: #6b7280; 
                      color: white; 
                      border: none; 
                      padding: 0.75rem 1.5rem; 
                      border-radius: 8px; 
                      cursor: pointer;
                    "
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            `;

            document.body.appendChild(warehouseModal);

            // Define selectDeliveryMethod function globally
            (window as any).selectDeliveryMethod = (
              itemId: string,
              itemName: string,
              quantity: number,
              warehouseId: string,
              warehouseName: string
            ) => {
              // Close the warehouse selection modal first
              const warehouseModal = document.querySelector(
                '[style*="z-index: 10001"]'
              );
              if (warehouseModal) {
                warehouseModal.remove();
              }

              // Show delivery method selection modal
              const deliveryModal = document.createElement("div");
              deliveryModal.innerHTML = `
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
                  z-index: 10001;
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
                    <h3 style="
                      font-size: 1.25rem;
                      font-weight: bold;
                      color: #1f2937;
                      margin-bottom: 1rem;
                    ">¿Cómo desea manejar la entrega?</h3>
                    
                    <p style="
                      font-size: 0.875rem;
                      color: #6b7280;
                      margin-bottom: 1.5rem;
                    ">Solicitar ${quantity} unidades de ${itemName} de ${warehouseName}</p>
                    
                    <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                      <button 
                        onclick="createNotification('${itemId}', '${itemName}', ${quantity}, '${warehouseId}', 'CUSTOMER_PICKUP')"
                        style="
                          background: #3b82f6;
                          color: white;
                          border: none;
                          padding: 0.75rem 1rem;
                          border-radius: 8px;
                          cursor: pointer;
                          transition: all 0.2s;
                        "
                      >
                        🏃‍♂️ Cliente recoge en ${warehouseName}
                      </button>
                      
                      <button 
                        onclick="createNotification('${itemId}', '${itemName}', ${quantity}, '${warehouseId}', 'DELIVERY')"
                        style="
                          background: #10b981;
                          color: white;
                          border: none;
                          padding: 0.75rem 1rem;
                          border-radius: 8px;
                          cursor: pointer;
                          transition: all 0.2s;
                        "
                      >
                        🚚 Enviar a nuestra sucursal
                      </button>
                      
                      <button 
                        onclick="createNotification('${itemId}', '${itemName}', ${quantity}, '${warehouseId}', 'DIRECT_DELIVERY')"
                        style="
                          background: #f59e0b;
                          color: white;
                          border: none;
                          padding: 0.75rem 1rem;
                          border-radius: 8px;
                          cursor: pointer;
                          transition: all 0.2s;
                        "
                      >
                        🏠 Entregar directamente al cliente
                      </button>
                      
                      <button 
                        onclick="this.parentElement.parentElement.parentElement.remove()"
                        style="
                          background: #6b7280;
                          color: white;
                          border: none;
                          padding: 0.75rem 1rem;
                          border-radius: 8px;
                          cursor: pointer;
                          transition: all 0.2s;
                        "
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              `;

              document.body.appendChild(deliveryModal);

              // Add function to create notification
              (window as any).createNotification = async (
                itemId: string,
                itemName: string,
                quantity: number,
                targetWarehouseId: string,
                deliveryMethod: string
              ) => {
                try {
                  const result = await createBranchNotificationFromPos(
                    itemId,
                    itemName,
                    quantity,
                    targetWarehouseId,
                    (window as any).currentCustomerId, // Use globally stored customer ID
                    deliveryMethod as any,
                    `Solicitud desde POS para completar venta`
                  );

                  // Close modals
                  deliveryModal.remove();

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
                          <div style="color: #10b981; font-size: 3rem; margin-bottom: 1rem;">✅</div>
                          <h3 style="
                            font-size: 1.25rem;
                            font-weight: bold;
                            color: #1f2937;
                            margin-bottom: 1rem;
                          ">Notificación Enviada</h3>
                          <p style="
                            font-size: 0.875rem;
                            color: #6b7280;
                            margin-bottom: 1.5rem;
                          ">Se ha notificado a ${warehouseName} sobre la solicitud de ${itemName}. Recibirá una respuesta pronto.</p>
                          <button 
                            onclick="closeAllModalsAndReload()"
                            style="
                              background: #10b981;
                              color: white;
                              border: none;
                              padding: 0.75rem 1.5rem;
                              border-radius: 8px;
                              cursor: pointer;
                            "
                          >
                            Entendido
                          </button>
                        </div>
                      </div>
                    `;
                    document.body.appendChild(successModal);
                  } else {
                    throw new Error(
                      result.error || "Error al crear notificación"
                    );
                  }
                } catch (error) {
                  console.error("Full error details:", error);
                  alert("Error al enviar notificación: " + error);
                }
              };

              // Add global function to close all modals and reload
              (window as any).closeAllModalsAndReload = () => {
                // Remove all modals with high z-index
                const modals = document.querySelectorAll(
                  '[style*="z-index: 10000"], [style*="z-index: 10001"]'
                );
                modals.forEach((modal) => modal.remove());

                // Also try to remove any remaining modals by class or other selectors
                const allModals = document.querySelectorAll(
                  'div[style*="position: fixed"][style*="background: rgba(0, 0, 0, 0.5)"]'
                );
                allModals.forEach((modal) => modal.remove());

                // Reload the page
                window.location.reload();
              };
            };
          } else {
            alert("No se encontraron otras sucursales con stock disponible.");
          }
        } catch (error) {
          console.error("Error fetching warehouse options:", error);
          alert("Error al obtener opciones de sucursales.");
        }
      };
    }
  };

  // Generate receipt
  const generateReceipt = (
    cartData: CartState,
    paymentType: PaymentType,
    cashReceived?: number,
    changeAmount?: number,
    referenceNumber?: string,
    orderNumber?: string
  ) => {
    const receiptData = {
      orderNumber: orderNumber || `POS-${Date.now()}`,
      date: new Date().toLocaleString("es-ES"),
      customer: cartData.customer?.name || "Cliente General",
      items: cartData.items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      })),
      subtotal: cartData.subtotal,
      tax: cartData.taxAmount,
      discount: cartData.discountAmount,
      tip: cartData.tipAmount,
      total: cartData.totalAmount,
      paymentType: paymentType === PaymentType.CASH ? "CASH" : undefined,
      cashReceived,
      changeAmount,
      referenceNumber,
      paymentMethod:
        paymentType === PaymentType.CARD
          ? "CARD"
          : paymentType === PaymentType.TRANSFER
          ? "TRANSFER"
          : undefined,
    };

    // Use the shared receipt printer utility
    printReceiptUtil(receiptData);
  };

  const handleCheckout = async (
    cart: CartState,
    paymentType: PaymentType,
    cashReceived?: number,
    referenceNumber?: string
  ) => {
    // Store customer info globally for use in notification functions
    if (cart.customer) {
      (window as any).currentCustomerId = cart.customer.id;
    }

    setIsProcessing(true);
    try {
      const result = await createPosOrder(
        cart,
        paymentType,
        cart.customer?.id, // Pass the selected customer ID from cart
        cashReceived, // Amount of cash received from customer
        referenceNumber // Payment reference number for cards/transfers
      );

      if (result.success && result.orderNumber) {
        // CRITICAL FIX: Verify the order exists in database before printing receipt
        // This prevents race conditions where receipt prints but transaction fails
        const verification = await verifyOrderExists(result.orderNumber);

        if (!verification.exists) {
          throw new Error(
            "Error: La orden no se registró correctamente en la base de datos"
          );
        }

        // Only print receipt AFTER database verification confirms order exists
        if (paymentType === PaymentType.CASH && cashReceived) {
          const changeAmount = result.changeAmount || 0;
          generateReceipt(
            cart,
            paymentType,
            cashReceived,
            changeAmount,
            undefined,
            result.orderNumber
          );
        } else {
          // Generate receipt for card, transfer, and account payments
          generateReceipt(
            cart,
            paymentType,
            undefined,
            undefined,
            referenceNumber,
            result.orderNumber
          );
        }

        // Use stock suggestions from order result instead of checking again
        const crossWarehouseNeeds = result.stockSuggestions || [];

        // Show a brief "Printing receipt..." message, then show success modal
        const printingModal = document.createElement("div");
        printingModal.innerHTML = `
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
            z-index: 9999;
          ">
            <div style="
              background: white;
              padding: 2rem;
              border-radius: 12px;
              box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
              text-align: center;
              max-width: 300px;
            ">
              <div style="color: #3b82f6; font-size: 2rem; margin-bottom: 1rem;">🖨️</div>
              <h3 style="
                font-size: 1.125rem;
                font-weight: bold;
                color: #1f2937;
                margin-bottom: 0.5rem;
              ">Imprimiendo recibo...</h3>
              <p style="
                font-size: 0.875rem;
                color: #6b7280;
              ">Por favor espere</p>
            </div>
          </div>
        `;
        document.body.appendChild(printingModal);

        // Wait for receipt to print, then show success modal
        setTimeout(() => {
          printingModal.remove();
          showSuccessModalWithNotifications(crossWarehouseNeeds);
        }, 1000); // 1 second delay (shorter since no popup window needed)

        // AUTO-CREATE NOTIFICATIONS for items needing cross-warehouse fulfillment
        if (crossWarehouseNeeds.length > 0) {
          for (const item of crossWarehouseNeeds) {
            if (item.availableWarehouses.length > 0) {
              // Auto-select the first available warehouse and create notification
              const targetWarehouse = item.availableWarehouses[0];

              try {
                await createBranchNotificationFromPos(
                  item.itemId,
                  item.itemName,
                  item.requiredQuantity,
                  targetWarehouse.warehouseId,
                  cart.customer?.id,
                  "CUSTOMER_PICKUP", // Default delivery method
                  `Solicitud automática desde POS - Venta completada pero stock insuficiente localmente`
                );
              } catch (error) {
                console.error(
                  "❌ DEBUG: Error creating auto-notification:",
                  error
                );
              }
            }
          }
        }

        // Add functions for cross-warehouse notifications
        if (crossWarehouseNeeds.length > 0) {
          (window as any).skipNotifications = () => {
            // Note: successModal is no longer available since we use helper function
            // Just reload the page
            window.location.reload();
          };

          (window as any).showWarehouseOptions = async (
            itemId: string,
            itemName: string,
            quantity: number
          ) => {
            try {
              // Fetch available warehouses for this item
              const response = await fetch("/api/items/" + itemId + "/stocks");
              const stockData = await response.json();

              if (
                stockData.otherWarehouses &&
                stockData.otherWarehouses.length > 0
              ) {
                const warehousesWithStock = stockData.otherWarehouses.filter(
                  (w: any) => w.stock >= quantity
                );

                if (warehousesWithStock.length === 0) {
                  alert(
                    "No hay suficiente stock en otras sucursales para este producto."
                  );
                  return;
                }

                // Show warehouse selection modal
                const warehouseModal = document.createElement("div");
                let warehouseButtonsHtml = "";
                warehousesWithStock.forEach((warehouse: any) => {
                  warehouseButtonsHtml +=
                    "<button onclick=\"selectDeliveryMethod('" +
                    itemId +
                    "', '" +
                    itemName +
                    "', " +
                    quantity +
                    ", '" +
                    warehouse.id +
                    "', '" +
                    warehouse.name +
                    '\')" style="background: #0a0a0a; border: 1px solid #d1d5db; padding: 0.75rem 1rem; border-radius: 8px; cursor: pointer; transition: all 0.2s; text-align: left; width: 100%; margin-bottom: 0.5rem;" onmouseover="this.style.background=\'#a9a9a9\'" onmouseout="this.style.background=\'#f3f4f6\'"><strong>' +
                    warehouse.name +
                    '</strong><br><small style="color: #6b7280;">Stock disponible: ' +
                    warehouse.stock +
                    "</small></button>";
                });

                warehouseModal.innerHTML =
                  '<div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.5); display: flex; align-items: center; justify-content: center; z-index: 10001;">' +
                  '<div style="background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); text-align: center; max-width: 500px; margin: 1rem;">' +
                  '<h3 style="font-size: 1.25rem; font-weight: bold; color: #1f2937; margin-bottom: 1rem;">Seleccionar Sucursal</h3>' +
                  '<p style="font-size: 0.875rem; color: #6b7280; margin-bottom: 1.5rem;">Solicitar ' +
                  quantity +
                  " unidades de " +
                  itemName +
                  "</p>" +
                  '<div style="display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 1.5rem;">' +
                  warehouseButtonsHtml +
                  "</div>" +
                  '<button onclick="this.parentElement.parentElement.remove()" style="background: #6b7280; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; cursor: pointer;">Cancelar</button>' +
                  "</div>" +
                  "</div>";

                document.body.appendChild(warehouseModal);

                // Define selectDeliveryMethod function globally for this modal
                (window as any).selectDeliveryMethod = (
                  itemId: string,
                  itemName: string,
                  quantity: number,
                  warehouseId: string,
                  warehouseName: string
                ) => {
                  // Close the warehouse selection modal first
                  const warehouseModal = document.querySelector(
                    '[style*="z-index: 10001"]'
                  );
                  if (warehouseModal) {
                    warehouseModal.remove();
                  }

                  // Show delivery method selection modal
                  const deliveryModal = document.createElement("div");
                  deliveryModal.innerHTML = `
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
                      z-index: 10001;
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
                        <h3 style="
                          font-size: 1.25rem;
                          font-weight: bold;
                          color: #1f2937;
                          margin-bottom: 1rem;
                        ">¿Cómo desea manejar la entrega?</h3>
                        
                        <p style="
                          font-size: 0.875rem;
                          color: #6b7280;
                          margin-bottom: 1.5rem;
                        ">Solicitar ${quantity} unidades de ${itemName} de ${warehouseName}</p>
                        
                        <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                          <button 
                            onclick="createNotification('${itemId}', '${itemName}', ${quantity}, '${warehouseId}', 'CUSTOMER_PICKUP')"
                            style="
                              background: #3b82f6;
                              color: white;
                              border: none;
                              padding: 0.75rem 1rem;
                              border-radius: 8px;
                              cursor: pointer;
                              transition: all 0.2s;
                            "
                          >
                            🏃‍♂️ Cliente recoge en ${warehouseName}
                          </button>
                          
                          <button 
                            onclick="createNotification('${itemId}', '${itemName}', ${quantity}, '${warehouseId}', 'DELIVERY')"
                            style="
                              background: #10b981;
                              color: white;
                              border: none;
                              padding: 0.75rem 1rem;
                              border-radius: 8px;
                              cursor: pointer;
                              transition: all 0.2s;
                            "
                          >
                            🚚 Enviar a nuestra sucursal
                          </button>
                          
                          <button 
                            onclick="createNotification('${itemId}', '${itemName}', ${quantity}, '${warehouseId}', 'DIRECT_DELIVERY')"
                            style="
                              background: #f59e0b;
                              color: white;
                              border: none;
                              padding: 0.75rem 1rem;
                              border-radius: 8px;
                              cursor: pointer;
                              transition: all 0.2s;
                            "
                          >
                            🏠 Entregar directamente al cliente
                          </button>
                          
                          <button 
                            onclick="this.parentElement.parentElement.parentElement.remove()"
                            style="
                              background: #6b7280;
                              color: white;
                              border: none;
                              padding: 0.75rem 1rem;
                              border-radius: 8px;
                              cursor: pointer;
                              transition: all 0.2s;
                            "
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    </div>
                  `;

                  document.body.appendChild(deliveryModal);

                  // Add function to create notification
                  (window as any).createNotification = async (
                    itemId: string,
                    itemName: string,
                    quantity: number,
                    targetWarehouseId: string,
                    deliveryMethod: string
                  ) => {
                    try {
                      const result = await createBranchNotificationFromPos(
                        itemId,
                        itemName,
                        quantity,
                        targetWarehouseId,
                        cart.customer?.id, // Pass the actual customer ID
                        deliveryMethod as any,
                        `Solicitud desde POS para completar venta`
                      );

                      // Close modals
                      deliveryModal.remove();

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
                              <div style="color: #10b981; font-size: 3rem; margin-bottom: 1rem;">✅</div>
                              <h3 style="
                                font-size: 1.25rem;
                                font-weight: bold;
                                color: #1f2937;
                                margin-bottom: 1rem;
                              ">Notificación Enviada</h3>
                              <p style="
                                font-size: 0.875rem;
                                color: #6b7280;
                                margin-bottom: 1.5rem;
                              ">Se ha notificado a ${warehouseName} sobre la solicitud de ${itemName}. Recibirá una respuesta pronto.</p>
                              <button 
                                onclick="closeAllModalsAndReload()"
                                style="
                                  background: #10b981;
                                  color: white;
                                  border: none;
                                  padding: 0.75rem 1.5rem;
                                  border-radius: 8px;
                                  cursor: pointer;
                                "
                              >
                                Entendido
                              </button>
                            </div>
                          </div>
                        `;
                        document.body.appendChild(successModal);
                      } else {
                        throw new Error(
                          result.error || "Error al crear notificación"
                        );
                      }
                    } catch (error) {
                      console.error(
                        "❌ DEBUG: Error creating branch notification:",
                        error
                      );
                      console.error("Full error details:", error);
                      alert("Error al enviar notificación: " + error);
                    }
                  };
                };

                // Add global function to close all modals and reload
                (window as any).closeAllModalsAndReload = () => {
                  // Remove all modals with high z-index
                  const modals = document.querySelectorAll(
                    '[style*="z-index: 10000"], [style*="z-index: 10001"]'
                  );
                  modals.forEach((modal) => modal.remove());

                  // Also try to remove any remaining modals by class or other selectors
                  const allModals = document.querySelectorAll(
                    'div[style*="position: fixed"][style*="background: rgba(0, 0, 0, 0.5)"]'
                  );
                  allModals.forEach((modal) => modal.remove());

                  // Reload the page
                  window.location.reload();
                };
              } else {
                alert(
                  "No se encontraron otras sucursales con stock disponible."
                );
              }
            } catch (error) {
              console.error("Error fetching warehouse options:", error);
              alert("Error al obtener opciones de sucursales.");
            }
          };
        }
      } else {
        // Handle error returned from server action
        const errorMessage =
          result.error || "Ocurrió un error durante el proceso de pago.";
        const isStockError =
          result.isStockError || errorMessage.includes("Stock insuficiente");

        console.error("Checkout error:", errorMessage);

        // Check if we have stock suggestions for branch notifications
        const hasStockSuggestions =
          result.stockSuggestions && result.stockSuggestions.length > 0;

        // Create a custom error modal with branch notification options
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
              max-width: ${hasStockSuggestions ? "700px" : "500px"};
              margin: 1rem;
              max-height: 90vh;
              overflow-y: auto;
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
                hasStockSuggestions
                  ? `
                <div style="
                  text-align: left;
                  margin-bottom: 1.5rem;
                  padding: 1rem;
                  background: #eff6ff;
                  border-radius: 8px;
                  border: 1px solid #3b82f6;
                ">
                  <h3 style="
                    font-size: 1.125rem;
                    font-weight: 600;
                    color: #1e40af;
                    margin-bottom: 1rem;
                  ">🏬 Stock Disponible en Otras Sucursales</h3>
                  
                  ${result.stockSuggestions
                    ?.map(
                      (suggestion) => `
                    <div style="
                      margin-bottom: 1rem;
                      padding: 0.75rem;
                      background: white;
                      border-radius: 6px;
                      border: 1px solid #e5e7eb;
                    ">
                      <h4 style="
                        font-weight: 600;
                        color: #1f2937;
                        margin-bottom: 0.5rem;
                      ">${suggestion.itemName}</h4>
                      <p style="
                        font-size: 0.875rem;
                        color: #6b7280;
                        margin-bottom: 0.75rem;
                      ">Necesita: ${suggestion.requiredQuantity}, Local: ${
                        suggestion.availableLocally
                      }</p>
                      
                      <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                        ${suggestion.availableWarehouses
                          .map(
                            (warehouse) => `
                          <button 
                            onclick="handleBranchNotification('${suggestion.itemId}', '${suggestion.itemName}', ${suggestion.requiredQuantity}, '${warehouse.warehouseId}', '${warehouse.warehouseName}')"
                            style="
                              background: #10b981;
                              color: white;
                              border: none;
                              padding: 0.5rem 0.75rem;
                              border-radius: 6px;
                              font-size: 0.875rem;
                              cursor: pointer;
                              transition: all 0.2s;
                            "
                            onmouseover="this.style.background='#059669'"
                            onmouseout="this.style.background='#10b981'"
                          >
                            📍 ${warehouse.warehouseName} (${warehouse.availableStock} disponibles)
                          </button>
                        `
                          )
                          .join("")}
                      </div>
                    </div>
                  `
                    )
                    .join("")}
                  
                  <p style="
                    font-size: 0.875rem;
                    color: #6b7280;
                    margin-top: 1rem;
                    font-style: italic;
                  ">💡 Haga clic en una sucursal para solicitar el producto. El cliente podrá recogerlo allí o puede solicitar que se lo envíen.</p>
                </div>
              `
                  : ""
              }
              
              ${
                isStockError && !hasStockSuggestions
                  ? `<p style="
                  font-size: 0.875rem;
                  color: #6b7280;
                  margin-bottom: 1.5rem;
                ">Por favor, ajuste las cantidades y vuelva a intentar. El carrito se ha mantenido.</p>`
                  : ""
              }
              
              <div style="display: flex; gap: 0.75rem; justify-content: center;">
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
                  ${
                    hasStockSuggestions
                      ? "Cancelar"
                      : isStockError
                      ? "Entendido"
                      : "Cerrar"
                  }
                </button>
              </div>
            </div>
          </div>
        `;

        // Add the modal to the body
        document.body.appendChild(errorModal);

        // Add global function to handle branch notifications
        (window as any).handleBranchNotification = async (
          itemId: string,
          itemName: string,
          quantity: number,
          targetWarehouseId: string,
          warehouseName: string
        ) => {
          try {
            // Show delivery method selection modal
            const deliveryModal = document.createElement("div");
            deliveryModal.innerHTML = `
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
                z-index: 10001;
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
                  <h3 style="
                    font-size: 1.25rem;
                    font-weight: bold;
                    color: #1f2937;
                    margin-bottom: 1rem;
                  ">¿Cómo desea manejar la entrega?</h3>
                  
                  <p style="
                    font-size: 0.875rem;
                    color: #6b7280;
                    margin-bottom: 1.5rem;
                  ">Solicitar ${quantity} unidades de ${itemName} de ${warehouseName}</p>
                  
                  <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                    <button 
                      onclick="createNotification('${itemId}', '${itemName}', ${quantity}, '${targetWarehouseId}', 'CUSTOMER_PICKUP')"
                      style="
                        background: #3b82f6;
                        color: white;
                        border: none;
                        padding: 0.75rem 1rem;
                        border-radius: 8px;
                        cursor: pointer;
                        transition: all 0.2s;
                      "
                    >
                      🏃‍♂️ Cliente recoge en ${warehouseName}
                    </button>
                    
                    <button 
                      onclick="createNotification('${itemId}', '${itemName}', ${quantity}, '${targetWarehouseId}', 'DELIVERY')"
                      style="
                        background: #10b981;
                        color: white;
                        border: none;
                        padding: 0.75rem 1rem;
                        border-radius: 8px;
                        cursor: pointer;
                        transition: all 0.2s;
                      "
                    >
                      🚚 Enviar a nuestra sucursal
                    </button>
                    
                    <button 
                      onclick="createNotification('${itemId}', '${itemName}', ${quantity}, '${targetWarehouseId}', 'DIRECT_DELIVERY')"
                      style="
                        background: #f59e0b;
                        color: white;
                        border: none;
                        padding: 0.75rem 1rem;
                        border-radius: 8px;
                        cursor: pointer;
                        transition: all 0.2s;
                      "
                    >
                      🏠 Entregar directamente al cliente
                    </button>
                    
                    <button 
                      onclick="this.parentElement.parentElement.parentElement.remove()"
                      style="
                        background: #6b7280;
                        color: white;
                        border: none;
                        padding: 0.75rem 1rem;
                        border-radius: 8px;
                        cursor: pointer;
                        transition: all 0.2s;
                      "
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            `;

            document.body.appendChild(deliveryModal);

            // Add function to create notification
            (window as any).createNotification = async (
              itemId: string,
              itemName: string,
              quantity: number,
              targetWarehouseId: string,
              deliveryMethod: string
            ) => {
              try {
                const result = await createBranchNotificationFromPos(
                  itemId,
                  itemName,
                  quantity,
                  targetWarehouseId,
                  cart.customer?.id,
                  deliveryMethod as any,
                  `Solicitud desde POS para completar venta`
                );

                // Close modals
                deliveryModal.remove();
                errorModal.remove();

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
                        <div style="color: #10b981; font-size: 3rem; margin-bottom: 1rem;">✅</div>
                        <h3 style="
                          font-size: 1.25rem;
                          font-weight: bold;
                          color: #1f2937;
                          margin-bottom: 1rem;
                        ">Notificación Enviada</h3>
                        <p style="
                          font-size: 0.875rem;
                          color: #6b7280;
                          margin-bottom: 1.5rem;
                        ">Se ha notificado a ${warehouseName} sobre la solicitud de ${itemName}. Recibirá una respuesta pronto.</p>
                        <button 
                          onclick=onclick="closeAllModalsAndReload()"
                          style="
                            background: #10b981;
                            color: white;
                            border: none;
                            padding: 0.75rem 1.5rem;
                            border-radius: 8px;
                            cursor: pointer;
                          "
                        >
                          Entendido
                        </button>
                      </div>
                    </div>
                  `;
                  document.body.appendChild(successModal);
                } else {
                  throw new Error(
                    result.error || "Error al crear notificación"
                  );
                }
              } catch (error) {
                console.error(
                  "❌ DEBUG: Error creating branch notification:",
                  error
                );
                console.error("Full error details:", error);
                alert("Error al enviar notificación: " + error);
              }
            };
          } catch (error) {
            console.error("Error in handleBranchNotification:", error);
          }
        };

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
