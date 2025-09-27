import React from "react";

type TextType = {
  label: string;
  name: string;
  className?: string;
  value?: string;
  defaultValue?: string;
  state?: { errors?: { [key: string]: string[] } };
  disabled?: boolean | null;
  onChange?: (name: string, value: string) => void;
};

export default function TextInput({
  label,
  name,
  state,
  disabled,
  value,
  defaultValue,
  onChange,
  className = "col-span-1 maxmd:col-span-2 w-full",
}: TextType) {
  // Use controlled component if value is provided, otherwise uncontrolled with defaultValue
  const inputProps =
    value !== undefined ? { value: value } : { defaultValue: defaultValue };

  return (
    <div className={className}>
      <label htmlFor={name} className="block text-sm font-medium text-muted">
        {label}
      </label>
      <input
        disabled={disabled || false}
        name={name}
        id={name}
        {...inputProps}
        onChange={(e) => onChange && onChange(name, e.target.value)}
        type="text"
        className="mt-1 block w-full rounded-md bg-input border-gray-300 shadow-sm"
      />
      {state?.errors?.[`${name}`] && (
        <p className="text-sm text-red-500">
          {state.errors?.[`${name}`].join(", ")}
        </p>
      )}
    </div>
  );
}
