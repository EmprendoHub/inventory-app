import prisma from "@/lib/db";
import { getMexicoGlobalUtcDate } from "@/lib/utils";
import { NextResponse } from "next/server";

export async function POST(request: any) {
  const cookie = await request.headers.get("cookie");
  const token = await request.headers.get("token");
  if (!cookie) {
    // Not Signed in
    const notAuthorized = "You are not authorized no no no";
    return new Response(JSON.stringify(notAuthorized), {
      status: 400,
    });
  }
  try {
    const verifiedUser = await prisma.user.findUnique({
      where: {
        verificationToken: token,
      },
    });
    const createdAt = getMexicoGlobalUtcDate();
    if (verifiedUser) {
      await prisma.user.update({
        where: { id: verifiedUser.id },
        data: {
          active: true,
          updatedAt: createdAt,
        },
      });

      return NextResponse.json(
        { message: "Email verificado" },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { message: "Email no verificado" },
        { status: 200 }
      );
    }
  } catch (error: any) {
    console.log(error);

    return NextResponse.json(
      { message: "No se pudo verificar el correo electrónico" },
      { status: 500 }
    );
  }
}
