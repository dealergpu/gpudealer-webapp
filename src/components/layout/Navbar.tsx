'use client';

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { LayoutDashboard, LogOut, Menu, X } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const links = [
  { href: "/gpus", label: "Find Hardware" },
  { href: "/sell", label: "Sell Hardware" },
  { href: "/request", label: "Request Hardware" },
];

const EASE = [0.16, 1, 0.3, 1] as const;

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const navRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const [onDark, setOnDark] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Pages mark dark bands with `data-nav="dark"`; the bar matches whichever
  // band is currently underneath it, so it reads cleanly on either palette.
  const syncWithPage = useCallback(() => {
    setScrolled(window.scrollY > 24);
    const probe = document
      .elementsFromPoint(window.innerWidth / 2, 36)
      .find((el) => !navRef.current?.contains(el));
    setOnDark(probe?.closest("[data-nav]")?.getAttribute("data-nav") === "dark");
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", syncWithPage, { passive: true });
    window.addEventListener("resize", syncWithPage);
    return () => {
      window.removeEventListener("scroll", syncWithPage);
      window.removeEventListener("resize", syncWithPage);
    };
  }, [syncWithPage]);

  useEffect(() => {
    const frame = requestAnimationFrame(syncWithPage);
    return () => cancelAnimationFrame(frame);
  }, [pathname, syncWithPage]);

  const handleSignOut = async () => {
    setMenuOpen(false);
    await signOut();
    router.push("/");
  };

  const isActive = (path: string) => pathname.startsWith(path);
  const floating = scrolled || menuOpen;

  return (
    <div
      ref={navRef}
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-[padding] duration-500 ease-out",
        floating ? "px-3 pt-3 sm:px-6" : "px-0 pt-0",
        onDark && "dark"
      )}
    >
      <nav
        aria-label="Main"
        className={cn(
          "mx-auto border text-foreground transition-[max-width,border-radius,background-color,border-color,box-shadow] duration-500 ease-out",
          floating
            ? "max-w-5xl rounded-[28px] border-foreground/10 bg-background/75 shadow-[0_18px_50px_-20px_hsl(240_10%_4%/0.45)] backdrop-blur-xl backdrop-saturate-150"
            : "max-w-[1600px] rounded-none border-transparent bg-transparent"
        )}
      >
        <div className={cn("flex items-center justify-between px-4 transition-[height] duration-500 sm:px-6", floating ? "h-14" : "h-18 lg:px-8")}>
          <div className="flex items-center gap-8">
            <Link href="/" className="relative flex shrink-0 items-center" aria-label="GPUDealer home">
              <img
                src="/gpu-dealer-logo.svg"
                alt=""
                className={cn("w-auto transition-all duration-500", floating ? "h-6" : "h-7", onDark && "opacity-0")}
              />
              <img
                src="/gpu-dealer-logo-white.svg"
                alt=""
                className={cn("absolute left-0 w-auto transition-all duration-500", floating ? "h-6" : "h-7", !onDark && "opacity-0")}
              />
            </Link>

            <div className="hidden items-center gap-1 md:flex">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "relative rounded-full px-3.5 py-2 text-sm transition-colors",
                    isActive(link.href) ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {isActive(link.href) && (
                    <motion.span
                      layoutId="nav-active"
                      className="absolute inset-0 rounded-full bg-foreground/[0.07]"
                      transition={{ duration: 0.5, ease: EASE }}
                    />
                  )}
                  <span className="relative">{link.label}</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!user ? (
              <>
                <Link
                  href="/sign-in"
                  className="hidden rounded-full px-3.5 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground sm:block"
                >
                  Sign in
                </Link>
                <Button asChild size="sm" className="hidden sm:inline-flex">
                  <Link href="/sell">List hardware</Link>
                </Button>
              </>
            ) : (
              <>
                <Link
                  href="/dashboard"
                  className={cn(
                    "hidden items-center gap-2 rounded-full px-3.5 py-2 text-sm transition-colors sm:flex",
                    isActive("/dashboard") ? "bg-foreground/[0.07] text-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>
                <span className="hidden max-w-40 truncate text-sm text-muted-foreground lg:block" title={user.email ?? undefined}>
                  {user.email || "Account"}
                </span>
                <Button variant="outline" size="sm" onClick={handleSignOut} className="hidden sm:inline-flex">
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
              </>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {menuOpen && (
            <motion.div
              id="mobile-menu"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.45, ease: EASE }}
              className="overflow-hidden md:hidden"
            >
              <motion.ul
                className="flex flex-col gap-1 px-4 pb-4"
                initial="hidden"
                animate="show"
                variants={{ show: { transition: { staggerChildren: 0.05, delayChildren: 0.05 } } }}
              >
                {[...links, ...(user ? [{ href: "/dashboard", label: "Dashboard" }] : [{ href: "/sign-in", label: "Sign in" }])].map((link) => (
                  <motion.li
                    key={link.href}
                    variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
                  >
                    <Link
                      href={link.href}
                      onClick={() => setMenuOpen(false)}
                      className={cn(
                        "block rounded-2xl px-4 py-3 font-display text-2xl transition-colors",
                        isActive(link.href) ? "bg-foreground/[0.07] text-foreground" : "text-foreground/80 hover:bg-foreground/4"
                      )}
                    >
                      {link.label}
                    </Link>
                  </motion.li>
                ))}
                <motion.li variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }} className="mt-2">
                  {user ? (
                    <Button variant="outline" className="w-full" onClick={handleSignOut}>
                      <LogOut className="h-4 w-4" />
                      Logout
                    </Button>
                  ) : (
                    <Button asChild className="w-full">
                      <Link href="/sell" onClick={() => setMenuOpen(false)}>List hardware</Link>
                    </Button>
                  )}
                </motion.li>
              </motion.ul>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </div>
  );
}
