import type { Metadata } from "next";
import "leaflet/dist/leaflet.css";
import "./globals.css";
import { Providers } from "./providers";
import BottomNav from "@/components/bottom-nav";

export const metadata: Metadata = {
  title: "SuiStride",
  description: "Next-Gen Fitness App on Sui",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased min-h-screen bg-background text-foreground">
        <Providers>
          {children}
          <BottomNav />
        </Providers>
      </body>
    </html>
  );
}