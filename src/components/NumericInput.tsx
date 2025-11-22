import React from "react";

type NumericInputType = {
  label?: string | null;
  name: string;
  value?: number;
  defaultValue?: number;
  className?: string;
  state?: { errors?: { [key: string]: string[] } };
  onChange?: (value: number) => void;
};

export default function NumericInput({
  label,
  name,
  value,
  defaultValue,
  state,
  className,
  onChange,
}: NumericInputType) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const numericValue = inputValue === "" ? 0 : parseFloat(inputValue);
    if (onChange) {
      onChange(numericValue);
    }
  };

  // Use controlled component if value is provided, otherwise uncontrolled with defaultValue
  const inputProps =
    value !== undefined
      ? { value: value || "" }
      : { defaultValue: defaultValue || "" };

  return (
    <div className={`${className ? className : "w-full"}`}>
      <label
        htmlFor={name}
        className="block mb-2 text-sm font-medium text-muted"
      >
        {label}
      </label>
      <input
        type="number"
        id={name}
        name={name}
        {...inputProps}
        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        onChange={handleChange}
        min={0}
      />
      {state?.errors?.[`${name}`] && (
        <p className="text-sm text-red-500">
          {state.errors?.[`${name}`].join(", ")}
        </p>
      )}
    </div>
  );
}
