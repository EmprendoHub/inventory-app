"use client";

import React, { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Calculator, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CashBreakdown } from "@/types/pos";

interface CashCalculatorProps {
  totalAmount: number;
  onCashReceived: (amount: number, breakdown: CashBreakdown) => void;
  onClose: () => void;
}

export default function CashCalculator({
  totalAmount,
  onCashReceived,
  onClose,
}: CashCalculatorProps) {
  // Available denominations based on user requirements
  const billDenominations = [1000, 500, 200, 100, 50, 20];
  const coinDenominations = [10, 5, 1, 0.5];

  const [selectedDenominations, setSelectedDenominations] = useState<{
    [key: number]: number;
  }>({});

  const [manualAmount, setManualAmount] = useState("");

  // Calculate total received amount
  const calculateTotalReceived = useCallback(() => {
    const manualAmountValue = parseFloat(manualAmount) || 0;
    const denominationTotal = Object.entries(selectedDenominations).reduce(
      (sum, [denomination, count]) => sum + parseFloat(denomination) * count,
      0
    );
    return Math.max(manualAmountValue, denominationTotal);
  }, [manualAmount, selectedDenominations]);

  // Add denomination
  const addDenomination = useCallback((denomination: number) => {
    setSelectedDenominations((prev) => ({
      ...prev,
      [denomination]: (prev[denomination] || 0) + 1,
    }));
    // Clear manual amount when using denominations
    setManualAmount("");
  }, []);

  // Remove denomination
  const removeDenomination = useCallback((denomination: number) => {
    setSelectedDenominations((prev) => ({
      ...prev,
      [denomination]: Math.max(0, (prev[denomination] || 0) - 1),
    }));
  }, []);

  // Calculate change
  const totalReceived = calculateTotalReceived();
  const changeAmount = Math.max(0, totalReceived - totalAmount);

  // Handle confirm payment
  const handleConfirm = useCallback(() => {
    if (totalReceived >= totalAmount) {
      // Create a breakdown structure compatible with the existing type
      const breakdown: CashBreakdown = {
        bills: {
          thousands: {
            value: 1000,
            count: selectedDenominations[1000] || 0,
            total: (selectedDenominations[1000] || 0) * 1000,
          },
          fiveHundreds: {
            value: 500,
            count: selectedDenominations[500] || 0,
            total: (selectedDenominations[500] || 0) * 500,
          },
          hundreds: {
            value: 100,
            count: selectedDenominations[100] || 0,
            total: (selectedDenominations[100] || 0) * 100,
          },
          fifties: {
            value: 50,
            count: selectedDenominations[50] || 0,
            total: (selectedDenominations[50] || 0) * 50,
          },
          twenties: {
            value: 20,
            count: selectedDenominations[20] || 0,
            total: (selectedDenominations[20] || 0) * 20,
          },
          tens: { value: 10, count: 0, total: 0 }, // Not a bill in our system
          fives: { value: 5, count: 0, total: 0 }, // Not a bill in our system
          ones: { value: 1, count: 0, total: 0 }, // Not a bill in our system
        },
        coins: {
          peso20: { value: 20, count: 0, total: 0 }, // Not in our system
          peso10: {
            value: 10,
            count: selectedDenominations[10] || 0,
            total: (selectedDenominations[10] || 0) * 10,
          },
          peso5: {
            value: 5,
            count: selectedDenominations[5] || 0,
            total: (selectedDenominations[5] || 0) * 5,
          },
          peso2: { value: 2, count: 0, total: 0 }, // Not in our system
          peso1: {
            value: 1,
            count: selectedDenominations[1] || 0,
            total: (selectedDenominations[1] || 0) * 1,
          },
          centavos50: {
            value: 0.5,
            count: selectedDenominations[0.5] || 0,
            total: (selectedDenominations[0.5] || 0) * 0.5,
          },
          centavos20: { value: 0.2, count: 0, total: 0 }, // Not in our system
          centavos10: { value: 0.1, count: 0, total: 0 }, // Not in our system
        },
        totalCash: totalReceived,
      };

      // Log for debugging
      console.log("Confirming payment:", { totalReceived, breakdown });

      onCashReceived(totalReceived, breakdown);

      // Close the calculator after confirming payment
      onClose();
    }
  }, [
    totalReceived,
    totalAmount,
    selectedDenominations,
    onCashReceived,
    onClose,
  ]);

  const isValidPayment = totalReceived >= totalAmount;

  // Debug logging
  console.log("CashCalculator state:", {
    totalReceived,
    totalAmount,
    isValidPayment,
    selectedDenominations,
    manualAmount,
  });

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-4 bg-background rounded-lg shadow-2xl z-50 overflow-y-auto"
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Calculator className="w-8 h-8" />
              Denominaciones
            </h2>
          </div>
          <Button variant="outline" onClick={onClose} size="sm">
            <X className="w-5 h-5 mr-2" />
            Cancelar
          </Button>
        </div>

        <div className="space-y-3">
          {/* Quick Entry Section */}
          <Card>
            <CardContent className="space-y-3">
              {/* Bills Section */}
              <div>
                <div className="grid grid-cols-3 gap-3">
                  {billDenominations.map((denomination) => (
                    <div key={denomination} className="text-center">
                      <Button
                        variant="outline"
                        onClick={() => addDenomination(denomination)}
                        className="w-full text-lg py-4 h-auto mb-2"
                      >
                        ${denomination}
                      </Button>
                      {selectedDenominations[denomination] > 0 && (
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => removeDenomination(denomination)}
                            className="h-8 w-8 p-0"
                          >
                            -
                          </Button>
                          <span className="text-lg font-semibold min-w-[2rem]">
                            {selectedDenominations[denomination]}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => addDenomination(denomination)}
                            className="h-8 w-8 p-0"
                          >
                            +
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Coins Section */}
              <div>
                <div className="grid grid-cols-4 gap-3">
                  {coinDenominations.map((denomination) => (
                    <div key={denomination} className="text-center">
                      <Button
                        variant="outline"
                        onClick={() => addDenomination(denomination)}
                        className="w-full text-lg py-4 h-auto mb-2"
                      >
                        ${denomination === 0.5 ? "0.50" : denomination}
                      </Button>
                      {selectedDenominations[denomination] > 0 && (
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => removeDenomination(denomination)}
                            className="h-8 w-8 p-0"
                          >
                            -
                          </Button>
                          <span className="text-lg font-semibold min-w-[1.5rem]">
                            {selectedDenominations[denomination]}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => addDenomination(denomination)}
                            className="h-8 w-8 p-0"
                          >
                            +
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Amount Summary */}
              <div className="flex justify-between items-center gap-x-3 ">
                <div className="bg-card p-6 rounded-lg border-2 w-full">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg text-gray-600">
                        Total a Pagar:
                      </span>
                      <span className="text-2xl font-bold">
                        ${totalAmount.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-lg text-gray-600">
                        Efectivo Recibido:
                      </span>
                      <span className="text-2xl font-bold text-blue-600">
                        ${totalReceived.toFixed(2)}
                      </span>
                    </div>
                    <hr className="border-gray-300" />
                    <div className="flex justify-between items-center">
                      <span className="text-lg text-gray-600">Cambio:</span>
                      <span className="text-4xl font-bold text-green-600">
                        ${changeAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Confirm Button */}
                <div className="flex justify-center">
                  <Button
                    onClick={handleConfirm}
                    disabled={!isValidPayment}
                    size="lg"
                    className="px-12 py-12 text-2xl h-auto bg-emerald-600 hover:bg-emerald-700 text-white flex items-center font-bold"
                  >
                    Confirmar Pago
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
