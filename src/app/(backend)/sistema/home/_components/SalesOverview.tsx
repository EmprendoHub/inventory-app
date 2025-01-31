import { CircleCheck } from "lucide-react";
import React from "react";

export default function SalesOverview() {
  const salesActivity = [
    {
      title: "Empaquetado",
      qty: 0,
      unit: "Qty",
      color: "blue",
    },
    {
      title: "Envíos",
      qty: 0,
      unit: "Qty",
      color: "emerald",
    },
    {
      title: "Entregas",
      qty: 0,
      unit: "Qty",
      color: "red",
    },
    {
      title: "Cobros",
      qty: 0,
      unit: "Qty",
      color: "yellow",
    },
  ];
  return (
    <div className="bg-blue-100 border-b border-slate-300 p-8 flex maxxlg:flex-wrap items-center justify-between gap-12">
      {/* Sales Activity */}
      <div className="flex flex-col gap-4">
        <div className="flex-1">
          <h2 className="text-2xl font-bold">Ventas</h2>
          <p className="text-xs text-muted">Actividad de ventas</p>
        </div>
        <div className="flex maxlg:flex-wrap items-center gap-4">
          {salesActivity.map((activity) => (
            <button
              key={activity.title}
              className={`flex flex-col items-center gap-2 bg-white p-6 rounded-md shadow-md hover:border-${activity.color}-300 hover:border-1 border w-40`}
            >
              <p className={`text-4xl text-${activity.color}-500`}>
                {activity.qty}
              </p>
              <span className="text-[13px] text-muted">{activity.unit}</span>
              <span className="text-[12px] text-muted uppercase flex items-center gap-1">
                <CircleCheck size={15} />
                {activity.title}
              </span>
            </button>
          ))}
        </div>
      </div>
      {/* Resumen Inventario */}
      <div className="flex flex-col gap-4 w-full">
        <div className="flex-1">
          <h2 className="text-xl font-bold"> Inventario</h2>
          <p className="text-xs text-muted">Resumen de inventario</p>
        </div>
        <div className="flex flex-col  items-start gap-4">
          {/*  Card 1 */}
          <div className="flex items-center justify-between bg-white p-4 rounded-md shadow-md w-full">
            <span className="text-xs text-muted flex items-center gap-1">
              Cantidades bodega
            </span>
            <p className="text-xl text-blue-500">0</p>
          </div>
          {/*  Card 2 */}
          <div className="flex items-center justify-between bg-white p-4 rounded-md shadow-md w-full">
            <span className="text-xs text-muted flex items-center gap-1">
              Cantidades a recibir
            </span>
            <p className="text-xl text-blue-500">0</p>
          </div>
        </div>
      </div>
    </div>
  );
}
