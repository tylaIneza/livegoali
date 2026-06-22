import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from "react-hot-toast";
import { WatchtimeTracker } from "@/components/WatchtimeTracker";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "LiveGoali - Watch Football Live. Anytime. Anywhere.",
    template: "%s | LiveGoali",
  },
  description:
    "Stream live football matches, get AI predictions, real-time stats, lineups, and live commentary. The best football streaming platform.",
  keywords: ["football", "live streaming", "soccer", "predictions", "Premier League", "Champions League"],
  authors: [{ name: "LiveGoali" }],
  creator: "LiveGoali",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: "LiveGoali",
    title: "LiveGoali - Watch Football Live. Anytime. Anywhere.",
    description: "Stream live football matches with AI predictions and real-time stats.",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "LiveGoali",
    description: "Watch Football Live. Anytime. Anywhere.",
    images: ["/og-image.jpg"],
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} dark`} suppressHydrationWarning>
      <body className="min-h-screen bg-[#0B0F14] text-white antialiased">
        <Providers>
          <WatchtimeTracker />
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "#121821",
                color: "#fff",
                border: "1px solid rgba(255,255,255,0.1)",
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
