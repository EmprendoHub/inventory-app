"use client";

import React, { useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { ChevronDown } from "lucide-react";
import dayjs from "dayjs";
import { cn } from "@/lib/utils"; // Utility for conditionally joining classNames
import { DeliveryFormState } from "@/types/delivery"; // Adjust the import path as needed
import { Calendar } from "@/components/ui/calendar"; // Import the correct Calendar component from ShadCN

type DateInputProps = {
  name: string;
  label: string;
  defaultValue: Date | string | null;
  state: DeliveryFormState;
  isOptional?: boolean;
};

const DateInput: React.FC<DateInputProps> = ({
  name,
  label,
  defaultValue,
  state,
  isOptional = false,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    defaultValue
      ? typeof defaultValue === "string"
        ? new Date(defaultValue)
        : defaultValue
      : undefined
  );

  const formattedDate = selectedDate
    ? dayjs(selectedDate).format("YYYY-MM-DD")
    : "";

  return (
    <div className="flex flex-col  min-w-40">
      <label
        htmlFor={name}
        className="block text-sm font-medium text-muted mb-2"
      >
        {label}{" "}
        {isOptional && (
          <span className="text-xs text-gray-500">(Optional)</span>
        )}
      </label>

      <Popover.Root>
        <Popover.Trigger
          className={cn(
            "flex items-center justify-between px-3 py-2 border rounded-md cursor-pointer",
            state.errors?.[name] ? "border-red-500" : "border-gray-300",
            "hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 "
          )}
        >
          <span>
            {selectedDate
              ? dayjs(selectedDate).format("MM/DD/YYYY")
              : "Select a date"}
          </span>
          <ChevronDown className="w-4 h-4 text-gray-500" />
        </Popover.Trigger>
        <Popover.Content
          align="start"
          className="p-4 bg-background rounded-md shadow-md"
        >
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate} // Corrected onSelect function
            initialFocus
          />
          <Popover.Arrow className="fill-white" />
        </Popover.Content>
      </Popover.Root>

      {/* Hidden input to integrate with form submissions */}
      <input type="hidden" name={name} value={formattedDate} />

      {/* Display validation errors */}
      {state.errors?.[name] && (
        <p className="mt-1 text-sm text-red-600">
          {state.errors[name].join(", ")}
        </p>
      )}
    </div>
  );
};

export default DateInput;
