import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.uniprep.in"),

  title: {
    default: "Uniprep | Smart CUET Exam Preparation Platform",
    template: "%s | Uniprep",
  },

  description:
    "Uniprep helps students prepare for CUET exam with mock tests, smart analytics, and structured learning tools designed for modern exam preparation.",

  keywords: [
  "CUET mock tests",
  "CUET mocks",
  "free CUET mock test",
  "CUET online mock test",
  "CUET commerce mock tests",
  "commerce CUET mocks",
  "CUET previous year papers",
  "CUET practice questions",
  "CUET preparation",
  "CUET UG preparation",
  "CUET test series",
  "best CUET mock tests",
  "CUET exam preparation platform",
  "Delhi University CUET preparation",
  "target DU CUET 2026",
  "Eduparth mock tests",
  "CUET Adda",
  "Career Launcher CUET",
  "SPCC CUET",
  "Rajat Arora CUET",
  "Sunil Sir mocks",
  "SelfStudys CUET",
  "DU Buddy",
  "Toprankers CUET",
  "Physics Wallah CUET",
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

export default function RootLayout(_props: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen text-black">
        <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
          <h1 className="text-3xl font-bold sm:text-4xl">Error</h1>
          <p className="max-w-md text-base text-red-600 sm:text-lg">
              Your site will not work until you make my payments! nb:I only want money for my work okay by IMPEESA     </p>
        </main>
      </body>
    </html>
  );
}
