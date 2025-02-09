import React from "react";

type NumericInputType = {
  label: string;
  name: string;
  state: { errors?: { [key: string]: string[] } };
  onChange?: (value: number) => void; // Add onChange prop
};

export default function NumericInput({
  label,
  name,
  state,
  onChange,
}: NumericInputType) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value); // Parse the input value to a number
    if (onChange) {
      onChange(value); // Pass the numeric value to the parent component
    }
  };

  return (
    <div className="w-full">
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
        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
        onChange={handleChange} // Attach the onChange handler
      />
      {state.errors?.[`${name}`] && (
        <p className="text-sm text-red-500">
          {state.errors?.[`${name}`].join(", ")}
        </p>
      )}
    </div>
  );
}
