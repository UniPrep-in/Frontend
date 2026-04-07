"use client";

import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Menu, X, ChevronDown, LogOut, Mail, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";

const navlinks = [
  { title: "Home", link: "/" },
  { title: "Mocks", link: "/mock-tests" },
  { title: "Materials", link: "/materials" },
  { title: "Lectures", link: "/lectures" },
  { title: "Notice", link: "/notice" },
];

export default function Navbar() {
  const supabase = useMemo(() => createClient(), []);
  const { user, profile, isAuthLoading } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    navlinks.forEach((item) => {
      router.prefetch(item.link);
    });
  }, [router]);

  // Close profile menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    if (isProfileOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isProfileOpen]);

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    setIsProfileOpen(false);
    router.push("/auth");
  }, [supabase.auth, router]);

  const displayName = useMemo(
    () => user?.user_metadata?.display_name || user?.email?.split("@")[0] || "User",
    [user]
  );
  const profileImageUrl = useMemo(() => {
    const metadata = user?.user_metadata as
      | {
          avatar_url?: string | null;
          picture?: string | null;
        }
      | undefined;

    return metadata?.avatar_url || metadata?.picture || profile?.avatar_url || null;
  }, [profile?.avatar_url, user?.user_metadata]);

  return (
    <>
      <div
        className="fixed inset-x-0 top-4 z-50 flex justify-center px-4"
      >
        <motion.header
          className={`w-full max-w-5xl rounded-full border border-white/20 transition-all duration-500 ${
            isScrolled
              ? "bg-white/80 shadow-lg shadow-black/5 backdrop-blur-xl"
              : "bg-white/60 backdrop-blur-md"
          }`}
        >
          <nav className="flex items-center justify-between px-4 py-2.5 md:px-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <span className="block text-slate-900 text-sm md:text-base tracking-tight font-medium">
              Uniprep.in
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1 bg-slate-100/50 rounded-full p-1">
            {navlinks.map((item) => (
              <Link
                key={item.link}
                href={item.link}
                prefetch
                className="relative rounded-full px-4 py-1.5 text-sm font-medium text-slate-600 transition-colors duration-200 hover:bg-white/60 hover:text-slate-900"
              >
                {item.title}
              </Link>
            ))}
          </div>

          {/* User Actions */}
          <div className="flex items-center gap-2">
            {isAuthLoading ? (
              <div className="flex h-9 w-[148px] items-center justify-center rounded-full bg-slate-100 px-3">
                <div className="h-2.5 w-14 animate-pulse rounded-full bg-slate-200" />
              </div>
            ) : user ? (
              <div ref={profileMenuRef} className="relative">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex w-[148px] items-center justify-between rounded-full bg-slate-100 py-1 pl-1 pr-3 transition-colors duration-200 hover:bg-slate-200"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-sm">
                    {profileImageUrl ? (
                      <img
                        src={profileImageUrl}
                        alt={displayName}
                        className="h-full w-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <User className="h-4 w-4" />
                    )}
                  </div>
                  <span className="hidden flex-1 px-2 text-sm font-medium text-slate-700 sm:block truncate">
                    {displayName}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${
                      isProfileOpen ? "rotate-180" : ""
                    }`}
                  />
                </motion.button>

                {/* Profile Dropdown */}
                <AnimatePresence>
                  {isProfileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 top-full mt-3 w-64 origin-top-right rounded-2xl border border-slate-200 bg-white p-2 shadow-xl"
                    >
                      <div className="rounded-xl border border-slate-200/80 bg-gradient-to-br from-slate-50 via-white to-blue-50 px-4 py-3 shadow-sm">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {displayName}
                        </p>
                        <div className="mt-1.5 flex items-center gap-2 text-xs text-slate-500">
                          <Mail className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{user.email}</span>
                        </div>
                      </div>

                      <div className="mt-2 flex flex-col gap-1">
                        <Link
                          href="/profile"
                          className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors duration-200 hover:bg-slate-100"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <span className="flex items-center gap-2.5">
                            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                              <User className="h-4 w-4" />
                            </span>
                            Profile
                          </span>
                          <span className="text-xs uppercase tracking-wider text-slate-400">
                            Open
                          </span>
                        </Link>

                        <button
                          onClick={handleLogout}
                          className="flex w-full items-center gap-2.5 rounded-xl border border-rose-100 px-3 py-2.5 text-sm font-medium text-rose-600 transition-colors duration-200 hover:bg-rose-50"
                        >
                          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50 text-rose-500">
                            <LogOut className="h-4 w-4" />
                          </span>
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
                className="group relative inline-flex items-center gap-1.5 px-5 py-2 text-sm font-medium text-white bg-gradient-to-br from-blue-500 to-blue-600 rounded-full overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/25 hover:-translate-y-0.5"
              >
                <span className="relative z-10">Get Started</span>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-600"
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
              aria-label="Toggle menu"
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
      </div>

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
                {navlinks.map((item) => (
                  <Link
                    key={item.link}
                    href={item.link}
                    prefetch
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center rounded-2xl px-4 py-3 text-base font-medium text-slate-700 transition-colors duration-200 hover:bg-slate-50 hover:text-slate-900"
                  >
                    {item.title}
                  </Link>
                ))}

                {!user && (
                  <div className="pt-2 mt-2 border-t border-slate-100">
                    <Link
                      href="/auth"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-center w-full px-4 py-3 text-base font-medium text-white bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl transition-colors duration-200"
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
