'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { LogOut, LayoutDashboard } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const isActive = (path: string) =>
    (pathname.startsWith(path) && path !== "/") || (path === "/" && pathname === "/");

  const navLink = (path: string) => {
    const active = isActive(path);
    return `px-4 py-2 rounded-full text-sm font-medium transition-colors ${
      scrolled
        ? active
          ? "bg-black/[0.07] text-neutral-900"
          : "text-neutral-600 hover:bg-black/[0.05] hover:text-neutral-900"
        : active
          ? "glass-subtle text-foreground"
          : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
    }`;
  };

  const sideLink =
    "hidden rounded-full px-3 py-2 text-sm font-medium transition-colors sm:block " +
    (scrolled
      ? "text-neutral-600 hover:bg-black/[0.05] hover:text-neutral-900"
      : "text-muted-foreground hover:bg-white/5 hover:text-foreground");

  return (
    <div
      className={`sticky top-0 z-50 w-full transition-[padding] duration-500 ease-out ${
        scrolled ? "px-3 pt-3 sm:px-6" : "px-0 pt-0"
      }`}
    >
      <nav
        className={`relative mx-auto flex items-center overflow-hidden transition-[max-width,height,border-radius] duration-500 ease-out ${
          scrolled ? "h-14 max-w-5xl rounded-full" : "h-16 max-w-[1600px] rounded-none"
        }`}
      >
        {/* Flat bar, visible at the top of the page */}
        <div
          className={`absolute inset-0 border-b border-border bg-background/90 backdrop-blur-md transition-opacity duration-500 ${
            scrolled ? "opacity-0" : "opacity-100"
          }`}
        />
        {/* Floating liquid-glass pill, faded in once scrolled */}
        <div
          className={`absolute inset-0 glass-strong transition-opacity duration-500 ${
            scrolled ? "opacity-100" : "opacity-0"
          }`}
        />

        <div className="relative z-10 flex w-full items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center">
            <Link href="/" className="mr-8 flex flex-shrink-0 items-center gap-2">
              <img
                src={scrolled ? "/gpu-dealer-logo.svg" : "/gpu-dealer-logo-white.svg"}
                alt="GPUDealer"
                className={`w-auto transition-all duration-500 ${scrolled ? "h-6" : "h-7"}`}
              />
            </Link>

            <div className="hidden md:flex md:items-center md:gap-1">
              <Link href="/gpus" className={navLink("/gpus")}>
                Browse Hardware
              </Link>
              <Link href="/sell" className={navLink("/sell")}>
                Sell Hardware
              </Link>
              <Link href="/request" className={navLink("/request")}>
                Request Hardware
              </Link>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {!user ? (
              <>
                <Link href="/sign-in" className={sideLink}>
                  Sign In
                </Link>
                <Link href="/sell">
                  <Button size="sm" variant="default" className="font-semibold">
                    List Hardware
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/dashboard" className={`${sideLink} hidden items-center gap-2 sm:flex`}>
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>

                <div className={`hidden h-4 w-px sm:block ${scrolled ? "bg-black/10" : "bg-white/10"}`}></div>

                <div className="flex items-center gap-2 text-sm font-medium">
                  <span
                    className={`hidden max-w-[120px] truncate sm:block ${
                      scrolled ? "text-neutral-900" : "text-foreground"
                    }`}
                  >
                    {user.email || 'User'}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleSignOut}
                    title="Sign Out"
                    className={scrolled ? "text-neutral-600 hover:text-neutral-900" : undefined}
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </nav>
    </div>
  );
}
