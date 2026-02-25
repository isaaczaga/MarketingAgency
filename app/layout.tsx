import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI Marketing Agency",
  description: "Automated Content & Campaigns",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="h-full relative">
          <div className="hidden h-full md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 z-[80] bg-gray-900 border-r border-gray-800">
            <div className="text-white h-full bg-gray-900">
              <Sidebar className="text-white" />
            </div>
          </div>
          <main className="md:pl-72">
            <Header />
            {children}
          </main>
          <Toaster richColors position="top-right" />
        </div>
      </body>
    </html>
  );
}
