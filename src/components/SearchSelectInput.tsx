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
import Image from "next/image";

type OptionType = {
  name: string;
  value: string;
  image?: string | null;
  description?: string;
};

type SearchSelectInputProps = {
  label: string;
  name: string;
  className?: string;
  options: OptionType[];
  placeholder?: string;
  emptyMessage?: string;
  hidden?: boolean;
  value?: string;
  onChange?: (value: string) => void;
  state: { errors?: { [key: string]: string[] } };
};

export function SearchSelectInput({
  label,
  name,
  className = "w-full flex",
  options = [],
  placeholder = "Seleccionar...",
  emptyMessage = "No se encontraron opciones.",
  value: externalValue,
  hidden,
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

  const getSelectedOption = () => {
    return options.find((option) => option.value === value);
  };

  const selectedOption = getSelectedOption();

  return (
    <div className={className}>
      <label
        htmlFor={name}
        className="block mb-2 text-sm font-medium text-muted"
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
            <div className="flex items-center gap-2">
              {selectedOption?.image && (
                <Image
                  width={150}
                  height={150}
                  src={selectedOption.image}
                  alt={selectedOption.name}
                  className="w-6 h-6 object-cover rounded"
                />
              )}
              <span>{selectedOption ? selectedOption.name : placeholder}</span>
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className={`w-full p-0 ${hidden ? "hidden" : "block"}`}>
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
                    className="flex items-center gap-2 py-2"
                  >
                    {option.image && (
                      <Image
                        width={150}
                        height={150}
                        src={option.image}
                        alt={option.name}
                        className="w-8 h-8 object-cover rounded"
                      />
                    )}
                    <div className="flex flex-col">
                      <span>{option.name}</span>
                      {option.description && (
                        <span className="text-xs text-muted-foreground">
                          {option.description}
                        </span>
                      )}
                    </div>
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
