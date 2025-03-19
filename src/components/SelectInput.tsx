import React from "react";

type SelectType = {
  label: string;
  name: string;
  className?: string;
  isSelected?: string | null;
  options: {
    name: string;
    value: string;
  }[];
  state?: { errors?: { [key: string]: string[] } };
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void; // Add onChange prop
};

export default function SelectInput({
  label,
  name,
  isSelected,
  className = "w-full col-span-1 maxmd:col-span-2",
  options = [],
  state,
  onChange, // Destructure onChange
}: SelectType) {
  return (
    <div className={className}>
      <label
        htmlFor={name}
        className="block mb-2 text-sm font-medium text-muted"
      >
        {label}
      </label>
      <select
        id={name}
        defaultValue={`${isSelected}`}
        name={name}
        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
        onChange={onChange} // Pass onChange to the select element
      >
        {options.map(
          (option: { name: string; value: string }, index: number) => (
            <option key={index} value={option.value}>
              {option.name}
            </option>
          )
        )}
      </select>
      {state?.errors?.[`${name}`] && (
        <p className="text-sm text-red-500">
          {state?.errors?.[`${name}`].join(", ")}
        </p>
      )}
    </div>
  );
}
