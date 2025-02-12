import React from "react";
import Link from "next/link";
import { INVENTORY_ITEMS } from "@/app/constants";
import { iconMap } from "@/lib/utils";

export default function Negocio() {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-6 maxmd:grid-cols-1">
        {INVENTORY_ITEMS.map((item, index) => {
          const Icon = iconMap[item.iconName];

          return (
            <div
              key={index}
              className="shadow-xl items-center bg-card p-8 rounded-md flex flex-col"
            >
              <h3 className="font-semibold">{item.title}</h3>
              <Icon strokeWidth=".5px" size={140} />
              <p className="text-xs text-muted text-center">
                {item.description}
              </p>
              <Link
                href={item.link}
                className="bg-accent text-white px-3 py-1.5 rounded-md text-xs mt-2 hover:bg-foreground/30"
              >
                {item.buttonText}
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
