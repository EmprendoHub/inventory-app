"use client";

import { useState } from "react";
import PosRegister from "../_components/PosRegister";
import ChangeModal from "../_components/ChangeModal";
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
  createBranchNotificationFromPos,
} from "../_actions/pos-actions";

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

  // Change modal state
  const [showChangeModal, setShowChangeModal] = useState(false);
  const [changeAmount, setChangeAmount] = useState(0);
  const [changeBreakdown, setChangeBreakdown] = useState<CashBreakdown | null>(
    null
  );

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
    cashReceived?: number,
    referenceNumber?: string
  ) => {
    setIsProcessing(true);
    try {
      const result = await createPosOrder(
        cart,
        paymentType,
        undefined, // customerId
        billBreakdown, // billBreakdown as CashBreakdown object
        cashReceived, // Amount of cash received from customer
        referenceNumber // Payment reference number for cards/transfers
      );

      if (result.success) {
        // Handle change modal for cash payments with change
        if (
          paymentType === PaymentType.CASH &&
          result.changeGiven &&
          result.changeAmount &&
          result.changeAmount > 0
        ) {
          // Show change modal
          setChangeAmount(result.changeAmount);
          setChangeBreakdown(result.changeGiven);
          setShowChangeModal(true);

          // Generate receipt but don't show success modal yet
          if (cashReceived) {
            generateReceipt(
              cart,
              paymentType,
              cashReceived,
              result.changeAmount
            );
          }
          return; // Don't show success modal yet, wait for change confirmation
        }

        // Generate and print receipt for cash payments without change or non-cash payments
        if (paymentType === PaymentType.CASH && cashReceived) {
          const changeAmount = result.changeAmount || 0;
          generateReceipt(cart, paymentType, cashReceived, changeAmount);
        }

        // Use stock suggestions from order result instead of checking again
        const crossWarehouseNeeds = result.stockSuggestions || [];

        console.log(
          "📦 DEBUG: Cross warehouse needs from order:",
          crossWarehouseNeeds
        );

        // Show success message with optional cross-warehouse notifications
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
              max-width: ${crossWarehouseNeeds.length > 0 ? "600px" : "400px"};
              margin: 1rem;
              max-height: 90vh;
              overflow-y: auto;
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
              
              ${
                crossWarehouseNeeds.length > 0
                  ? `
                <div style="
                  text-align: left;
                  margin-bottom: 1.5rem;
                  padding: 1rem;
                  background: #fef3c7;
                  border-radius: 8px;
                  border: 1px solid #f59e0b;
                ">
                  <h3 style="
                    font-size: 1.125rem;
                    font-weight: 600;
                    color: #92400e;
                    margin-bottom: 1rem;
                  ">📦 Stock Vendido de Otras Sucursales</h3>
                  
                  <p style="
                    font-size: 0.875rem;
                    color: #92400e;
                    margin-bottom: 1rem;
                  ">Los siguientes artículos fueron vendidos pero necesitan ser solicitados de otras sucursales:</p>
                  
                  ${crossWarehouseNeeds
                    .map(
                      (item) => `
                    <div style="
                      margin-bottom: 0.75rem;
                      padding: 0.75rem;
                      background: white;
                      border-radius: 6px;
                      border: 1px solid #e5e7eb;
                    ">
                      <h4 style="
                        font-weight: 600;
                        color: #1f2937;
                        margin-bottom: 0.5rem;
                      ">${item.itemName}</h4>
                      <p style="
                        font-size: 0.875rem;
                        color: #6b7280;
                        margin-bottom: 0.75rem;
                      ">Cantidad pendiente: ${item.requiredQuantity} unidades</p>
                      
                      <button 
                        onclick="showWarehouseOptions('${item.itemId}', '${item.itemName}', ${item.requiredQuantity})"
                        style="
                          background: #3b82f6;
                          color: white;
                          border: none;
                          padding: 0.5rem 1rem;
                          border-radius: 6px;
                          font-size: 0.875rem;
                          cursor: pointer;
                          width: 100%;
                          transition: all 0.2s;
                        "
                        onmouseover="this.style.background='#2563eb'"
                        onmouseout="this.style.background='#3b82f6'"
                      >
                        🏬 Solicitar de Otra Sucursal
                      </button>
                    </div>
                  `
                    )
                    .join("")}
                  
                  <p style="
                    font-size: 0.875rem;
                    color: #92400e;
                    margin-top: 1rem;
                    font-style: italic;
                  ">💡 Puede continuar ahora y solicitar los productos después, o enviar las notificaciones ahora.</p>
                </div>
              `
                  : ""
              }
              
              <div style="display: flex; gap: 0.75rem; justify-content: center; flex-wrap: wrap;">
                ${
                  crossWarehouseNeeds.length > 0
                    ? `
                  <button onclick="skipNotifications()" style="
                    background: #6b7280;
                    color: white;
                    border: none;
                    padding: 0.75rem 1.5rem;
                    border-radius: 8px;
                    font-size: 1rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                  " onmouseover="this.style.background='#4b5563'" onmouseout="this.style.background='#6b7280'">
                    Continuar Sin Notificar
                  </button>
                `
                    : ""
                }
                
                <button onclick="this.parentElement.parentElement.parentElement.remove(); window.location.reload();" style="
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
                  ${crossWarehouseNeeds.length > 0 ? "Finalizar" : "Continuar"}
                </button>
              </div>
            </div>
          </div>
        `;
        document.body.appendChild(successModal);

        // AUTO-CREATE NOTIFICATIONS for items needing cross-warehouse fulfillment
        if (crossWarehouseNeeds.length > 0) {
          console.log(
            "🚀 DEBUG: Auto-creating notifications for cross-warehouse needs"
          );

          for (const item of crossWarehouseNeeds) {
            if (item.availableWarehouses.length > 0) {
              // Auto-select the first available warehouse and create notification
              const targetWarehouse = item.availableWarehouses[0];

              console.log("📧 DEBUG: Creating auto-notification for:", {
                item: item.itemName,
                quantity: item.requiredQuantity,
                targetWarehouse: targetWarehouse.warehouseName,
              });

              try {
                const notificationResult =
                  await createBranchNotificationFromPos(
                    item.itemId,
                    item.itemName,
                    item.requiredQuantity,
                    targetWarehouse.warehouseId,
                    cart.customer?.id,
                    "CUSTOMER_PICKUP", // Default delivery method
                    `Solicitud automática desde POS - Venta completada pero stock insuficiente localmente`
                  );

                console.log(
                  "✅ DEBUG: Auto-notification created:",
                  notificationResult
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

          (window as any).selectDeliveryMethod = (
            itemId: string,
            itemName: string,
            quantity: number,
            warehouseId: string,
            warehouseName: string
          ) => {
            console.log("🏭 DEBUG: Warehouse selected:", {
              itemId,
              itemName,
              quantity,
              warehouseId,
              warehouseName,
            });

            // Close the warehouse selection modal first
            const warehouseModal = document.querySelector(
              '[style*="z-index: 10001"]'
            );
            if (warehouseModal) {
              warehouseModal.remove();
            }

            // Create a direct notification for customer pickup (simplified flow)
            createBranchNotificationFromPos(
              itemId,
              itemName,
              quantity,
              warehouseId,
              cart.customer?.id,
              "CUSTOMER_PICKUP",
              `Solicitud desde POS - Cliente recogerá en ${warehouseName}`
            )
              .then(async (result) => {
                if (result.success && result.notificationId) {
                  console.log(
                    "✅ Notification created successfully:",
                    result.notificationId
                  );
                  // Show success confirmation
                  const confirmModal = document.createElement("div");
                  confirmModal.innerHTML = `
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
                    z-index: 10002;
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
                      ">Solicitud Confirmada</h3>
                      <p style="
                        font-size: 0.875rem;
                        color: #6b7280;
                        margin-bottom: 1.5rem;
                      ">Se ha notificado a <strong>${warehouseName}</strong> para preparar ${quantity} unidades de ${itemName}.</p>
                      <p style="
                        font-size: 0.875rem;
                        color: #f59e0b;
                        margin-bottom: 1.5rem;
                        background: #fef3c7;
                        padding: 0.75rem;
                        border-radius: 6px;
                      ">💡 El cliente debe recoger el producto en ${warehouseName} una vez confirmado.</p>
                      <button 
                        onclick="this.parentElement.parentElement.remove()"
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
                  document.body.appendChild(confirmModal);

                  console.log(
                    "✅ Notification created successfully:",
                    result.notificationId
                  );
                } else {
                  console.error(
                    "❌ Error creating notification:",
                    result.error
                  );
                  alert("Error al enviar notificación: " + result.error);
                }
              })
              .catch((error) => {
                console.error("❌ Error in notification creation:", error);
                alert("Error al procesar la solicitud");
              });
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
                console.log("🚀 DEBUG: createNotification called with:", {
                  itemId,
                  itemName,
                  quantity,
                  targetWarehouseId,
                  deliveryMethod,
                  customerId: cart.customer?.id,
                });

                const result = await createBranchNotificationFromPos(
                  itemId,
                  itemName,
                  quantity,
                  targetWarehouseId,
                  cart.customer?.id,
                  deliveryMethod as any,
                  `Solicitud desde POS para completar venta`
                );

                console.log(
                  "📧 DEBUG: createBranchNotificationFromPos result:",
                  result
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
                          onclick="this.parentElement.parentElement.remove()"
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
                  console.log(
                    "❌ DEBUG: Notification creation failed:",
                    result.error
                  );
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

  // Handle change modal confirmation
  const handleChangeConfirm = () => {
    setShowChangeModal(false);

    // Show success modal after change confirmation
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
          ">El cambio ha sido entregado correctamente.</p>
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
  };

  // Handle change modal close
  const handleChangeClose = () => {
    setShowChangeModal(false);
    // Maybe show a warning that the sale was completed but change wasn't confirmed?
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

      {/* Change Modal */}
      {changeBreakdown && (
        <ChangeModal
          isOpen={showChangeModal}
          changeAmount={changeAmount}
          changeBreakdown={changeBreakdown}
          onClose={handleChangeClose}
          onConfirm={handleChangeConfirm}
        />
      )}
    </div>
  );
}
