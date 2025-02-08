import React from "react";

type TextType = {
  label: string;
  name: string;
  value?: number;
  state: { errors?: { [key: string]: string[] } };
  onChange?: (name: string, value: string) => void;
  className?: string;
};

export default function NumericInput({
  label,
  name,
  value,
  state,
  onChange,
  className = "col-span-1 maxsm:col-span-2 w-full",
}: TextType) {
  return (
    <div className={className}>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        name={name}
        id={name}
        value={value}
        onChange={(e) => onChange && onChange(name, e.target.value)}
        type="number"
        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
      />
      {state.errors?.[`${name}`] && (
        <p className="text-sm text-red-500">
          {state.errors?.[`${name}`].join(", ")}
        </p>
      )}
    </div>
  );
}
