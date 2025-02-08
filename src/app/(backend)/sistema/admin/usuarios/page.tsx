import prisma from "@/lib/db";
import React from "react";
import { UserList } from "./_components/UserList";
import AdminHeader from "../_components/AdminHeader";
import { getServerSession } from "next-auth";
import { options } from "@/app/api/auth/[...nextauth]/options";
import { UserType } from "@/types/users";

export default async function ListUsers() {
  const session = await getServerSession(options);

  console.log(session.user);
  // Calculate total stock for each item
  let users: UserType[];
  if (session.user.role === "GERENTE") {
    console.log("winner***********************************");

    users = await prisma.user.findMany({
      where: {
        role: { notIn: ["SUPER_ADMIN", "ADMIN"] },
      },
      orderBy: {
        createdAt: "desc", // Latest product
      },
    });
  } else if (session.user.role === "ADMIN") {
    users = await prisma.user.findMany({
      where: {
        role: { notIn: ["SUPER_ADMIN"] },
      },
      orderBy: {
        createdAt: "desc", // Latest product
      },
    });
  } else {
    users = await prisma.user.findMany({
      orderBy: {
        createdAt: "desc", // Latest product
      },
    });
  }

  return (
    <div className="flex flex-col items-start justify-start bg-white">
      <AdminHeader title={"Usuarios"} link={`usuarios/nuevo`} />
      <UserList users={users} />
    </div>
  );
}
