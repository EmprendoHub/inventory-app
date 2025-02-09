import React from "react";

type TextType = {
  label: string;
  name: string;
  className?: string;
  value?: string;
  state: { errors?: { [key: string]: string[] } };
  onChange?: (name: string, value: string) => void;
};

export default function TextInput({
  label,
  name,
  state,
  value,
  onChange,
  className = "col-span-1 maxsm:col-span-2 w-full",
}: TextType) {
  return (
    <div className={className}>
      <label htmlFor={name} className="block text-sm font-medium text-muted">
        {label}
      </label>
      <input
        name={name}
        id={name}
        value={value}
        onChange={(e) => onChange && onChange(name, e.target.value)}
        type="text"
        className="mt-1 block w-full rounded-md bg-input border-gray-300 shadow-sm"
      />
      {state.errors?.[`${name}`] && (
        <p className="text-sm text-red-500">
          {state.errors?.[`${name}`].join(", ")}
        </p>
      )}
    </div>
  );
}
