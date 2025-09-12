"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { useRouter } from "next/navigation";
import "./qrstyles.scss";
import { useDebounce } from "use-debounce";
import { FaQrcode } from "react-icons/fa6";
import { BiBarcode } from "react-icons/bi";
import { MdSearch } from "react-icons/md";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Define type for scan result
type ScanResult = string | null;
type ScanMode = "qr" | "barcode" | "manual";

const QRScanIdComponent: React.FC = () => {
  const [scanResult, setScanResult] = useState<ScanResult>(null);
  const [scanMode, setScanMode] = useState<ScanMode>("qr");
  const [isScanning, setIsScanning] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const initialRender = useRef<boolean>(true);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [text, setText] = useState<string>("");
  const [query] = useDebounce<string>(text, 750);
  const router = useRouter();

  // Initialize scanner
  const initializeScanner = useCallback(() => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch(console.error);
    }

    const scanner = new Html5QrcodeScanner(
      "reader",
      {
        qrbox: {
          width: Math.min(400, window.innerWidth - 40),
          height: Math.min(400, window.innerWidth - 40),
        },
        fps: 10,
        rememberLastUsedCamera: true,
        aspectRatio: 1.0,
      },
      false
    );

    scannerRef.current = scanner;

    const success = (result: string) => {
      console.log("Scan successful:", result);
      setError("");
      setScanResult(result);
      setIsScanning(false);
      scanner.clear().catch(console.error);
    };

    const errorCallback = (err: string) => {
      // Don't log common scanning errors to avoid spam
      if (
        !err.includes("NotFoundException") &&
        !err.includes("No QR code found")
      ) {
        console.warn("Scan error:", err);
        setError("Error al escanear. Intente nuevamente.");
      }
    };

    scanner.render(success, errorCallback);
  }, []);

  useEffect(() => {
    if (isScanning) {
      initializeScanner();
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
    };
  }, [isScanning, initializeScanner]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Handle manual input processing
  const processInput = useCallback(
    (input: string) => {
      if (!input) return;

      // Extract ID from various formats (QR code, barcode, or direct input)
      const id_part = input.split(/[-']/)[0];
      console.log("Processing ID:", id_part);

      // Navigate to the product detail or scanner result page
      router.push(`/sistema/negocio/articulos/${id_part}`);
    },
    [router]
  );

  useEffect(() => {
    if (initialRender.current) {
      initialRender.current = false;
      return;
    }

    if (scanResult) {
      processInput(scanResult);
    }

    if (query && query.trim()) {
      processInput(query);
    }
  }, [scanResult, query, processInput]);

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      {/* Header */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FaQrcode className="h-6 w-6" />
            Identificador de Artículos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Scan Mode Toggle */}
          <div className="flex gap-2 mb-4">
            <Button
              variant={scanMode === "qr" ? "default" : "outline"}
              onClick={() => setScanMode("qr")}
              className="flex items-center gap-2"
            >
              <FaQrcode />
              QR Code
            </Button>
            <Button
              variant={scanMode === "barcode" ? "default" : "outline"}
              onClick={() => setScanMode("barcode")}
              className="flex items-center gap-2"
            >
              <BiBarcode />
              Código de Barras
            </Button>
            <Button
              variant={scanMode === "manual" ? "default" : "outline"}
              onClick={() => setScanMode("manual")}
              className="flex items-center gap-2"
            >
              <MdSearch />
              Entrada Manual
            </Button>
          </div>

          {/* Manual Input */}
          <div className="relative mb-4">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <FaQrcode className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
              ref={inputRef}
              value={text}
              placeholder="Escanee o ingrese código de producto..."
              onChange={(e) => setText(e.target.value)}
              className="block w-full rounded-md border-0 py-3 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-sky-600 sm:text-sm sm:leading-6"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 mb-4">
            <Button
              onClick={() => {
                setIsScanning(true);
                setScanResult(null);
                setError("");
              }}
              disabled={isScanning}
              variant="outline"
            >
              {isScanning ? "Escaneando..." : "Reiniciar Escáner"}
            </Button>
            <Button
              onClick={() => {
                setIsScanning(false);
                setScanResult(null);
              }}
              disabled={!isScanning}
              variant="outline"
            >
              Detener Escáner
            </Button>
          </div>

          {/* Error Display */}
          {error && (
            <Alert className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Scanner Area */}
      <Card>
        <CardContent className="p-6">
          {scanResult ? (
            <div className="text-center">
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-2">
                  Código Detectado
                </h3>
                <p className="text-green-700 font-mono text-lg">{scanResult}</p>
              </div>
              <Button
                onClick={() => scanResult && processInput(scanResult)}
                className="w-full"
              >
                Ver Artículo
              </Button>
            </div>
          ) : isScanning ? (
            <div className="flex flex-col items-center">
              <div
                id="reader"
                className="w-full max-w-[500px] min-h-[400px] mx-auto rounded-lg overflow-hidden"
              />
              <p className="mt-4 text-sm text-gray-600 text-center">
                {scanMode === "qr"
                  ? "Apunte la cámara hacia un código QR"
                  : "Apunte la cámara hacia un código de barras"}
              </p>
            </div>
          ) : (
            <div className="text-center py-12">
              <FaQrcode className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <p className="text-gray-600">Escáner detenido</p>
              <p className="text-sm text-gray-500 mt-2">
                Use el botón &quot;Reiniciar Escáner&quot; o ingrese el código
                manualmente
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default QRScanIdComponent;
