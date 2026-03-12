"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Menu, X, ChevronDown, LogOut, User as UserIcon } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { IoMdPerson } from "react-icons/io";
export default function Navbar() {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
 const router = useRouter();
  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUser(user);

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("avatar_url")
          .eq("id", user.id)
          .single();

        if (profile?.avatar_url) {
          setAvatarUrl(profile.avatar_url);
        }
      }
    };

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("avatar_url")
          .eq("id", currentUser.id)
          .single();

        if (profile?.avatar_url) {
          setAvatarUrl(profile.avatar_url);
        }
      } else {
        setAvatarUrl(null);
      }
    });

    // Scroll detection for glassmorphism effect
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    
    return () => {
      subscription.unsubscribe();
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsProfileOpen(false);
  };

  const navlinks = [
    { title: "Home", link: "/" },
    { title: "PYQs", link: "/mock-tests" },
    { title: "Materials", link: "/materials" },
    { title: "Notice", link: "/notice" },
  ];

  const getInitials = () => {
    if (user?.user_metadata?.display_name) {
      return user.user_metadata.display_name.charAt(0).toUpperCase();
    }
    return user?.email?.charAt(0).toUpperCase() || "U";
  };

  const getDisplayName = () => {
    return user?.user_metadata?.display_name || user?.email?.split("@")[0] || "User";
  };

  return (
    <>
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-5xl transition-all duration-500 ${
          isScrolled 
            ? "bg-white/80 backdrop-blur-xl shadow-lg shadow-black/5" 
            : "bg-white/60 backdrop-blur-md"
        } rounded-full border border-white/20`}
      >
        <nav className="flex items-center justify-between px-4 py-2.5 md:px-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative h-8 w-8 md:h-9 md:w-9 overflow-hidden rounded-lg flex items-center justify-center">
              <Image src="/logo.svg" alt="logo" width={100} height={100} />
            </div>
            <span className="hidden sm:block text-slate-900 text-sm md:text-base tracking-tight">
              Uniprep
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1 bg-slate-100/50 rounded-full p-1">
            {navlinks.map((item, index) => (
              <Link
                key={index}
                href={item.link}
                className="relative px-4 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors duration-200 rounded-full hover:bg-white/60"
              >
                {item.title}
              </Link>
            ))}
          </div>

          {/* User Actions */}
          <div className="flex items-center gap-2">
            {user ? (
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors duration-200"
                >
                  <div className="h-7 w-7 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                    {avatarUrl ? (
                      <Image
                        src={avatarUrl}
                        alt="avatar"
                        width={28}
                        height={28}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      getInitials()
                    )}
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-slate-700 max-w-[100px] truncate">
                    {getDisplayName()}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${isProfileOpen ? "rotate-180" : ""}`} />
                </motion.button>

                {/* Profile Dropdown */}
                <AnimatePresence>
                  {isProfileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl shadow-black/10 border border-slate-100 overflow-hidden"
                    >
                      <div className="p-3 border-b border-slate-100">
                        <p className="text-sm font-semibold text-slate-900 truncate">{getDisplayName()}</p>
                        <p className="text-xs text-slate-500 truncate" onClick={()=>router.push("/profile")}>{user.email}</p>
                      </div>
                      <div className="p-1 flex flex-col justify-center items-center">
                        <Link className="flex w-full gap-2 items-center justify-start hover:bg-neutral-100 duration-300 px-3 py-2" href="/profile"><IoMdPerson />Profile</Link>
                        <button
                          onClick={handleLogout}
                          className="w-full flex border-t border-t-neutral-100 items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link
                href="/auth"
                className="group relative inline-flex items-center gap-1.5 px-5 py-2 text-sm text-white bg-linear-to-br from-blue-500 to-blue-600 rounded-full overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-slate-900/25 hover:-translate-y-0.5"
              >
                <span className="relative z-10">Get Started</span>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-600"
                  initial={{ x: "100%" }}
                  whileHover={{ x: 0 }}
                  transition={{ duration: 0.3 }}
                />
              </Link>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-full hover:bg-slate-100 transition-colors duration-200"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5 text-slate-700" />
              ) : (
                <Menu className="w-5 h-5 text-slate-700" />
              )}
            </button>
          </div>
        </nav>
      </motion.header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
            />
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="fixed top-20 left-4 right-4 bg-white rounded-3xl shadow-2xl shadow-black/10 border border-slate-100 z-50 md:hidden overflow-hidden"
            >
              <div className="p-4 space-y-1">
                {navlinks.map((item, index) => (
                  <Link
                    key={index}
                    href={item.link}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center px-4 py-3 text-base font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-2xl transition-colors duration-200"
                  >
                    {item.title}
                  </Link>
                ))}
                
                {!user && (
                  <div className="pt-2 mt-2 border-t border-slate-100">
                    <Link
                      href="/auth"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-center w-full px-4 py-3 text-base font-medium text-white bg-linear-to-br from-blue-500 to-blue-600 rounded-2xl transition-colors duration-200"
                    >
                      Get Started
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Spacer for fixed header */}
      <div className="h-20" />
    </>
  );
}