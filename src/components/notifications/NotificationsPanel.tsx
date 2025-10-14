"use client";

import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface BranchNotification {
  id: string;
  notificationNo: string;
  type: string;
  priority: string;
  title: string;
  message: string;
  status: string;
  requestedQty: number;
  availableQty: number;
  fromWarehouse: {
    title: string;
    code: string;
  };
  toWarehouse: {
    title: string;
    code: string;
  };
  createdAt: string;
  urgency: boolean;
  deliveryMethod: string;
}

interface NotificationsPanelProps {
  warehouseId: string;
  userId: string;
  className?: string;
}

const NotificationsPanel: React.FC<NotificationsPanelProps> = ({
  warehouseId,
  userId,
  className = "",
}) => {
  const [notifications, setNotifications] = useState<BranchNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "incoming" | "outgoing">("all");

  useEffect(() => {
    fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [warehouseId, filter]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        warehouseId,
        type: filter,
      });

      const response = await fetch(`/api/notifications?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch notifications");
      }

      setNotifications(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (
    notificationId: string,
    responseType: string
  ) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          responseType,
          respondedBy: userId,
          message: `Response: ${responseType}`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to respond to notification");
      }

      // Refresh notifications
      fetchNotifications();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to respond");
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "critical":
        return "bg-red-500";
      case "high":
        return "bg-orange-500";
      case "normal":
        return "bg-blue-500";
      case "low":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-yellow-500";
      case "acknowledged":
        return "bg-blue-500";
      case "accepted":
        return "bg-green-500";
      case "rejected":
        return "bg-red-500";
      case "completed":
        return "bg-green-600";
      default:
        return "bg-gray-500";
    }
  };

  if (loading) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-3">Branch Notifications</h3>

        {/* Filter buttons */}
        <div className="flex space-x-2 mb-4">
          {(["all", "incoming", "outgoing"] as const).map((filterType) => (
            <Button
              key={filterType}
              variant={filter === filterType ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(filterType)}
            >
              {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {error && (
        <Alert className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No notifications found
          </div>
        ) : (
          notifications.map((notification) => (
            <Card
              key={notification.id}
              className={`${
                notification.urgency ? "border-red-300 bg-red-50" : ""
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-sm">
                      {notification.notificationNo} - {notification.title}
                    </CardTitle>
                    <div className="flex space-x-2 mt-2">
                      <Badge
                        className={`text-white ${getPriorityColor(
                          notification.priority
                        )}`}
                      >
                        {notification.priority}
                      </Badge>
                      <Badge
                        className={`text-white ${getStatusColor(
                          notification.status
                        )}`}
                      >
                        {notification.status}
                      </Badge>
                      {notification.urgency && (
                        <Badge className="bg-red-600 text-white">URGENT</Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(notification.createdAt).toLocaleString()}
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="text-sm text-gray-700 mb-3">
                  {notification.message}
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs text-gray-600 mb-3">
                  <div>
                    <strong>From:</strong> {notification.fromWarehouse.title} (
                    {notification.fromWarehouse.code})
                  </div>
                  <div>
                    <strong>To:</strong> {notification.toWarehouse.title} (
                    {notification.toWarehouse.code})
                  </div>
                  <div>
                    <strong>Requested:</strong> {notification.requestedQty}{" "}
                    units
                  </div>
                  <div>
                    <strong>Available:</strong> {notification.availableQty}{" "}
                    units
                  </div>
                </div>

                {/* Action buttons for incoming notifications */}
                {filter === "incoming" && notification.status === "PENDING" && (
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      onClick={() => handleRespond(notification.id, "ACCEPT")}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        handleRespond(notification.id, "PARTIAL_ACCEPT")
                      }
                    >
                      Partial
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleRespond(notification.id, "REJECT")}
                    >
                      Reject
                    </Button>
                  </div>
                )}

                {/* Show delivery method */}
                <div className="mt-2 text-xs text-gray-500">
                  <strong>Delivery:</strong>{" "}
                  {notification.deliveryMethod.replace("_", " ").toLowerCase()}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Refresh button */}
      <div className="mt-4 text-center">
        <Button
          variant="outline"
          size="sm"
          onClick={fetchNotifications}
          disabled={loading}
        >
          Refresh
        </Button>
      </div>
    </div>
  );
};

export default NotificationsPanel;
