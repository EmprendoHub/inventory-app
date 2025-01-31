import React from "react";

export default function SubscriptionCard({ className }: { className: string }) {
  return (
    <div
      className={`bg-slate-900 border-l-4 border-yellow-600 p-2 mx-1.5 rounded-md flex flex-col text-xs gap-2 shadow-md ${className}`}
    >
      <h2 className="text-[13px]">
        Tu plan de prueba premium expira en{" "}
        <span className="text-yellow-500">13 Dias</span>
      </h2>
      <div className="flex items-center gap-1 text-[12px]">
        <button className="w-full rounded-md p-1 py-2 border-slate-600 border-1 border hover:bg-slate-800">
          Cambiar
        </button>
        <button className="w-full rounded-md p-1 py-2 border-slate-600 border-1 border hover:bg-slate-800">
          Actualizar
        </button>
      </div>
    </div>
  );
}
