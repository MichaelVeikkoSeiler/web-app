import type { Metadata } from "next";
import { Quicksand } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/layout/app-shell";

const quicksand = Quicksand({
  variable: "--font-quicksand",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "GartenApp",
  description: "Das digitale Gartenjournal für unsere Familie",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f7f5ef",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="de"
      className={`${quicksand.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-cream text-forest">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
