import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { PaymentRequiredProvider } from "@/components/PaymentRequiredProvider";
import { RateLimitProvider } from "@/components/RateLimitProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PossiNote Dashboard",
  description: "Customer dashboard for managing PossiNote API keys and monitoring usage",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-gray-900 text-white`}>
        <PaymentRequiredProvider>
          <RateLimitProvider>
            {children}
          </RateLimitProvider>
        </PaymentRequiredProvider>
      </body>
    </html>
  );
}
