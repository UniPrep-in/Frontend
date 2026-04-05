import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.uniprep.in"),

  title: {
    default: "CUET Notes, PYQs & Flashcards",
    template: "%s | Uniprep",
  },

  description:
    "Access CUET notes, PYQs, flashcards, important words, and study materials for commerce and other subjects. Learn smarter with structured resources on Uniprep.",

  keywords: [
    "CUET notes",
    "CUET PYQs",
    "CUET flashcards",
    "CUET study materials",
    "commerce CUET notes",
    "commerce PYQs",
    "CUET previous year questions",
    "CUET previous year papers",
    "important CUET words",
    "CUET vocabulary flashcards",
    "CUET study resources",
    "CUET exam preparation",
    "Delhi University CUET preparation",
    "CUET commerce preparation",
    "CUET notes pdf",
    "free CUET notes",
    "CUET question bank",
    "CUET practice material",
    "flashcards for CUET",
    "Uniprep study materials",
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
    title: "Uniprep | CUET Notes, PYQs & Flashcards",
    description:
      "Explore CUET notes, PYQs, flashcards, and structured study materials to prepare smarter with Uniprep.",
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
    title: "Uniprep | CUET Notes, PYQs & Flashcards",
    description:
      "Access CUET notes, previous year questions, flashcards, and study materials on Uniprep.",
    images: ["/og/og1.png"],
  },


  icons: {
    icon: "/favicon.ico",
  },
};

export default function MaterialsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
