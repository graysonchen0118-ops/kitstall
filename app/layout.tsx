import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import { Shell } from "@/components/Shell";

const nunito = Nunito({ subsets: ["latin", "latin-ext"], weight: ["400", "600", "700", "800", "900"] });

export const metadata: Metadata = {
  title: { default: "Kitstall | Digital goods from independent makers", template: "%s | Kitstall" },
  description: "Templates, kits, presets, sounds and small business agents from independent makers. Every listing is written once from the maker's own facts and confirmed by them.",
};

export const viewport: Viewport = {
  themeColor: "#5b3fd9",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={nunito.className}>
        <StoreProvider>
          <Shell>{children}</Shell>
        </StoreProvider>
      </body>
    </html>
  );
}
