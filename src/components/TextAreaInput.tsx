import React from "react";

type TextType = {
  label: string;
  name: string;
  className?: string;
  state: { errors?: { [key: string]: string[] } };
};

export default function TextAreaInput({
  label,
  name,
  state,
  className = "col-span-1 maxsm:col-span-2 w-full",
}: TextType) {
  return (
    <div className={className}>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <textarea
        name={name}
        id={name}
        rows={4}
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
