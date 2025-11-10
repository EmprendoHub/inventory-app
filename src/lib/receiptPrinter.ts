/**
 * Utility functions for printing receipts
 * Used by both POS and Orders pages to maintain consistent receipt formatting
 */

export interface ReceiptData {
  orderNumber: string;
  date: string;
  customer: string;
  items: {
    name: string;
    quantity: number;
    price: number;
  }[];
  subtotal: number;
  tax: number;
  discount: number;
  tip?: number;
  total: number;
  paymentType?: string;
  cashReceived?: number;
  changeAmount?: number;
  referenceNumber?: string;
  paymentMethod?: string;
}

/**
 * Prints a receipt to an 80mm thermal printer
 * @param receiptData - The receipt data to print
 */
export function printReceipt(receiptData: ReceiptData): void {
  try {
    // Create a hidden div with the receipt content
    const receiptHtml = `
      <div id="receipt-print" style="
        position: absolute;
        left: -9999px;
        width: 302px;
        font-family: Arial, sans-serif;
        font-size: 12px;
        line-height: 1.4;
        color: black;
        background: white;
        padding: 10px;
        box-sizing: border-box;
      ">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="margin: 0; font-size: 16px; font-weight: bold;">RECIBO DE VENTA</h2>
          <p style="margin: 5px 0;">Orden: ${receiptData.orderNumber}</p>
          <p style="margin: 5px 0;">Fecha: ${receiptData.date}</p>
          <p style="margin: 5px 0;">Cliente: ${receiptData.customer}</p>
        </div>
        
        <div style="margin-bottom: 15px;">
          ${receiptData.items
            .map(
              (item) => `
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
              <span>${item.name} x ${item.quantity}</span>
              <span>$${(item.price * item.quantity).toFixed(2)}</span>
            </div>
          `
            )
            .join("")}
        </div>
        
        <div style="border-top: 2px solid black; padding-top: 10px; font-weight: bold;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <span>Subtotal:</span>
            <span>$${receiptData.subtotal.toFixed(2)}</span>
          </div>
          ${
            receiptData.tax > 0
              ? `
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <span>IVA (16%):</span>
            <span>$${receiptData.tax.toFixed(2)}</span>
          </div>
          `
              : ""
          }
          ${
            receiptData.discount > 0
              ? `
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <span>Descuento:</span>
            <span>-$${receiptData.discount.toFixed(2)}</span>
          </div>
          `
              : ""
          }
          ${
            receiptData.tip && receiptData.tip > 0
              ? `
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <span>Propina:</span>
            <span>$${receiptData.tip.toFixed(2)}</span>
          </div>
          `
              : ""
          }
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 14px;">
            <span><strong>TOTAL:</strong></span>
            <span><strong>$${receiptData.total.toFixed(2)}</strong></span>
          </div>
          ${
            receiptData.paymentType === "CASH" && receiptData.cashReceived
              ? `
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <span>Efectivo recibido:</span>
            <span>$${receiptData.cashReceived.toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <span>Cambio:</span>
            <span>$${receiptData.changeAmount?.toFixed(2) || "0.00"}</span>
          </div>
          `
              : ""
          }
          ${
            receiptData.paymentMethod &&
            (receiptData.paymentMethod === "CARD" ||
              receiptData.paymentMethod === "TRANSFER")
              ? `
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <span>Método de pago:</span>
            <span>${
              receiptData.paymentMethod === "CARD" ? "Tarjeta" : "Transferencia"
            }</span>
          </div>
          ${
            receiptData.referenceNumber
              ? `
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <span>Referencia:</span>
            <span>${receiptData.referenceNumber}</span>
          </div>
          `
              : ""
          }
          `
              : ""
          }
        </div>
        
        <div style="text-align: center; margin-top: 20px;">
          <p style="margin: 0;">¡Gracias por su compra!</p>
        </div>
      </div>
    `;

    // Remove any existing receipt div
    const existingReceipt = document.getElementById("receipt-print");
    if (existingReceipt) {
      existingReceipt.remove();
    }

    // Add the receipt HTML to the page
    document.body.insertAdjacentHTML("beforeend", receiptHtml);

    // Create print styles for the receipt
    const printStyle = document.createElement("style");
    printStyle.innerHTML = `
      @media print {
        body > *:not(#receipt-print) {
          display: none !important;
        }
        
        body {
          margin: 0 !important;
          padding: 0 !important;
          background: white !important;
        }
        
        #receipt-print {
          display: block !important;
          position: static !important;
          left: auto !important;
          width: 100% !important;
          max-width: 302px !important;
          margin: 0 auto !important;
          padding: 10px !important;
          background: white !important;
          color: black !important;
          font-family: Arial, sans-serif !important;
          font-size: 12px !important;
          line-height: 1.4 !important;
        }
        
        @page {
          size: 80mm auto;
          margin: 3mm;
        }
      }
    `;
    document.head.appendChild(printStyle);

    // Print immediately
    window.print();

    // Clean up after printing
    setTimeout(() => {
      const receiptDiv = document.getElementById("receipt-print");
      if (receiptDiv) {
        receiptDiv.remove();
      }
      if (printStyle && printStyle.parentNode) {
        printStyle.parentNode.removeChild(printStyle);
      }
    }, 1000);
  } catch (error) {
    console.error("Error printing receipt:", error);
    // Simple fallback - just trigger browser print
    window.print();
  }
}
