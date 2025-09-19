"use client";

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Tag,
  Percent,
  DollarSign,
  Plus,
  Minus,
  X,
  // Search,
  // Check,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
// import { Badge } from "@/components/ui/badge";
import { Discount, DiscountTypeEnum, CartItemType } from "@/types/pos";

interface DiscountSystemProps {
  isOpen: boolean;
  onClose: () => void;
  discounts: Discount[];
  cartItems: CartItemType[];
  onApplyDiscount: (
    type: "item" | "order",
    discount:
      | Discount
      | { type: DiscountTypeEnum; value: number; name: string },
    itemId?: string
  ) => void;
}

export default function DiscountSystem({
  isOpen,
  onClose,
  // discounts,
  cartItems,
  onApplyDiscount,
}: DiscountSystemProps) {
  const [activeTab, setActiveTab] = useState<"predefined" | "manual">(
    "predefined"
  );
  // const [searchTerm, setSearchTerm] = useState("");
  // const [discountCode, setDiscountCode] = useState("");
  const [manualDiscount, setManualDiscount] = useState({
    type: DiscountTypeEnum.PERCENTAGE,
    value: 0,
    applyTo: "order" as "item" | "order",
    selectedItemId: "",
  });
  const [error, setError] = useState("");

  // Filter predefined discounts
  // const filteredDiscounts = React.useMemo(() => {
  //   return discounts.filter(
  //     (discount) =>
  //       discount.isActive &&
  //       (discount.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //         (discount.code &&
  //           discount.code.toLowerCase().includes(searchTerm.toLowerCase())))
  //   );
  // }, [discounts, searchTerm]);

  // Handle code lookup
  // const handleCodeLookup = useCallback(() => {
  //   const discount = discounts.find(
  //     (d) =>
  //       d.code &&
  //       d.code.toLowerCase() === discountCode.toLowerCase() &&
  //       d.isActive
  //   );

  //   if (discount) {
  //     onApplyDiscount("order", discount);
  //     setDiscountCode("");
  //     setError("");
  //     onClose();
  //   } else {
  //     setError("Invalid or expired discount code");
  //   }
  // }, [discountCode, discounts, onApplyDiscount, onClose]);

  // Handle manual discount application
  const handleManualDiscount = useCallback(() => {
    if (manualDiscount.value <= 0) {
      setError("El valor del descuento debe ser mayor que 0");
      return;
    }

    if (
      manualDiscount.type === DiscountTypeEnum.PERCENTAGE &&
      manualDiscount.value > 100
    ) {
      setError("El porcentaje de descuento no puede ser mayor al 100%");
      return;
    }

    const discount = {
      type: manualDiscount.type,
      value: manualDiscount.value,
      name: `Manual ${
        manualDiscount.type === DiscountTypeEnum.PERCENTAGE
          ? "Percentage"
          : "Fixed"
      } Discount`,
    };

    onApplyDiscount(
      manualDiscount.applyTo,
      discount,
      manualDiscount.applyTo === "item"
        ? manualDiscount.selectedItemId
        : undefined
    );

    setError("");
    setManualDiscount({
      type: DiscountTypeEnum.PERCENTAGE,
      value: 0,
      applyTo: "order",
      selectedItemId: "",
    });
    onClose();
  }, [manualDiscount, onApplyDiscount, onClose]);

  // Quick discount buttons
  const quickDiscounts = [
    { name: "0%", type: DiscountTypeEnum.PERCENTAGE, value: 0 },
    { name: "5%", type: DiscountTypeEnum.PERCENTAGE, value: 5 },
    { name: "10%", type: DiscountTypeEnum.PERCENTAGE, value: 10 },
    { name: "15%", type: DiscountTypeEnum.PERCENTAGE, value: 15 },
    { name: "20%", type: DiscountTypeEnum.PERCENTAGE, value: 20 },
    { name: "25%", type: DiscountTypeEnum.PERCENTAGE, value: 25 },
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
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
          className="bg-background rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b">
            <div className="flex items-center gap-2">
              <Tag className="w-5 h-5 text-green-600" />
              <h2 className="text-xl font-semibold">Aplicar Descuento</h2>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="px-6 pt-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span className="text-red-700 text-sm">{error}</span>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex border-b">
            <Button
              variant={activeTab === "predefined" ? "default" : "ghost"}
              className="flex-1 rounded-none text-white"
              onClick={() => setActiveTab("predefined")}
            >
              Descuentos Predefinidos
            </Button>
            <Button
              variant={activeTab === "manual" ? "default" : "ghost"}
              className="flex-1 rounded-none text-white"
              onClick={() => setActiveTab("manual")}
            >
              Descuento Manual
            </Button>
          </div>

          <div className="p-3 space-y-6 max-h-96 overflow-y-auto">
            {/* Predefined Discounts Tab */}
            {activeTab === "predefined" && (
              <div className="space-y-4">
                {/* Code Lookup */}
                {/* <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Discount Code</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter discount code..."
                        value={discountCode}
                        onChange={(e) => {
                          setDiscountCode(e.target.value.toUpperCase());
                          setError("");
                        }}
                        onKeyPress={(e) =>
                          e.key === "Enter" && handleCodeLookup()
                        }
                      />
                      <Button
                        onClick={handleCodeLookup}
                        disabled={!discountCode.trim()}
                      >
                        Apply
                      </Button>
                    </div>
                  </CardContent>
                </Card> */}

                {/* Quick Discounts */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Descuentos Rápido</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-2">
                      {quickDiscounts.map((discount, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          onClick={() => onApplyDiscount("order", discount)}
                          className="text-xl py-10"
                        >
                          {discount.name}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Search Predefined */}
                {/* <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Explorar Descuentos</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Search discounts..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>

                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {filteredDiscounts.map((discount) => (
                        <div
                          key={discount.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                          onClick={() => onApplyDiscount("order", discount)}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-sm">
                                {discount.name}
                              </h4>
                              {discount.code && (
                                <Badge variant="outline" className="text-xs">
                                  {discount.code}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              {discount.type === DiscountTypeEnum.PERCENTAGE ? (
                                <div className="flex items-center gap-1 text-green-600">
                                  <Percent className="w-3 h-3" />
                                  <span className="text-sm font-semibold">
                                    {discount.value}% Off
                                  </span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 text-green-600">
                                  <DollarSign className="w-3 h-3" />
                                  <span className="text-sm font-semibold">
                                    ${discount.value} Off
                                  </span>
                                </div>
                              )}
                              {discount.minAmount && (
                                <span className="text-xs text-gray-500">
                                  Min: ${discount.minAmount}
                                </span>
                              )}
                            </div>
                          </div>
                          <Button size="sm">
                            <Check className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}

                      {filteredDiscounts.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <Tag className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No discounts found</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card> */}
              </div>
            )}

            {/* Manual Discount Tab */}
            {activeTab === "manual" && (
              <div className="space-y-4">
                <div className="flex flex-row flex-wrap gap-2">
                  {/* Discount Type */}
                  <Card className="md:w-fit w-full">
                    <CardHeader>
                      <CardTitle className="text-sm">
                        Tipo de Descuento
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 gap-2">
                        <Button
                          variant={
                            manualDiscount.type === DiscountTypeEnum.PERCENTAGE
                              ? "default"
                              : "outline"
                          }
                          onClick={() =>
                            setManualDiscount((prev) => ({
                              ...prev,
                              type: DiscountTypeEnum.PERCENTAGE,
                              value:
                                prev.type === DiscountTypeEnum.FIXED_AMOUNT
                                  ? 0
                                  : prev.value,
                            }))
                          }
                          className="flex items-center gap-2 py-3"
                        >
                          <Percent className="w-4 h-4" />
                          Porcentaje
                        </Button>
                        <Button
                          variant={
                            manualDiscount.type ===
                            DiscountTypeEnum.FIXED_AMOUNT
                              ? "default"
                              : "outline"
                          }
                          onClick={() =>
                            setManualDiscount((prev) => ({
                              ...prev,
                              type: DiscountTypeEnum.FIXED_AMOUNT,
                              value:
                                prev.type === DiscountTypeEnum.PERCENTAGE
                                  ? 0
                                  : prev.value,
                            }))
                          }
                          className="flex items-center gap-2"
                        >
                          <DollarSign className="w-4 h-4" />
                          Monto Fijo
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Discount Value */}
                  <Card className="md:w-fit w-full">
                    <CardHeader>
                      <CardTitle className="text-sm">
                        Valor del Descuento
                        {manualDiscount.type === DiscountTypeEnum.PERCENTAGE &&
                          " (%)"}
                        {manualDiscount.type ===
                          DiscountTypeEnum.FIXED_AMOUNT && " ($)"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setManualDiscount((prev) => ({
                              ...prev,
                              value: Math.max(
                                0,
                                prev.value -
                                  (prev.type === DiscountTypeEnum.PERCENTAGE
                                    ? 1
                                    : 1)
                              ),
                            }))
                          }
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <Input
                          type="number"
                          value={manualDiscount.value}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            setManualDiscount((prev) => ({ ...prev, value }));
                            setError("");
                          }}
                          className="text-center text-2xl w-24"
                          min="0"
                          max={
                            manualDiscount.type === DiscountTypeEnum.PERCENTAGE
                              ? "100"
                              : undefined
                          }
                          step={
                            manualDiscount.type === DiscountTypeEnum.PERCENTAGE
                              ? "1"
                              : "0.01"
                          }
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setManualDiscount((prev) => ({
                              ...prev,
                              value:
                                prev.value +
                                (prev.type === DiscountTypeEnum.PERCENTAGE
                                  ? 1
                                  : 1),
                            }))
                          }
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                  {/* Apply To */}
                  <Card className="md:w-fit w-full">
                    <CardHeader>
                      <CardTitle className="text-sm">Aplicar a</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-1 gap-2">
                        <Button
                          variant={
                            manualDiscount.applyTo === "order"
                              ? "default"
                              : "outline"
                          }
                          onClick={() =>
                            setManualDiscount((prev) => ({
                              ...prev,
                              applyTo: "order",
                            }))
                          }
                        >
                          Pedido
                        </Button>
                        <Button
                          variant={
                            manualDiscount.applyTo === "item"
                              ? "default"
                              : "outline"
                          }
                          onClick={() =>
                            setManualDiscount((prev) => ({
                              ...prev,
                              applyTo: "item",
                            }))
                          }
                        >
                          Artículo
                        </Button>
                      </div>

                      {/* Item Selection */}
                      {manualDiscount.applyTo === "item" && (
                        <div className="space-y-2">
                          <label className="text-sm font-medium">
                            Seleccionar Artículo:
                          </label>
                          <div className="space-y-1">
                            {cartItems.map((item) => (
                              <label
                                key={item.id}
                                className="flex items-center gap-2 cursor-pointer"
                              >
                                <input
                                  type="radio"
                                  name="selectedItem"
                                  value={item.id}
                                  checked={
                                    manualDiscount.selectedItemId === item.id
                                  }
                                  onChange={(e) =>
                                    setManualDiscount((prev) => ({
                                      ...prev,
                                      selectedItemId: e.target.value,
                                    }))
                                  }
                                />
                                <span className="text-sm">
                                  {item.name} - $
                                  {(item.price * item.quantity).toFixed(2)}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Apply Manual Discount */}
                <Button
                  onClick={handleManualDiscount}
                  className="w-full"
                  disabled={
                    manualDiscount.value <= 0 ||
                    (manualDiscount.applyTo === "item" &&
                      !manualDiscount.selectedItemId)
                  }
                >
                  Aplicar{" "}
                  {manualDiscount.type === DiscountTypeEnum.PERCENTAGE
                    ? `${manualDiscount.value}%`
                    : `$${manualDiscount.value}`}{" "}
                  Descuento
                </Button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
