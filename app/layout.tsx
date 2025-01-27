import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";
import { TooltipProvider } from "@/components/ui/tooltip"

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Dailo Podcast Generator",
  description: "AI-powered platform for creating podcast-style conversations",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <TooltipProvider>
          <Navigation />
          {children}
        </TooltipProvider>
      </body>
    </html>
  );
}
