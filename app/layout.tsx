import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TypeTheLyrics - Type Along with Your Favorite Songs",
  description: "Practice typing while following along with synchronized lyrics from your favorite Spotify songs. Test your typing speed and accuracy in a fun, musical way.",
  applicationName: "TypeTheLyrics",
  authors: [{ name: "Arjun Vijay Prakash" }],
  generator: "Next.js",
  keywords: ["typing", "lyrics", "music", "spotify", "typing practice", "typing game"],
  creator: "Arjun Vijay Prakash",
  publisher: "Arjun Vijay Prakash",
  openGraph: {
    title: "TypeTheLyrics - Type Along with Your Favorite Songs",
    description: "Practice typing while following along with synchronized lyrics from your favorite Spotify songs.",
    url: "https://typethelyrics.vercel.app",
    siteName: "TypeTheLyrics",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TypeTheLyrics - Type Along with Your Favorite Songs",
    description: "Practice typing while following along with synchronized lyrics from your favorite Spotify songs.",
    creator: "@arjuncodess",
  },
  category: "Technology",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Script
          defer
          data-domain="typethelyrics.vercel.app"
          src="https://getanalyzr.vercel.app/tracking-script.js"
        />
      </body>
    </html>
  );
}