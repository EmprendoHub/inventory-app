"use client";
import React from "react";
import Link from "next/link";
import { SALES_ITEMS } from "@/app/constants";
import { iconMap } from "@/lib/utils";
import { FaCashRegister } from "react-icons/fa";
import { useSession } from "next-auth/react";
import { UserType } from "@/types/users";

export default function SalesDashboard() {
  const { data: session } = useSession();
  const user = session?.user as UserType;
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 maxmd:grid-cols-2 gap-6 maxsm:grid-cols-1">
        {SALES_ITEMS.map((item, index) => {
          const Icon = iconMap[item.iconName];

          return (
            <div
              key={index}
              className="shadow-xl items-center bg-card p-8 rounded-md flex flex-col"
            >
              <Link href={item.linkAll} className="flex flex-col items-center">
                <h3 className="font-semibold">{item.title}</h3>
                <Icon strokeWidth=".5px" size={100} />
                <p className="text-xs text-muted text-center">
                  {item.description}
                </p>
              </Link>
              {item.buttonText.length > 0 && (
                <Link
                  href={item.link}
                  className="bg-accent text-white px-3 py-1.5 rounded-md text-xs mt-2 hover:bg-foreground/30"
                >
                  {item.buttonText}
                </Link>
              )}
            </div>
          );
        })}
        <div className="shadow-xl items-center bg-card p-8 rounded-md flex flex-col">
          <Link
            href={`/sistema/cajas/personal/${user?.id}`}
            className="flex flex-col items-center"
          >
            <h3 className="font-semibold">Caja</h3>
            <FaCashRegister strokeWidth=".5px" size={100} />
            <p className="text-xs text-muted text-center mt-5">
              Revisa tus ultimas transacciones.
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
