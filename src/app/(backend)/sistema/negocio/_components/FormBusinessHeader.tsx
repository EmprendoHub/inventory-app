import { X } from "lucide-react";
import Link from "next/link";
import React from "react";

export default function FormBusinessHeader({ title }: { title: string }) {
  return (
    <div>
      <div className="flex items-center justify-between bg-background mb-4 p-2 rounded-lg">
        <h2>{title}</h2>
        <Link href={"/sistema/home"}>
          <X />
        </Link>
      </div>
    </div>
  );
}
