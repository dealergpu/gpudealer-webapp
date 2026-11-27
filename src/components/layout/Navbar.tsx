'use client';

import { useCallback, useEffect, useRef, useState } from "react";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { useI18n } from "@/i18n/client";
import { fmt } from "@/i18n/format";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { AnimatePresence, motion } from "framer-motion";
import { Bookmark, ChevronDown, KeyRound, LayoutDashboard, LogOut, Menu, Pencil, UserRound, X } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useI18n();
  const links = [
    { href: "/gpus", label: t.nav.findHardware },
    { href: "/sell", label: t.nav.sellHardware },
    { href: "/request", label: t.nav.requestHardware },
    { href: "/compute", label: t.nav.compareCompute },
  ];
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
        aria-label={t.nav.mainLabel}
        className={cn(
          "mx-auto border text-foreground transition-[max-width,border-radius,background-color,border-color,box-shadow] duration-500 ease-out",
          floating
            ? "max-w-5xl rounded-[28px] border-foreground/10 bg-background/75 shadow-[0_18px_50px_-20px_hsl(240_10%_4%/0.45)] backdrop-blur-xl backdrop-saturate-150"
            : "max-w-[1600px] rounded-none border-transparent bg-transparent"
        )}
      >
        <div className={cn("flex items-center justify-between px-4 transition-[height] duration-500 sm:px-6", floating ? "h-14" : "h-18 lg:px-8")}>
          <div className="flex items-center gap-8">
            <Link href="/" className="relative flex shrink-0 items-center" aria-label={t.nav.homeLabel}>
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
            <LanguageSwitcher compact className="hidden lg:flex" />
            {!user ? (
              <>
                <Link
                  href="/sign-in"
                  className="hidden rounded-full px-3.5 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground sm:block"
                >
                  {t.nav.signIn}
                </Link>
                <Button asChild size="sm" className="hidden sm:inline-flex">
                  <Link href="/sell">{t.nav.listHardware}</Link>
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
                  {t.nav.dashboard}
                </Link>
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="hidden sm:inline-flex" aria-label={t.nav.accountMenu}>
                      <UserRound className="h-4 w-4" />
                      <span className="hidden max-w-40 truncate lg:inline">{user.email || t.nav.account}</span>
                      <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-60">
                    <DropdownMenuLabel className="font-normal">
                      <p className="text-xs text-muted-foreground">{t.nav.signedInAs}</p>
                      <p className="truncate text-sm font-medium" title={user.email ?? undefined}>
                        {user.email || t.nav.account}
                      </p>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/saved">
                        <Bookmark className="mr-2 h-4 w-4" /> {t.nav.savedListings}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/account/profile">
                        <Pencil className="mr-2 h-4 w-4" /> {t.nav.editProfile}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/account/api-keys">
                        <KeyRound className="mr-2 h-4 w-4" /> {t.nav.apiKeys}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={handleSignOut}>
                      <LogOut className="mr-2 h-4 w-4" /> {t.nav.logOut}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              aria-label={menuOpen ? t.nav.closeMenu : t.nav.openMenu}
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
                {[
                  ...links,
                  ...(user
                    ? [
                        { href: "/dashboard", label: t.nav.dashboard },
                        { href: "/saved", label: t.nav.savedListings },
                        { href: "/account/profile", label: t.nav.editProfile },
                        { href: "/account/api-keys", label: t.nav.apiKeys },
                      ]
                    : [{ href: "/sign-in", label: t.nav.signIn }]),
                ].map((link) => (
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
                    <>
                      {user.email && (
                        <p className="mb-2 truncate px-4 text-sm text-muted-foreground">{fmt(t.nav.signedInAsEmail, { email: user.email })}</p>
                      )}
                      <Button variant="outline" className="w-full" onClick={handleSignOut}>
                        <LogOut className="h-4 w-4" />
                        {t.nav.logOut}
                      </Button>
                    </>
                  ) : (
                    <Button asChild className="w-full">
                      <Link href="/sell" onClick={() => setMenuOpen(false)}>{t.nav.listHardware}</Link>
                    </Button>
                  )}
                </motion.li>
                <motion.li variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }} className="mt-2 flex justify-center">
                  <LanguageSwitcher />
                </motion.li>
              </motion.ul>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </div>
  );
}
