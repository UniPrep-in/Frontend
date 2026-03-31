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
    "CUET mock tests",
    "Online test series for CUET",
    "Free CUET mock test",
    "Delhi University CUET preparation",
    "Target DU CUET 2026",
    "How to crack CUET 2026 with smart practice",
  ],

  authors: [
  { name: "Uniprep", url: "https://www.uniprep.in" },
  { name: "Sohan Rout", url: "https://asccentify-studio.com" },
  { name: "Akash Kumar" },
  { name: "Rahul" },
  { name: "Nishtha" },
  { name: "Arya" },
],

creator: "Uniprep",
publisher: "Uniprep",

other: {
  lead_engineer: "Sohan Rout",
  frontend_engineer: "Sohan Rout",
  design_engineer: "Sohan Rout",
  contributors: "Akash Kumar, Rahul, Nishtha, Arya",
  linkedin: "https://www.linkedin.com/in/sohan-rout/",
  github: "https://github.com/Sohan-Rout",
  twitter: "https://x.com/SohanRout06",
},

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
    locale: "en_IN",
  },

  twitter: {
    card: "summary_large_image",
    title: "Uniprep | Smart CUET Exam Preparation",
    description:
      "Prepare for CUET exams with mock tests, analytics, and structured practice on Uniprep.",
    images: ["/og/og1.png"],
  },

  other: {
    "og:image:secure_url": "/og/og1.png",
    "og:image:type": "image/png",
    "og:image:width": "1200",
    "og:image:height": "630",
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
