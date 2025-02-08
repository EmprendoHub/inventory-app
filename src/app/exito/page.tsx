import React from "react";
import Link from "next/link";
import { getCookiesName } from "@/lib/utils";
import { cookies } from "next/headers";
import EmailVerification from "@/components/EmailVerification";
import GoogleCaptchaWrapper from "@/components/GoogleCaptchaWrapper";

const verifyEmail = async (token: string) => {
  const nextCookies = cookies();
  const cookieName = getCookiesName();
  const nextAuthSessionToken = nextCookies.get(cookieName);
  const URL = `${process.env.NEXTAUTH_URL}/api/verify`;
  try {
    const res = await fetch(URL, {
      method: "POST",
      headers: {
        Cookie: `${cookieName}=${nextAuthSessionToken?.value}`,
        Token: token,
      },
    });
    const data = res.json();
    return data;
  } catch (error) {
    console.log(error);
  }
};

const SuccessPage = async ({ searchParams }: { searchParams: any }) => {
  const token = searchParams?.token;
  const res = await verifyEmail(token);
  const isVerified = res?.message === "Email verificado";
  return (
    <>
      <div
        className={
          "bg-background h-[80vh] flex items-center justify-center text-center mx-auto"
        }
      >
        {isVerified ? (
          <div className="w-[90%]">
            <p className="font-raleway text-slate-500 text-lg mt-3">
              Tu correo fue verificado exitosamente
            </p>
            <h2 className="text-7xl font-EB_Garamond">Gracias</h2>

            <h3 className="font-EB_Garamond text-2xl mt-3">
              Por registrarte con Yunuen Company
            </h3>
            <p className="text-base text-slate-600 mt-5">
              Ya puedes iniciar tu session.
            </p>
            <div className="flex maxsm:flex-col gap-4 items-center gap-x-5 justify-center mt-10">
              <Link href={"/iniciar"}>
                <button className="bg-black text-xs text-slate-100 hover:text-foreground w-44 h-12 rounded-md font-semibold hover:bg-gray-200 duration-500">
                  iniciar tu session.
                </button>
              </Link>
            </div>
          </div>
        ) : (
          <GoogleCaptchaWrapper>
            <EmailVerification />
          </GoogleCaptchaWrapper>
        )}
      </div>
    </>
  );
};

export default SuccessPage;
