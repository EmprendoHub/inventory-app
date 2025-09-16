"use client";

import React from "react";
import { motion } from "framer-motion";
import { X, Banknote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CashBreakdown } from "@/types/pos";
import { formatChangeBreakdown } from "@/lib/changeCalculation";

interface ChangeModalProps {
  isOpen: boolean;
  changeAmount: number;
  changeBreakdown: CashBreakdown;
  onClose: () => void;
  onConfirm: () => void;
}

export default function ChangeModal({
  isOpen,
  changeAmount,
  changeBreakdown,
  onClose,
  onConfirm,
}: ChangeModalProps) {
  if (!isOpen) return null;

  return (
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
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2 text-green-700">
            <Banknote className="w-6 h-6" />
            Cambio a Entregar
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Change Amount */}
        <div className="text-center mb-6">
          <div className="text-3xl font-bold text-green-600 mb-2">
            ${changeAmount.toFixed(2)}
          </div>
          <p className="">Total de cambio a entregar</p>
        </div>

        {/* Change Breakdown */}
        <div className="bg-card rounded-lg p-4 mb-6">
          <h3 className="text-sm font-semibold mb-3 text-green-800">
            Desglose de Denominaciones:
          </h3>

          {/* Bills */}
          <div className="space-y-2 mb-4">
            <h4 className="text-xs font-medium text-gray-600">Billetes:</h4>
            {Object.entries(changeBreakdown.bills)
              .filter(([, denom]) => denom.count > 0)
              .map(([key, denom]) => (
                <div key={key} className="flex justify-between text-sm">
                  <span>
                    {denom.count}x ${denom.value}
                  </span>
                  <span className="font-medium">${denom.total.toFixed(2)}</span>
                </div>
              ))}
          </div>

          {/* Coins */}
          {Object.values(changeBreakdown.coins).some(
            (coin) => coin.count > 0
          ) && (
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-gray-600">Monedas:</h4>
              {Object.entries(changeBreakdown.coins)
                .filter(([, denom]) => denom.count > 0)
                .map(([key, denom]) => (
                  <div key={key} className="flex justify-between text-sm">
                    <span>
                      {denom.count}x $
                      {denom.value < 1 ? denom.value.toFixed(2) : denom.value}
                    </span>
                    <span className="font-medium">
                      ${denom.total.toFixed(2)}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="text-center text-sm text-gray-600 mb-6">
          {formatChangeBreakdown(changeBreakdown)}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button
            onClick={onConfirm}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
          >
            Entregar Cambio
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
