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
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="YUNUEN CO" />
        <meta name="apple-mobile-web-app-title" content="YUNUEN CO" />
        <meta name="msapplication-starturl" content="/" />
        <link
          rel="icon"
          type="image/png"
          sizes="192x192"
          href="/icons/yunuencompany-icon-192x192.png"
        />
        <link
          rel="apple-touch-icon"
          sizes="192x192"
          href="/icons/yunuencompany-icon-192x192.png"
        />
      </head>
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
