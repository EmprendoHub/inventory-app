import React from "react";

type SelectType = {
  label: string;
  name: string;
  className?: string;
  options: {
    name: string;
    value: string;
  }[];
  state: { errors?: { [key: string]: string[] } };
};

export default function SelectInput({
  label,
  name,
  className = "col-span-1 maxsm:col-span-2",
  options = [],
  state,
}: SelectType) {
  console.log("state.errors?.[`${name}`] ", state.errors);

  console.log("name", name);

  return (
    <div className={className}>
      <label
        htmlFor={name}
        className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
      >
        {label}
      </label>
      <select
        id={name}
        name={name}
        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
      >
        {options.map(
          (option: { name: string; value: string }, index: number) => (
            <option
              key={index}
              selected={index === 0 ? true : false}
              value={option.value}
            >
              {option.name}
            </option>
          )
        )}
      </select>
      {state.errors?.[`${name}`] && (
        <p className="text-sm text-red-500">
          {state.errors?.[`${name}`].join(", ")}
        </p>
      )}
    </div>
  );
}
