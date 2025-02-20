"use client";
import { UserType } from "@/types/users";
import { useSession } from "next-auth/react";
import Link from "next/link";
import React from "react";
import { BiQuestionMark } from "react-icons/bi";

export default function SalesHeader({
  title,
  link,
  btn,
}: {
  title?: string;
  link?: string;
  btn?: string;
}) {
  const { data: session } = useSession();
  const user = session?.user as UserType;

  return (
    <div className="flex w-full items-center justify-between">
      <h2 className="text-base capitalize">{title}</h2>{" "}
      <div className="flex items-center gap-3">
        {["SUPER_ADMIN", "GERENTE"].includes(user?.role || "") && (
          <Link
            href={`/sistema/${link}`}
            className="flex gap-2 items-center text-white bg-accent rounded-md py-1.5 px-2 text-xs hover:bg-blue-900"
          >
            + {btn}
          </Link>
        )}

        <button className="bg-blue-500 text-white p-1 rounded-md">
          <BiQuestionMark />
        </button>
      </div>
    </div>
  );
}
