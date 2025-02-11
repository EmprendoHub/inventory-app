import React from "react";

interface ToggleSwitchProps {
  isOn: boolean;
  handleToggle: () => void;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ isOn, handleToggle }) => {
  return (
    <div
      onClick={handleToggle}
      className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer ${
        isOn ? "bg-blue-600" : "bg-gray-300"
      }`}
    >
      <div
        className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
          isOn ? "translate-x-6" : "translate-x-0"
        }`}
      />
      <input type="hidden" name="active" value={`${isOn}`} />
    </div>
  );
};

export default ToggleSwitch;
