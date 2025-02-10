import Link from "next/link";
import React from "react";
import { BiQuestionMark } from "react-icons/bi";

export default function SalesHeader({
  title,
  link,
}: {
  title?: string;
  link?: string;
}) {
  return (
    <div className="flex w-full items-center justify-between">
      <h2 className="text-base capitalize">{title}</h2>{" "}
      <div className="flex items-center gap-3">
        <Link
          href={`/sistema/ventas/${link}`}
          className="flex gap-2 items-center text-white bg-accent rounded-md py-1.5 px-2 text-xs hover:bg-blue-900"
        >
          + Nuevo
        </Link>

        <button className="bg-blue-500 text-white p-1 rounded-md">
          <BiQuestionMark />
        </button>
      </div>
    </div>
  );
}
