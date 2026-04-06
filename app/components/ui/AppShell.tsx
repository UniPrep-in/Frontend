"use client";

import Footer from "@/app/components/Footer";
import Navbar from "@/app/components/ui/Navbar";
import { usePathname } from "next/navigation";

type AppShellProps = {
  children: React.ReactNode;
};

function shouldShowFooter(pathname: string) {
  if (pathname.startsWith("/auth")) {
    return false;
  }

  if (/^\/mock-tests\/[^/]+(?:\/start)?$/.test(pathname)) {
    return false;
  }

  return true;
}

function shouldShowNavbar(pathname: string) {
  if (pathname.startsWith("/auth")) {
    return false;
  }

  if (pathname.startsWith("/footer")) {
    return false;
  }

  if (pathname.startsWith("/viewer")) {
    return false;
  }

  if (/^\/mock-tests\/[^/]+(?:\/start)?$/.test(pathname)) {
    return false;
  }

  return true;
}

function getNavbarBackdropClass(pathname: string) {
  if (
    pathname.startsWith("/notice") ||
    pathname.startsWith("/profile") ||
    /^\/attempts\/[^/]+\/(result|solutions)$/.test(pathname) ||
    /^\/mock-tests\/[^/]+\/leaderboard$/.test(pathname)
  ) {
    return "bg-neutral-100";
  }

  return "bg-white";
}

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname() ?? "/";
  const showFooter = shouldShowFooter(pathname);
  const showNavbar = shouldShowNavbar(pathname);
  const navbarBackdropClass = getNavbarBackdropClass(pathname);

  return (
    <div className="flex min-h-screen flex-col">
      {showNavbar ? (
        <div className={navbarBackdropClass}>
          <Navbar />
        </div>
      ) : null}
      <div className="flex-1">{children}</div>
      {showFooter ? <Footer /> : null}
    </div>
  );
}
