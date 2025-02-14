"use client";

import { useFormState } from "react-dom";
import { createCashTransactionAction } from "../_actions";

export default function CashTransactionForm({
  cashRegisterId,
}: {
  cashRegisterId: string;
}) {
  const [state, formAction] = useFormState(createCashTransactionAction, {
    success: false,
    message: "",
  });

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="cashRegisterId" value={cashRegisterId} />
      <div>
        <label className="block text-sm font-medium">Type</label>
        <select
          name="type"
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="DEPOSIT">Deposit</option>
          <option value="WITHDRAWAL">Withdrawal</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium">Amount</label>
        <input
          type="number"
          name="amount"
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Description</label>
        <input
          type="text"
          name="description"
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
        />
      </div>
      <button
        type="submit"
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Add Transaction
      </button>
      {state.message && (
        <p className="text-sm text-gray-600">{state.message}</p>
      )}
    </form>
  );
}
