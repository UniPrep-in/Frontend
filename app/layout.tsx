import type { Metadata } from "next";
import "./globals.css";
import SmoothScrollProvider from "./components/ui/SmoothScrollProvider";
import { AuthProvider, type AuthProfile } from "@/providers/AuthProvider";
import { createClient } from "@/lib/supabase/server";

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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let initialProfile: AuthProfile | null = null;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("avatar_url, phone, plan_id, payment_status")
      .eq("id", user.id)
      .maybeSingle();

    initialProfile = profile
      ? {
          avatar_url: profile.avatar_url ?? null,
          phone: profile.phone ?? null,
          plan_id: profile.plan_id ?? null,
          payment_status: profile.payment_status ?? null,
        }
      : null;
  }

  return (
    <html lang="en">
      <body className="text-black">
        <AuthProvider initialUser={user ?? null} initialProfile={initialProfile}>
          <SmoothScrollProvider>
            {children}
          </SmoothScrollProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
