import React from "react";

type TextType = {
  label: string;
  name: string;
  value?: string;
  className?: string;
  state: { errors?: { [key: string]: string[] } };
  onChange?: (name: string, value: string) => void;
};

export default function TextAreaInput({
  label,
  name,
  state,
  value,
  onChange,
  className = "col-span-1 maxmd:col-span-2 w-full",
}: TextType) {
  return (
    <div className={className}>
      {/* <label htmlFor={name} className="block text-sm font-medium text-muted">
        {label}
      </label> */}
      <textarea
        name={name}
        id={name}
        value={value}
        placeholder={`Ingrese ${label.toLowerCase()}...`}
        onChange={(e) => onChange && onChange(name, e.target.value)}
        rows={2}
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
