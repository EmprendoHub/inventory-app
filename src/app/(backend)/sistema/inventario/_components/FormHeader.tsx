import { X } from "lucide-react";
import Link from "next/link";
import React from "react";

export default function FormHeader({ title }: { title: string }) {
  return (
    <div>
      <div className="flex items-center justify-between bg-white">
        <h2>{title}</h2>
        <Link href={"/sistema/inventario"}>
          <X />
        </Link>
      </div>
    </div>
  );
}
