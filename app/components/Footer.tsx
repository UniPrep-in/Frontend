import Link from "next/link";
import { RiInstagramFill } from "react-icons/ri";
import { FaLinkedin } from "react-icons/fa6";
import { FaTelegram } from "react-icons/fa";
import { FaSquareWhatsapp } from "react-icons/fa6";
import { FaYoutube } from "react-icons/fa6";

export default function Footer() {
  const socialLinks = [
    {
      name: "Telegram",
      href: "https://t.me/uniprep2026",
      icon: <FaTelegram className="text-2xl"/>,
    },
    {
      name: "Whatsapp",
      href: "https://chat.whatsapp.com/JHuRh0vIRx00WxkRw3Ds3Q",
      icon: <FaSquareWhatsapp className="text-2xl"/>,
    },
    {
      name: "Youtube",
      href: "https://youtube.com/@uniprepicuetug?si=EwO5NmM8RZHZIK6V",
      icon: <FaYoutube className="text-2xl"/>,
    },
    {
      name: "LinkedIn",
      href: "https://www.linkedin.com/company/uniprep-lea",
      icon: <FaLinkedin className="text-2xl"/>,
    },
    {
      name: "Instagram",
      href: "https://www.instagram.com/uniprep.cuet?igsh=MWRoNDE3emQxcTZweA==",
      icon: <RiInstagramFill className="text-2xl"/>,
    },
  ];

  const navLinks = [
    {
      title: "Product",
      links: [
        { name: "Courses", href: "#" },
        { name: "Pricing", href: "#" },
        { name: "Certificates", href: "#" },
      ],
    },
    {
      title: "Company",
      links: [
        { name: "About Us", href: "/footer/about-us" },
        { name: "Contact Us", href: "/footer/contact-us" },
        { name: "Careers", href: "#" },
        { name: "Blog", href: "#" },
      ],
    },
    {
      title: "Legal",
      links: [
        { name: "Privacy Policy", href: "/footer/privacy-policy" },
        { name: "Terms & Conditions", href: "/footer/terms-and-conditions" },
        { name: "Refund Policy", href: "/footer/refund-policy" },
      ],
    },
  ];

  return (
    <footer className="bg-black border-t">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12">
          
          {/* Left Side - Brand */}
          <div className="flex flex-col gap-5">
            <h2 className="text-2xl md:text-3xl font-bold text-white">
              Uniprep.in
            </h2>
            <p className="text-neutral-300 text-base md:text-md max-w-md leading-relaxed">
              Our study materials are carefully curated by CUET rankers, ensuring you learn exactly what matters - nothing extra, nothing missing.
            </p>
            
            {/* Social Links */}
            <div className="flex flex-wrap gap-3">
              {socialLinks.map((social) => (
                <Link
                  key={social.name}
                  href={social.href}
                  className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label={social.name}
                >
                  {social.icon}
                </Link>
              ))}
            </div>
          </div>

          {/* Right Side - Nav Links */}
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 sm:gap-8">
            {navLinks.map((section) => (
              <div key={section.title} className="flex flex-col gap-3">
                <h3 className="font-semibold text-white">
                  {section.title}
                </h3>
                <ul className="flex flex-col gap-2.5">
                  {section.links.map((link) => (
                    <li key={link.name}>
                      <Link
                        href={link.href}
                        className="text-neutral-400 hover:text-neutral-500 text-sm transition-colors"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-gray-200 pt-6 sm:flex-row">
          <div className="text-gray-500 text-sm flex flex-col items-center sm:items-start text-center sm:text-left">
            <p>© 2026 RankersEdge Learning. All rights reserved.</p>
            <p>UniPrep is a platform operated by RankersEdge Learning</p>
          </div>
          <div className="flex flex-wrap justify-center gap-5">
            <Link href="/footer/privacy-policy" className="text-gray-500 hover:text-gray-900 text-sm transition-colors">
              Privacy Policy
            </Link>
            <Link href="/footer/terms-and-conditions" className="text-gray-500 hover:text-gray-900 text-sm transition-colors">
              Terms & Conditions
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
