"use client";
import Image from "next/image";
import React, { useCallback, useEffect, useRef, useState } from "react";
import qrcode from "qrcode";
import JsBarcode from "jsbarcode";
import { useReactToPrint } from "react-to-print";
import { useRouter } from "next/navigation";
import { FaPrint, FaQrcode, FaTrash } from "react-icons/fa6";
import { BiBarcode } from "react-icons/bi";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import "./qrstyles.scss";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CodeImage {
  id: string;
  code: string; // Can be QR code or barcode image
  title: string;
  sku: string;
  barcode?: string;
  price: number;
  stock: number;
}

type CodeType = "qr" | "barcode";

const QRGenerator = ({ products }: { products: any[] }) => {
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const [images, setImages] = useState<CodeImage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [codeType, setCodeType] = useState<CodeType>("qr");
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [printMode, setPrintMode] = useState<"sheet" | "sticker">("sticker");

  // Load selected products from sessionStorage on component mount
  useEffect(() => {
    const selectedIds = sessionStorage.getItem("selectedProductIds");
    if (selectedIds) {
      try {
        const parsedIds = JSON.parse(selectedIds);
        setSelectedProducts(parsedIds);
        // Clear the sessionStorage after loading
        sessionStorage.removeItem("selectedProductIds");
      } catch (error) {
        console.error("Error parsing selected product IDs:", error);
      }
    }
  }, []);
  // Generate QR code - sized for 3cm x 4cm print
  const generateQRCode = async (text: string): Promise<string> => {
    try {
      return await qrcode.toDataURL(text, {
        width: 283, // 3cm at 300 DPI (3 * 94.5 ≈ 283px)
        margin: 1,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      });
    } catch (error) {
      console.error("Error generating QR code:", error);
      return "";
    }
  };

  // Generate barcode - sized for 3cm x 4cm print
  const generateBarcode = (text: string): string => {
    try {
      const canvas = document.createElement("canvas");
      JsBarcode(canvas, text, {
        format: "CODE128",
        width: 1.5,
        height: 100, // Adjusted height for 4cm container
        displayValue: false,
        fontSize: 12,
      });
      return canvas.toDataURL();
    } catch (error) {
      console.error("Error generating barcode:", error);
      return "";
    }
  };

  // Generate codes based on selected type
  const generateCodes = useCallback(async () => {
    setIsGenerating(true);
    setImages([]);

    // Only process selected products, if no products selected, don't generate any
    const productsToProcess =
      selectedProducts.length > 0
        ? products.filter((product) => selectedProducts.includes(product.id))
        : [];

    const newImages: CodeImage[] = [];

    for (const product of productsToProcess) {
      if (product.totalAvailableStock > 0) {
        // Generate multiple codes based on stock quantity
        for (let i = 0; i < Math.min(product.totalAvailableStock, 50); i++) {
          // Limit to 50 per product
          let codeImage = "";

          if (codeType === "qr") {
            const qrText = `${product.id}-${product.name}-${formatCurrency({
              amount: product.price,
              currency: "MXN",
            })}`;
            codeImage = await generateQRCode(qrText);
          } else {
            // Use barcode if available, otherwise use SKU or ID
            const barcodeText = product.barcode || product.sku || product.id;
            codeImage = generateBarcode(barcodeText);
          }

          if (codeImage) {
            newImages.push({
              id: `${product.id}-${i}`,
              code: codeImage,
              title: product.name,
              sku: product.sku || "",
              barcode: product.barcode || "",
              price: product.price,
              stock: product.totalAvailableStock,
            });
          }
        }
      }
    }

    setImages(newImages);
    setIsGenerating(false);
  }, [codeType, products, selectedProducts]);

  // Print handler with specific settings based on print mode
  const handlePrint = useReactToPrint({
    contentRef: ref,
    pageStyle:
      printMode === "sticker"
        ? `
      @page {
        size: 4cm 3cm;
        margin: 0;
      }
      @media print {
        body {
          margin: 0 !important;
          padding: 0 !important;
        }
        .code-container {
          width: 4cm !important;
          height: 3cm !important;
          break-after: page !important;
          page-break-after: always !important;
          margin: 0 !important;
          padding: 0.05cm !important;
          box-sizing: border-box !important;
          display: flex !important;
          flex-direction: column !important;
          justify-content: space-between !important;
        }
        .code-container img {
          max-width: 3.8cm !important;
          max-height: 1.5cm !important;
          flex-shrink: 0 !important;
        }
        .code-container .text-center {
          flex-grow: 1 !important;
          min-height: 1cm !important;
          display: flex !important;
          flex-direction: column !important;
          justify-content: center !important;
        }
        .print-layout {
          display: block !important;
        }
      }
    `
        : `
      @page {
        size: A4;
        margin: 1cm;
      }
      @media print {
        .code-container {
          width: 4cm !important;
          height: 3cm !important;
          break-inside: avoid !important;
          margin: 0.0cm !important;
          padding: 0.0cm !important;
          border: 1px solid #ddd !important;
        }
        .print-layout {
          display: grid !important;
          grid-template-columns: repeat(5, 1fr) !important;
          gap: 0.2cm !important;
        }
      }
    `,
  });

  useEffect(() => {
    generateCodes();
  }, [generateCodes]);

  return (
    <div className="container mx-auto p-4">
      {/* Header and Controls */}
      <Card className="mb-6 print:hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {codeType === "qr" ? <FaQrcode /> : <BiBarcode />}
            Generador de{" "}
            {codeType === "qr" ? "Códigos QR" : "Códigos de Barras"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Selection Status */}
          {selectedProducts.length > 0 && (
            <div className="bg-card border-blue-200 rounded-lg p-3">
              <div className="flex justify-between items-center">
                <p className="text-sm text-blue-800">
                  <strong>{selectedProducts.length}</strong> productos
                  seleccionados para generar códigos
                </p>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    sessionStorage.removeItem("selectedProductIds");
                    setSelectedProducts([]);
                  }}
                  className="flex items-center gap-1"
                >
                  <FaTrash size={12} />
                  Limpiar Selección
                </Button>
              </div>
            </div>
          )}

          {/* Code Type Selection */}
          {/* Code Type Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">
                Tipo de Código:
              </label>
              <Select
                value={codeType}
                onValueChange={(value: CodeType) => setCodeType(value)}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="qr">
                    <div className="flex items-center gap-2">
                      <FaQrcode />
                      Código QR
                    </div>
                  </SelectItem>
                  <SelectItem value="barcode">
                    <div className="flex items-center gap-2">
                      <BiBarcode />
                      Código de Barras
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">
                Modo de Impresión:
              </label>
              <Select
                value={printMode}
                onValueChange={(value: "sheet" | "sticker") =>
                  setPrintMode(value)
                }
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sticker">
                    <div className="flex items-center gap-2">
                      <FaPrint />
                      Etiquetas 4x3cm
                    </div>
                  </SelectItem>
                  <SelectItem value="sheet">
                    <div className="flex items-center gap-2">
                      <FaPrint />
                      Hoja A4
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button
              onClick={generateCodes}
              disabled={isGenerating || selectedProducts.length === 0}
              className="flex items-center gap-2"
            >
              {codeType === "qr" ? <FaQrcode /> : <BiBarcode />}
              {isGenerating
                ? "Generando..."
                : selectedProducts.length === 0
                ? "Selecciona productos primero"
                : `Generar ${codeType === "qr" ? "QR" : "Códigos de Barras"}`}
            </Button>

            <Button
              onClick={handlePrint}
              disabled={isGenerating || images.length === 0}
              className="flex items-center gap-2"
              variant="outline"
            >
              <FaPrint />
              {isGenerating
                ? "Generando..."
                : `Imprimir ${images.length} códigos ${
                    printMode === "sticker" ? "(Etiquetas 4x3cm)" : "(Hoja A4)"
                  }`}
            </Button>

            <Button
              onClick={() => router.push("/sistema/qr/productos")}
              variant="secondary"
              className="flex items-center gap-2"
            >
              Seleccionar Productos
            </Button>

            <Button
              onClick={() => {
                sessionStorage.removeItem("selectedProductIds");
                setSelectedProducts([]);
                setImages([]);
                router.push("/sistema/qr/productos");
              }}
              variant="outline"
              className="flex items-center gap-2 text-red-600 border-red-300 hover:bg-red-50"
            >
              <FaTrash />
              Limpiar y Volver a Selección
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Printable Content */}
      <div ref={ref} className="w-full">
        <div className="print:block">
          <h1 className="hidden print:block text-center text-lg font-bold mb-4">
            {codeType === "qr" ? "Códigos QR" : "Códigos de Barras"} -{" "}
            {new Date().toLocaleDateString()}
          </h1>

          <div
            className={`grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4 print-layout ${
              printMode === "sticker"
                ? "print:block print:gap-0"
                : "print:grid print:grid-cols-5 print:gap-1"
            }`}
          >
            {images.map((item, index) => (
              <div
                key={index}
                className="flex flex-col items-center justify-between border print:border-0 p-2 print:p-1 code-container"
              >
                <Image
                  src={item.code}
                  alt={`${codeType} code`}
                  width={codeType === "qr" ? 80 : 100}
                  height={codeType === "qr" ? 80 : 40}
                  className="mx-auto print:w-[3.8cm] print:h-auto print:max-h-[1.5cm] object-contain"
                />
                <div className="text-center mt-1 print:mt-0 flex-grow flex flex-col justify-center">
                  <p
                    className="text-xs font-medium truncate w-full print:text-[6px] print:leading-tight"
                    title={item.title}
                  >
                    {item.title.length > 12
                      ? `${item.title.substring(0, 12)}...`
                      : item.title}
                  </p>
                  <p className="text-xs text-gray-600 print:text-[6px] print:text-black print:leading-tight">
                    {formatCurrency({ amount: item.price, currency: "MXN" })}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {images.length === 0 && !isGenerating && (
            <div className="text-center py-8 text-gray-500">
              <div className="flex flex-col items-center gap-3">
                <FaQrcode size={48} className="text-gray-300" />
                {selectedProducts.length === 0 ? (
                  <div>
                    <p className="text-lg font-medium">
                      No hay productos seleccionados
                    </p>
                    <p className="text-sm">
                      Selecciona productos desde la página de productos para
                      generar códigos
                    </p>
                  </div>
                ) : (
                  <p>
                    No hay productos con stock disponible para generar códigos
                  </p>
                )}
              </div>
            </div>
          )}

          {isGenerating && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2 text-gray-600">Generando códigos...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QRGenerator;
