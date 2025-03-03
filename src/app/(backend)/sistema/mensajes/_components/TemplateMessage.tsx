import { Alert } from "@/components/ui/alert";
import React from "react";

// Define a functional component with no props
const TemplateMessage: React.FC = () => {
  return (
    <div className="border shadow-lg p-2 rounded-lg w-full">
      <Alert>
        <span className="text-[12px]">
          Este mensaje se enviará a todos los clientes seleccionados. Revisa el
          listado en la parte inferior.
        </span>
      </Alert>
    </div>
  );
};

export default TemplateMessage;
