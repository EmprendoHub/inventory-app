import { LayoutGrid, List } from "lucide-react";
import Link from "next/link";
import React from "react";
import { BiQuestionMark } from "react-icons/bi";
import { BsThreeDots } from "react-icons/bs";

export default function InventoryHeader() {
  return (
    <div className="flex w-full items-center justify-between">
      <span className="text-sm">Artículos</span>{" "}
      <div className="flex items-center gap-3">
        <Link
          href={"/sistema/inventario/articulos/nuevo"}
          className="flex gap-2 items-center text-white bg-primary rounded-md py-1.5 px-2 text-xs hover:bg-blue-900"
        >
          + New
        </Link>
        <div className="flex items-center gap-.5 text-gray-500">
          <button className="bg-gray-200 p-1 rounded-md">
            <List />
          </button>
          <button className="bg-gray-200 p-1 rounded-md">
            <LayoutGrid />
          </button>
        </div>
        <button className="bg-gray-200 p-1 rounded-md">
          <BsThreeDots />
        </button>
        <button className="bg-blue-500 text-white p-1 rounded-md">
          <BiQuestionMark />
        </button>
      </div>
    </div>
  );
}
