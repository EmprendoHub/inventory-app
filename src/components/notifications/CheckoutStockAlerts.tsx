"use client";

import React, { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StockAlert {
  itemId: string;
  itemName: string;
  requestedQty: number;
  availableQty: number;
  shortfall: number;
  branchesWithStock: Array<{
    warehouseId: string;
    warehouseName: string;
    availableQty: number;
  }>;
  notificationCreated: boolean;
  notificationId?: string;
}

interface CheckoutStockAlertsProps {
  alerts: StockAlert[];
  messages: string[];
  canProceed: boolean;
  onProceed?: () => void;
  onCancel?: () => void;
  className?: string;
}

const CheckoutStockAlerts: React.FC<CheckoutStockAlertsProps> = ({
  alerts,
  messages,
  canProceed,
  onProceed,
  onCancel,
  className = "",
}) => {
  const [showDetails, setShowDetails] = useState(false);

  if (alerts.length === 0) {
    return null;
  }

  const criticalAlerts = alerts.filter((alert) => alert.shortfall > 0);
  const notificationsCreated = alerts.filter(
    (alert) => alert.notificationCreated
  ).length;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Summary Alert */}
      <Alert
        className={`${
          !canProceed
            ? "border-red-300 bg-red-50"
            : "border-yellow-300 bg-yellow-50"
        }`}
      >
        <AlertDescription>
          <div className="flex justify-between items-start">
            <div>
              <p className="font-medium mb-2">
                {!canProceed
                  ? "⚠️ Stock Shortage Detected"
                  : "📋 Stock Notifications"}
              </p>
              <div className="space-y-1">
                {messages.map((message, index) => (
                  <div key={index} className="text-sm">
                    {message}
                  </div>
                ))}
              </div>
              {notificationsCreated > 0 && (
                <p className="text-sm mt-2 text-green-700">
                  ✅ {notificationsCreated} notification
                  {notificationsCreated > 1 ? "s" : ""} sent to other branches
                </p>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? "Hide" : "Show"} Details
            </Button>
          </div>
        </AlertDescription>
      </Alert>

      {/* Detailed Alerts */}
      {showDetails && (
        <div className="space-y-3">
          {criticalAlerts.map((alert) => (
            <Card key={alert.itemId} className="border-orange-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex justify-between items-center">
                  <span>{alert.itemName}</span>
                  <Badge
                    variant={
                      alert.notificationCreated ? "default" : "destructive"
                    }
                  >
                    {alert.notificationCreated ? "Requested" : "No Stock"}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <div className="text-sm text-gray-600">Needed</div>
                    <div className="font-medium">
                      {alert.requestedQty} units
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">
                      Available Locally
                    </div>
                    <div className="font-medium text-red-600">
                      {alert.availableQty} units
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Shortage</div>
                    <div className="font-medium text-red-600">
                      {alert.shortfall} units
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Other Branches</div>
                    <div className="font-medium text-green-600">
                      {alert.branchesWithStock.length} location
                      {alert.branchesWithStock.length !== 1 ? "s" : ""}
                    </div>
                  </div>
                </div>

                {/* Branches with stock */}
                {alert.branchesWithStock.length > 0 && (
                  <div>
                    <div className="text-sm text-gray-600 mb-2">
                      Available at:
                    </div>
                    <div className="space-y-1">
                      {alert.branchesWithStock.map((branch, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-center bg-green-50 px-2 py-1 rounded text-sm"
                        >
                          <span>{branch.warehouseName}</span>
                          <Badge variant="secondary">
                            {branch.availableQty} units
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notification status */}
                {alert.notificationCreated && alert.notificationId && (
                  <div className="mt-3 p-2 bg-blue-50 rounded text-sm">
                    <div className="flex items-center text-blue-700">
                      <span>
                        📧 Request sent to{" "}
                        {alert.branchesWithStock[0]?.warehouseName}
                      </span>
                    </div>
                    <div className="text-xs text-blue-600 mt-1">
                      Notification ID: {alert.notificationId.slice(-8)}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 pt-4 border-t">
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            Cancel Sale
          </Button>
        )}
        {onProceed && (
          <Button
            onClick={onProceed}
            disabled={!canProceed}
            className={`${
              canProceed
                ? "bg-green-600 hover:bg-green-700"
                : "bg-gray-400 cursor-not-allowed"
            }`}
          >
            {canProceed ? "Proceed with Sale" : "Cannot Complete Sale"}
          </Button>
        )}
      </div>

      {/* Information box */}
      <div className="bg-blue-50 p-3 rounded text-sm text-blue-800">
        <p className="font-medium mb-1">What happens next?</p>
        <ul className="list-disc list-inside space-y-1">
          {notificationsCreated > 0 && (
            <li>Other branches have been notified of your stock request</li>
          )}
          {canProceed ? (
            <>
              <li>You can complete this sale with available stock</li>
              <li>Other branches will respond to your requests separately</li>
            </>
          ) : (
            <li>
              Sale cannot be completed due to insufficient stock across all
              locations
            </li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default CheckoutStockAlerts;
