import { X } from "lucide-react";
import Link from "next/link";
import React from "react";

export default function ClientFormHeader({ title }: { title: string }) {
  return (
    <div>
      <div className="flex items-center justify-between  bg-card mb-4">
        <h2>{title}</h2>
        <Link href={"/sistema/ventas"}>
          <X />
        </Link>
      </div>
    </div>
  );
}
