"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import { JSX, PropsWithChildren } from "react";

const CustomSessionProvider = ({
  children,
}: PropsWithChildren): JSX.Element => {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>;
};

export default CustomSessionProvider;
