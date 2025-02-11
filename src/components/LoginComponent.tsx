"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { IoLogoGoogle } from "react-icons/io";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import Image from "next/image";

const LoginComponent = ({ cookie }: { cookie: any }) => {
  const { executeRecaptcha } = useGoogleReCaptcha();
  const session = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const [honeypot, setHoneypot] = useState("");

  useEffect(() => {
    if (session?.status === "authenticated") {
      router.replace("/");
    }
  }, [session, router]);

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    if (password === "" || email === "") {
      console.log("Fill all fields!");
      return;
    }

    if (password.length < 8) {
      console.log("Password must be at least 8 characters long");
      return;
    }
    if (!executeRecaptcha) {
      console.log("Execute recaptcha not available yet");

      return;
    }
    executeRecaptcha("enquiryFormSubmit").then(async (gReCaptchaToken) => {
      try {
        const res: any = await signIn("credentials", {
          email,
          password,
          recaptcha: gReCaptchaToken,
          honeypot,
          cookie,
        });

        if (res?.data?.success === true) {
          console.log(`Success with score: ${res?.data?.score}`);
        } else {
          console.log(`Failure with score: ${res?.data?.score}`);
        }

        if (res.status === 400) {
          console.log("This email is already in use");
        }
        if (res.ok) {
          console.log("Iniciar ");
          setTimeout(() => {
            router.push("/tienda");
          }, 200);
          return;
        }
      } catch (error) {
        console.log("Error occured while loggin");
        console.log(error);
      }
    });
  };

  return (
    <main className="flex  min-h-screen flex-col items-center justify-center ">
      <div className="flex items-center justify-center bg-gradient-to-br from-slate-600 to-slate-900 h-screen w-full">
        <div className="w-full flex items-center justify-center maxmdsm:hidden">
          <Image
            src={"/logos/logo_square_light.png"}
            alt="producto"
            width={500}
            height={500}
            className="w-[500px] h-auto"
          />
        </div>
        <div className="w-full bg-background h-screen p-20 maxsm:p-8 shadow-xl text-center text-primary mx-auto flex flex-col items-center justify-center">
          <h2 className="flex text-xs justify-center py-5 text-foreground">
            Iniciar Session
          </h2>

          <button
            className="w-auto px-8 hover:text-foreground rounded-md text-white hover:bg-slate-300 duration-500 ease-in-out text-xs bg-black mb-4 flex flex-row gap-4 items-center py-4 justify-center"
            onClick={() => {
              signIn("google");
            }}
          >
            <IoLogoGoogle />
            Iniciar con Google
          </button>
          <div className="text-center text-slate-900 mb-2 ">- o -</div>
          <form
            className="flex flex-col justify-center items-center text-center gap-y-4"
            onSubmit={handleSubmit}
          >
            <input
              className="text-center py-2 rounded-sm text-foreground"
              type="email"
              placeholder="Correo Electrónico..."
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              hidden
              className="text-center py-2 rounded-sm"
              type="text"
              placeholder="Honeypot"
              onChange={(e) => setHoneypot(e.target.value)}
            />
            <input
              className="text-center py-2 rounded-sm text-foreground"
              type="password"
              placeholder="contraseña..."
              onChange={(e) => setPassword(e.target.value)}
            />
            <button className="bg-accent text-xs text-white w-[150px] p-2 rounded-sm mt-5">
              Iniciar
            </button>
          </form>
          <Link
            className="text-[12px] text-center mt-3 text-foreground"
            href={`/registro`}
          >
            ¿Aun no tienes cuenta? <br /> Registrar aquí.
          </Link>
        </div>
      </div>
    </main>
  );
};

export default LoginComponent;
