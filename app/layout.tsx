import type { Metadata } from "next";
import "./globals.css";
import SmoothScrollProvider from "./components/ui/SmoothScrollProvider";
import { AuthProvider } from "@/providers/AuthProvider";
import { Comfortaa } from 'next/font/google';

const comfortaa = Comfortaa({
  subsets: ['latin'],
  weight: ['300','400','700'], // only valid weights
  style: ['normal'],  // enable italic
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.uniprep.in"),

  title: {
    default: "Uniprep | Smart CUET Exam Preparation Platform",
    template: "%s | Uniprep",
  },

  description:
    "Uniprep helps students prepare for CUET exam with mock tests, smart analytics, and structured learning tools designed for modern exam preparation.",

  keywords: [
    "exam preparation",
    "mock tests",
    "online test platform",
    "CUET preparation",
    "study platform",
    "student learning tools",
    "practice tests",
  ],

  authors: [{ name: "Uniprep" }],

  openGraph: {
    title: "Uniprep | Smart CUET Exam Preparation Platform",
    description:
      "Practice smarter with Uniprep. Take mock tests, analyze performance, and prepare efficiently for competitive exams.",
    url: "https://www.uniprep.in/",
    siteName: "Uniprep",
    type: "website",
    images: [
      {
        url: "/og/og1.png",
        width: 1200,
        height: 630,
        alt: "Uniprep – Smart CUET Exam Preparation",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Uniprep | Smart CUET Exam Preparation",
    description:
      "Prepare for CUET exams with mock tests, analytics, and structured practice on Uniprep.",
    images: ["/og/og1.png"],
  },

  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={comfortaa.className}>
      <body
        className="text-black"
      >
        <AuthProvider>
          <SmoothScrollProvider>
            {children}
          </SmoothScrollProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
