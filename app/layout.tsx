import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CareerPilot AI — Your AI Career Copilot",
  description: "From resume analysis to your next opportunity. Powered by Lyzr Career Compass Director.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full bg-[#07090C] text-white">
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 min-w-0 bg-[#07090C]">{children}</main>
        </div>
      </body>
    </html>
  );
}
