// app/layout.tsx
import type { Metadata } from "next";
import { Manrope, Bebas_Neue } from "next/font/google";
import "./globals.css";
import { CartProvider } from "../context/CartContext"; // <-- Ruta corregida

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });
const bebas = Bebas_Neue({ weight: "400", subsets: ["latin"], variable: "--font-bebas" });

export const metadata: Metadata = {
  title: "Menú Digital | Webild POS",
  description: "Menú interactivo y optimizado para altas conversiones.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className="h-full antialiased scroll-smooth">
      <body className={`${manrope.variable} ${bebas.variable} font-sans w-full relative min-h-screen pb-32`}>
        <div className="noise-overlay"></div>
        <CartProvider>
          {children}
        </CartProvider>
      </body>
    </html>
  );
}