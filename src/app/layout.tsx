import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import CustomSessionProvider from "./SessionProvider";
import { ThemeProvider } from "@/components/ThemeProvider";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  manifest: "/manifest.json",
  metadataBase: new URL("https://www.mueblesyuny.com/"),
  title: {
    default: "MUEBLES YUNY | Muebles modernos restaurados de alta calidad",
    template: `%s | Mx MUEBLES YUNY`,
  },
  description: "Muebles modernos restaurados de alta calidad.",
};
export const viewport = {
  themeColor: "#0e192b",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <CustomSessionProvider>{children}</CustomSessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
