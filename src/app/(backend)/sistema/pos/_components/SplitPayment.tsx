"use client";

import React, { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CreditCard,
  Banknote,
  UserCircle,
  Plus,
  Trash2,
  Check,
  X,
  Calculator,
  Heart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PaymentType, PaymentSplit } from "@/types/pos";

interface SplitPaymentProps {
  isOpen: boolean;
  onClose: () => void;
  totalAmount: number;
  onConfirmPayment: (payments: PaymentSplit[], tipAmount?: number) => void;
}

export default function SplitPayment({
  isOpen,
  onClose,
  totalAmount,
  onConfirmPayment,
}: SplitPaymentProps) {
  const [payments, setPayments] = useState<PaymentSplit[]>([]);
  const [tipAmount, setTipAmount] = useState(0);
  const [showTipOptions, setShowTipOptions] = useState(false);
  const [newPayment, setNewPayment] = useState<Partial<PaymentSplit>>({
    type: PaymentType.CASH,
    amount: 0,
  });

  const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const remainingAmount = totalAmount + tipAmount - totalPaid;
  const isComplete = remainingAmount <= 0;

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setPayments([]);
      setTipAmount(0);
      setShowTipOptions(false);
      setNewPayment({
        type: PaymentType.CASH,
        amount: 0,
      });
    }
  }, [isOpen]);

  // Auto-calculate remaining amount for new payment
  useEffect(() => {
    if (remainingAmount > 0) {
      setNewPayment((prev) => ({
        ...prev,
        amount: remainingAmount,
      }));
    }
  }, [remainingAmount]);

  const addPayment = useCallback(() => {
    if (!newPayment.amount || newPayment.amount <= 0) return;

    const payment: PaymentSplit = {
      id: Date.now().toString(),
      type: newPayment.type || PaymentType.CASH,
      amount: newPayment.amount,
      reference: newPayment.reference,
    };

    setPayments((prev) => [...prev, payment]);
    setNewPayment({
      type: PaymentType.CASH,
      amount: 0,
    });
  }, [newPayment]);

  const removePayment = useCallback((id: string) => {
    setPayments((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const addTip = useCallback(
    (percentage: number) => {
      const tip = Math.round(totalAmount * (percentage / 100) * 100) / 100;
      setTipAmount(tip);
      setShowTipOptions(false);
    },
    [totalAmount]
  );

  const handleConfirm = useCallback(() => {
    if (!isComplete) return;

    onConfirmPayment(payments, tipAmount > 0 ? tipAmount : undefined);
    onClose();
  }, [isComplete, payments, tipAmount, onConfirmPayment, onClose]);

  const paymentIcons: Record<string, React.ElementType> = {
    [PaymentType.CASH]: Banknote,
    [PaymentType.CARD]: CreditCard,
    [PaymentType.ACCOUNT]: UserCircle,
  };

  const paymentColors: Record<string, string> = {
    [PaymentType.CASH]: "bg-green-500",
    [PaymentType.CARD]: "bg-blue-500",
    [PaymentType.ACCOUNT]: "bg-purple-500",
  };

  const tipPercentages = [10, 15, 18, 20];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl">División de Pago</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="text-2xl font-bold">
                      ${totalAmount.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Propina</p>
                    <p className="text-2xl font-bold text-orange-600">
                      ${tipAmount.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                      {remainingAmount > 0 ? "Restante" : "Total a Pagar"}
                    </p>
                    <p
                      className={`text-2xl font-bold ${
                        remainingAmount > 0 ? "text-red-600" : "text-green-600"
                      }`}
                    >
                      ${Math.abs(remainingAmount).toFixed(2)}
                    </p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6 max-h-[60vh] overflow-y-auto">
                {/* Tip Section */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold flex items-center gap-2">
                        <Heart className="h-5 w-5 text-red-500" />
                        Propina
                      </h3>
                      <Button
                        variant={showTipOptions ? "default" : "outline"}
                        size="sm"
                        onClick={() => setShowTipOptions(!showTipOptions)}
                      >
                        <Calculator className="h-4 w-4 mr-2" />
                        {tipAmount > 0 ? `$${tipAmount.toFixed(2)}` : "Agregar"}
                      </Button>
                    </div>

                    <AnimatePresence>
                      {showTipOptions && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="grid grid-cols-4 gap-2 mb-4"
                        >
                          {tipPercentages.map((percentage) => (
                            <Button
                              key={percentage}
                              variant="outline"
                              onClick={() => addTip(percentage)}
                              className="h-12"
                            >
                              {percentage}%
                              <br />
                              <span className="text-xs">
                                ${((totalAmount * percentage) / 100).toFixed(2)}
                              </span>
                            </Button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="Propina personalizada"
                        value={tipAmount || ""}
                        onChange={(e) =>
                          setTipAmount(Number(e.target.value) || 0)
                        }
                        className="flex-1"
                        min="0"
                        step="0.01"
                      />
                      <Button
                        variant="outline"
                        onClick={() => setTipAmount(0)}
                        disabled={tipAmount === 0}
                      >
                        Limpiar
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Payment Methods */}
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-4">Agregar Pago</h3>

                    <div className="grid grid-cols-3 gap-4 mb-4">
                      {(
                        Object.keys(paymentIcons) as Array<
                          keyof typeof paymentIcons
                        >
                      ).map((type) => {
                        const Icon = paymentIcons[type];
                        const isSelected = newPayment.type === type;

                        return (
                          <Button
                            key={type}
                            variant={isSelected ? "default" : "outline"}
                            className={`h-16 flex-col gap-2 ${
                              isSelected ? paymentColors[type] : ""
                            }`}
                            onClick={() =>
                              setNewPayment((prev) => ({
                                ...prev,
                                type: type as PaymentType,
                              }))
                            }
                          >
                            <Icon className="h-6 w-6" />
                            <span className="text-xs">
                              {type === PaymentType.CASH && "Efectivo"}
                              {type === PaymentType.CARD && "Tarjeta"}
                              {type === PaymentType.ACCOUNT && "Cuenta"}
                            </span>
                          </Button>
                        );
                      })}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        type="number"
                        placeholder="Monto"
                        value={newPayment.amount || ""}
                        onChange={(e) =>
                          setNewPayment((prev) => ({
                            ...prev,
                            amount: Number(e.target.value) || 0,
                          }))
                        }
                        min="0"
                        step="0.01"
                      />

                      {newPayment.type !== PaymentType.CASH && (
                        <Input
                          type="text"
                          placeholder="Referencia (opcional)"
                          value={newPayment.reference || ""}
                          onChange={(e) =>
                            setNewPayment((prev) => ({
                              ...prev,
                              reference: e.target.value,
                            }))
                          }
                        />
                      )}

                      <Button
                        onClick={addPayment}
                        disabled={!newPayment.amount || newPayment.amount <= 0}
                        className="md:col-span-2"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Agregar Pago
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Payment List */}
                {payments.length > 0 && (
                  <Card>
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-4">Pagos Agregados</h3>

                      <div className="space-y-3">
                        {payments.map((payment) => {
                          const Icon =
                            paymentIcons[
                              payment.type as keyof typeof paymentIcons
                            ] ?? Banknote;

                          return (
                            <div
                              key={payment.id}
                              className="flex items-center justify-between p-3 rounded-lg border bg-card"
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className={`p-2 rounded-full ${
                                    paymentColors[payment.type] ?? "bg-gray-400"
                                  }`}
                                >
                                  <Icon className="h-4 w-4 text-white" />
                                </div>

                                <div>
                                  <p className="font-medium">
                                    {payment.type === PaymentType.CASH &&
                                      "Efectivo"}
                                    {payment.type === PaymentType.CARD &&
                                      "Tarjeta"}
                                    {payment.type === PaymentType.ACCOUNT &&
                                      "Cuenta"}
                                  </p>
                                  {payment.reference && (
                                    <p className="text-sm text-muted-foreground">
                                      Ref: {payment.reference}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <Badge
                                  variant="secondary"
                                  className="text-lg font-semibold"
                                >
                                  ${payment.amount.toFixed(2)}
                                </Badge>

                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removePayment(payment.id)}
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="mt-4 pt-4 border-t">
                        <div className="flex justify-between items-center text-lg font-semibold">
                          <span>Total Pagado:</span>
                          <span>${totalPaid.toFixed(2)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>

              {/* Footer Actions */}
              <div className="p-6 border-t bg-muted/20">
                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    onClick={onClose}
                    className="flex-1"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>

                  <Button
                    onClick={handleConfirm}
                    disabled={!isComplete}
                    className={`flex-1 ${
                      isComplete ? "bg-green-600 hover:bg-green-700" : ""
                    }`}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Confirmar Pago
                    {isComplete && (
                      <Badge variant="secondary" className="ml-2">
                        ${(totalAmount + tipAmount).toFixed(2)}
                      </Badge>
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
