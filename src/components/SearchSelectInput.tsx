// SearchSelectInput.tsx
"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type OptionType = {
  name: string;
  value: string;
};

type SearchSelectInputProps = {
  label: string;
  name: string;
  className?: string;
  options: OptionType[];
  placeholder?: string;
  emptyMessage?: string;
  value?: string;
  onChange?: (value: string) => void;
  state: { errors?: { [key: string]: string[] } };
};

export function SearchSelectInput({
  label,
  name,
  className = "w-full col-span-1 maxsm:col-span-2",
  options = [],
  placeholder = "Select an option...",
  emptyMessage = "No options found.",
  value: externalValue,
  onChange,
  state,
}: SearchSelectInputProps) {
  const [open, setOpen] = React.useState(false);
  const [internalValue, setInternalValue] = React.useState<string>(
    externalValue || ""
  );
  const [searchQuery, setSearchQuery] = React.useState("");

  const value = externalValue !== undefined ? externalValue : internalValue;

  const filteredOptions = options.filter((option) => {
    if (!searchQuery) return true;
    return option.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleSelect = (currentValue: string) => {
    const newValue = currentValue === value ? "" : currentValue;
    setInternalValue(newValue);
    onChange?.(newValue);
    setOpen(false);
  };

  const getDisplayText = () => {
    const selectedOption = options.find((option) => option.value === value);
    return selectedOption ? selectedOption.name : placeholder;
  };

  return (
    <div className={className}>
      <label
        htmlFor={name}
        className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
      >
        {label}
      </label>
      <Popover
        open={open}
        onOpenChange={(newOpen) => {
          setOpen(newOpen);
          if (!newOpen) setSearchQuery("");
        }}
      >
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {getDisplayText()}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder={placeholder}
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList>
              <CommandEmpty>{emptyMessage}</CommandEmpty>
              <CommandGroup>
                {filteredOptions.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.name}
                    onSelect={() => handleSelect(option.value)}
                  >
                    {option.name}
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4",
                        value === option.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {state.errors?.[name] && (
        <p className="text-sm text-red-500">{state.errors[name].join(", ")}</p>
      )}
    </div>
  );
}
