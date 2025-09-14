"use client";

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PauseCircle,
  PlayCircle,
  Trash2,
  Clock,
  User,
  ShoppingCart,
  X,
  Search,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { HeldOrderWithDetails, CartState, HeldOrderStatus } from "@/types/pos";
import { formatDistanceToNow } from "date-fns";

interface HoldResumeOrdersProps {
  isOpen: boolean;
  onClose: () => void;
  heldOrders: HeldOrderWithDetails[];
  onResumeOrder: (order: HeldOrderWithDetails) => void;
  onDeleteOrder: (orderId: string) => void;
  onHoldCurrentOrder?: (cart: CartState, notes?: string) => void;
  currentCart?: CartState;
}

export default function HoldResumeOrders({
  isOpen,
  onClose,
  heldOrders,
  onResumeOrder,
  onDeleteOrder,
  onHoldCurrentOrder,
  currentCart,
}: HoldResumeOrdersProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showHoldModal, setShowHoldModal] = useState(false);
  const [holdNotes, setHoldNotes] = useState("");
  const [selectedOrder, setSelectedOrder] =
    useState<HeldOrderWithDetails | null>(null);

  // Filter held orders
  const filteredOrders = React.useMemo(() => {
    return heldOrders.filter(
      (order) =>
        order.holdNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.notes?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [heldOrders, searchTerm]);

  // Handle hold current order
  const handleHoldCurrentOrder = useCallback(() => {
    if (!onHoldCurrentOrder || !currentCart || currentCart.items.length === 0)
      return;

    onHoldCurrentOrder(currentCart, holdNotes);
    setHoldNotes("");
    setShowHoldModal(false);
    onClose();
  }, [onHoldCurrentOrder, currentCart, holdNotes, onClose]);

  // Handle resume order
  const handleResumeOrder = useCallback(
    (order: HeldOrderWithDetails) => {
      onResumeOrder(order);
      onClose();
    },
    [onResumeOrder, onClose]
  );

  // Get status badge color
  const getStatusColor = (status: HeldOrderStatus) => {
    switch (status) {
      case HeldOrderStatus.HELD:
        return "bg-yellow-100 text-yellow-800";
      case HeldOrderStatus.RETRIEVED:
        return "bg-green-100 text-green-800";
      case HeldOrderStatus.EXPIRED:
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

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
          className="bg-background rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center gap-2">
              <PauseCircle className="w-5 h-5 text-orange-600" />
              <h2 className="text-xl font-semibold">Hold & Resume Orders</h2>
              <Badge variant="outline">{heldOrders.length} orders</Badge>
            </div>

            <div className="flex items-center gap-2">
              {onHoldCurrentOrder &&
                currentCart &&
                currentCart.items.length > 0 && (
                  <Button onClick={() => setShowHoldModal(true)}>
                    <PauseCircle className="w-4 h-4 mr-2" />
                    Hold Current Order
                  </Button>
                )}
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="p-6">
            {/* Search */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by order number, customer, or notes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Held Orders Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
              {filteredOrders.map((order) => (
                <motion.div key={order.id} layout className="cursor-pointer">
                  <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base font-semibold">
                            #{order.holdNumber}
                          </CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={getStatusColor(order.status)}>
                              {order.status}
                            </Badge>
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Clock className="w-3 h-3" />
                              {formatDistanceToNow(order.heldAt, {
                                addSuffix: true,
                              })}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedOrder(order);
                            }}
                          >
                            <Eye className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteOrder(order.id);
                            }}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="pt-0">
                      {/* Customer Info */}
                      {order.customer && (
                        <div className="flex items-center gap-2 mb-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium">
                            {order.customer.name}
                          </span>
                        </div>
                      )}

                      {/* Order Summary */}
                      <div className="flex items-center gap-2 mb-3">
                        <ShoppingCart className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">
                          {order.parsedItems.length} items - $
                          {order.subtotal.toFixed(2)}
                        </span>
                      </div>

                      {/* Notes */}
                      {order.notes && (
                        <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                          {order.notes}
                        </p>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleResumeOrder(order);
                          }}
                          className="flex-1"
                          disabled={order.status !== HeldOrderStatus.HELD}
                        >
                          <PlayCircle className="w-3 h-3 mr-1" />
                          Resume
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}

              {filteredOrders.length === 0 && (
                <div className="col-span-full text-center py-12 text-gray-500">
                  <PauseCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-lg font-medium mb-1">No held orders</p>
                  <p className="text-sm">
                    {searchTerm
                      ? "No orders match your search"
                      : "Hold orders to save them for later completion"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Hold Current Order Modal */}
      <AnimatePresence>
        {showHoldModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-60 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-background rounded-lg w-full max-w-md p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Hold Current Order</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowHoldModal(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {currentCart && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Order Summary:</p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">
                      {currentCart.items.length} items
                    </span>
                    <span className="font-semibold">
                      ${currentCart.totalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Notes (optional)
                  </label>
                  <textarea
                    value={holdNotes}
                    onChange={(e) => setHoldNotes(e.target.value)}
                    placeholder="Add notes for this held order..."
                    className="w-full px-3 py-2 border rounded-lg resize-none"
                    rows={3}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowHoldModal(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleHoldCurrentOrder} className="flex-1">
                    <PauseCircle className="w-4 h-4 mr-2" />
                    Hold Order
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Order Details Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-60 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-background rounded-lg w-full max-w-md max-h-[80vh] overflow-y-auto"
            >
              <div className="sticky top-0 bg-card border-b p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">
                      #{selectedOrder.holdNumber}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Held{" "}
                      {formatDistanceToNow(selectedOrder.heldAt, {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedOrder(null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="p-4 space-y-4">
                {/* Customer Info */}
                {selectedOrder.customer && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <h4 className="font-medium mb-1">Customer</h4>
                    <p className="text-sm">{selectedOrder.customer.name}</p>
                    <p className="text-xs text-gray-600">
                      {selectedOrder.customer.phone}
                    </p>
                  </div>
                )}

                {/* Items */}
                <div>
                  <h4 className="font-medium mb-2">
                    Items ({selectedOrder.parsedItems.length})
                  </h4>
                  <div className="space-y-2">
                    {selectedOrder.parsedItems.map((item, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-medium">{item.name}</p>
                          <p className="text-xs text-gray-600">
                            Qty: {item.quantity}
                          </p>
                        </div>
                        <p className="text-sm font-semibold">
                          $
                          {(item.price * item.quantity - item.discount).toFixed(
                            2
                          )}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                {selectedOrder.notes && (
                  <div className="p-3 bg-yellow-50 rounded-lg">
                    <h4 className="font-medium mb-1">Notes</h4>
                    <p className="text-sm">{selectedOrder.notes}</p>
                  </div>
                )}

                {/* Total */}
                <div className="border-t pt-3">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Total</span>
                    <span className="text-lg font-bold">
                      ${selectedOrder.subtotal.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => handleResumeOrder(selectedOrder)}
                    className="flex-1"
                    disabled={selectedOrder.status !== HeldOrderStatus.HELD}
                  >
                    <PlayCircle className="w-4 h-4 mr-2" />
                    Resume Order
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AnimatePresence>
  );
}
