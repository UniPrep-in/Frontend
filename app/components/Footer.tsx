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
        { name: "For Teams", href: "#" },
      ],
    },
    {
      title: "Company",
      links: [
        { name: "About Us", href: "#" },
        { name: "Careers", href: "#" },
        { name: "Blog", href: "#" },
        { name: "Press", href: "#" },
      ],
    },
    {
      title: "Resources",
      links: [
        { name: "Help Center", href: "#" },
        { name: "Community", href: "#" },
        { name: "Contact", href: "#" },
        { name: "Partners", href: "#" },
      ],
    },
  ];

  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          
          {/* Left Side - Brand */}
          <div className="flex flex-col gap-6">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
              Uniprep.in
            </h2>
            <p className="text-gray-600 text-base md:text-lg max-w-md leading-relaxed">
              Empowering learners worldwide with expert-led courses and industry-recognized certificates. Start your journey today.
            </p>
            
            {/* Social Links */}
            <div className="flex gap-4">
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
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8">
            {navLinks.map((section) => (
              <div key={section.title} className="flex flex-col gap-4">
                <h3 className="font-semibold text-gray-900">
                  {section.title}
                </h3>
                <ul className="flex flex-col gap-3">
                  {section.links.map((link) => (
                    <li key={link.name}>
                      <Link
                        href={link.href}
                        className="text-gray-600 hover:text-gray-900 text-sm transition-colors"
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
        <div className="mt-12 pt-8 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-sm">
            © 2026 Uniprep. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link href="#" className="text-gray-500 hover:text-gray-900 text-sm transition-colors">
              Privacy Policy
            </Link>
            <Link href="#" className="text-gray-500 hover:text-gray-900 text-sm transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}