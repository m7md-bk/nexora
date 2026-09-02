import type { Metadata } from "next";
import { Geist, Noto_Kufi_Arabic } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geist = Geist({ variable: "--font-sans", subsets: ["latin"] });
const kufi = Noto_Kufi_Arabic({ variable: "--font-arabic", subsets: ["arabic"] });

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: { default: "Nexora | AI content for local businesses", template: "%s | Nexora" },
  description: "AI-powered social media content and digital marketing services built for ambitious local businesses in Jordan.",
  openGraph: { title: "Nexora", description: "Content that moves your business forward.", type: "website", url: appUrl },
  twitter: { card: "summary_large_image", title: "Nexora", description: "AI content and digital marketing for local businesses." },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geist.variable} ${kufi.variable} font-sans`}>
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
