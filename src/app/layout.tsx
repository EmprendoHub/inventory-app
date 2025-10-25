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
    default: "YUNUEN COMPANY | Punto de Venta",
    template: `%s | Mx YUNUEN COMPANY`,
  },
  description: "Punto de Venta - YUNUEN COMPANY",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "YUNUEN CO",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: "/icons/yunuencompany-icon-192x192.png",
    apple: "/icons/yunuencompany-icon-192x192.png",
  },
};
export const viewport = {
  themeColor: "#0e192b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
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
