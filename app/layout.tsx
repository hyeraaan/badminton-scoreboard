import type { Metadata } from "next";
import { Noto_Sans_KR, Press_Start_2P } from "next/font/google";
import "./globals.css";
import "nes.css/css/nes.min.css";

const notoSansKr = Noto_Sans_KR({
  variable: "--font-noto-sans-kr",
  subsets: ["latin"],
  weight: ["100", "300", "400", "500", "700", "900"],
});
const pressStart2P = Press_Start_2P({
  variable: "--font-press-start-2p",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "BADMINTON SCOREBOARD",
  description: "Professional Badminton Scoreboard PWA",
  manifest: "/manifest.json",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${notoSansKr.variable} ${pressStart2P.variable} ${notoSansKr.className}`}>
        {children}
      </body>
    </html>
  );
}
