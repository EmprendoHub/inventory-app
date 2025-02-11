import React, { useState } from "react";

const MaskedInput = () => {
  const [paymentData, setPaymentData] = useState({ code: "" });

  // Function to handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPaymentData((prev) => ({
      ...prev,
      code: value, // Store the actual value
    }));
  };

  // Function to mask the input value
  const maskValue = (value: string) => {
    return value.replace(/./g, "•"); // Replace every character with a bullet (•)
  };

  return (
    <input
      name="supervisorCode"
      type="text"
      placeholder="Código de Supervisor"
      value={maskValue(paymentData.code)} // Display masked value
      onChange={handleInputChange} // Handle actual input
      className="text-center rounded-md text-sm peer w-full px-4 py-2 border outline-none focus:ring-2 focus:ring-blue-500 bg-input"
    />
  );
};

export default MaskedInput;
