import React from "react";
import { BsFillCreditCard2FrontFill } from "react-icons/bs";

export default function DashboardBanner() {
  return (
    <div className="flex maxmd:flex-col gap-2 items-center justify-between maxmd:items-end bg-blue-50  p-4 rounded-md max-w-3xl shadow-md mb-2">
      <div className="flex  gap-2 items-center">
        {/* Icons */}
        <BsFillCreditCard2FrontFill size={80} className="text-muted" />
        {/* Text */}
        <div className="flex flex-col">
          <h2 className="text-xl font-bold leading-none">
            Comienza a aceptar pagos en linea.
          </h2>
          <p className="text-sm leading-1">
            Los negocios que aceptan pagos en linea tienen un incremento del 30%
            en sus ventas.
          </p>
        </div>
      </div>
      <button className="py-1.5 px-3 text-white bg-primary rounded-md text-sm tracking-wider hover:bg-blue-950">
        Activar
      </button>
    </div>
  );
}
