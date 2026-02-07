import type { Metadata } from "next";
import "leaflet/dist/leaflet.css";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "SuiStride",
  description: "Next-Gen Fitness App on Sui",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased min-h-screen bg-background text-foreground">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}