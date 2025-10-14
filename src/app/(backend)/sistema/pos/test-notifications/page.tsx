"use client";

import { useState } from "react";
import { createBranchNotificationFromPos } from "../_actions/pos-actions";

export default function TestNotificationPage() {
  const [isLoading, setIsLoading] = useState(false);

  // Test function to create a notification with hardcoded IDs
  const handleTestNotification = async () => {
    console.log("🧪 TEST: Starting notification creation test");
    setIsLoading(true);

    try {
      const result = await createBranchNotificationFromPos(
        "675bedf45f3d38a935eecc27", // Example item ID
        "Test Item",
        5,
        "675bed7f5f3d38a935eecbc2", // Example warehouse ID
        undefined, // No customer
        "CUSTOMER_PICKUP",
        "Test notification from debug page"
      );

      console.log("🧪 TEST: Result:", result);
      alert(
        `Test result: ${result.success ? "Success ✅" : "Failed ❌"}\n${
          result.success
            ? `Notification ID: ${result.notificationId}`
            : `Error: ${result.error}`
        }`
      );
    } catch (error) {
      console.error("🧪 TEST: Error:", error);
      alert(`Test error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Simple database check function
  const handleCheckDatabase = async () => {
    console.log("📋 Checking database for notifications...");

    try {
      // Try to access a simple API endpoint to check notifications
      const response = await fetch("/api/debug/notifications");
      if (response.ok) {
        const data = await response.json();
        console.log("Database check result:", data);
        alert(`Database check: ${JSON.stringify(data, null, 2)}`);
      } else {
        console.log("API endpoint not available, which is expected");
        alert("Database check API not available (this is normal)");
      }
    } catch (error) {
      console.log("Expected error checking database:", error);
      alert(
        "Cannot check database directly from frontend (this is normal for security)"
      );
    }
  };

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-4">🔧 Branch Notifications Test</h1>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h2 className="font-semibold text-blue-800 mb-2">
          What this test does:
        </h2>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Tests the createBranchNotificationFromPos function</li>
          <li>• Uses hardcoded test IDs (may not exist in your database)</li>
          <li>• Shows detailed console logs for debugging</li>
          <li>• Displays result in an alert popup</li>
        </ul>
      </div>

      <div className="space-y-4">
        <button
          onClick={handleTestNotification}
          disabled={isLoading}
          className="bg-blue-500 text-white px-6 py-3 rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isLoading ? "Testing..." : "🧪 Test Create Notification"}
        </button>

        <button
          onClick={handleCheckDatabase}
          className="bg-green-500 text-white px-6 py-3 rounded hover:bg-green-600 ml-4"
        >
          📋 Check Database Connection
        </button>
      </div>

      <div className="mt-8 p-4 bg-yellow-50 rounded-lg">
        <h3 className="font-semibold text-yellow-800 mb-2">📝 Debug Steps:</h3>
        <ol className="text-sm text-yellow-700 space-y-1">
          <li>1. Open browser developer console (F12)</li>
          <li>2. Click the Test Create Notification button</li>
          <li>3. Watch console for detailed debug logs</li>
          <li>4. Check if notification appears in your database</li>
          <li>5. Look for any error messages in console or alert</li>
        </ol>
      </div>

      <div className="mt-4 p-4 bg-red-50 rounded-lg">
        <h3 className="font-semibold text-red-800 mb-2">⚠️ If test fails:</h3>
        <ul className="text-sm text-red-700 space-y-1">
          <li>• Check if user is logged in and has a warehouse assigned</li>
          <li>• Verify database connection is working</li>
          <li>• Ensure BranchNotification model exists in database</li>
          <li>• Check server console for database errors</li>
        </ul>
      </div>
    </div>
  );
}
