import { Link, useLocation } from "wouter";
import { Show, useClerk, useUser } from "@clerk/react";
import { Button } from "@/components/ui/button";
import { Server, User, LogOut, ChevronDown, PackageSearch, PenTool, LayoutDashboard } from "lucide-react";
import logoPath from "@assets/GPU-dealer-horizontal-logo_1786904302883.png";

export function Navbar() {
  const [location] = useLocation();
  const { signOut } = useClerk();
  const { user } = useUser();
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

  const isActive = (path: string) => location.startsWith(path) && path !== "/" || (path === "/" && location === "/");

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex flex-shrink-0 items-center gap-2 mr-8">
              <img src={logoPath} alt="GPUDealer" className="h-8 w-auto" />
            </Link>

            <div className="hidden md:flex md:space-x-1">
              <Link 
                href="/gpus" 
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/gpus') ? 'bg-secondary text-secondary-foreground' : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'}`}
              >
                Browse Hardware
              </Link>
              <Link 
                href="/sell" 
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/sell') ? 'bg-secondary text-secondary-foreground' : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'}`}
              >
                Sell Hardware
              </Link>
              <Link 
                href="/request" 
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/request') ? 'bg-secondary text-secondary-foreground' : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'}`}
              >
                Request Hardware
              </Link>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Show when="signed-out">
              <Link href="/sign-in" className="text-sm font-medium text-muted-foreground hover:text-foreground hidden sm:block">
                Sign In
              </Link>
              <Link href="/sell">
                <Button size="sm" variant="default" className="font-semibold shadow-sm">
                  List Hardware
                </Button>
              </Link>
            </Show>

            <Show when="signed-in">
              <Link href="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground hidden sm:flex items-center gap-2">
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>
              
              <div className="h-4 w-px bg-border hidden sm:block"></div>
              
              <div className="flex items-center gap-2 text-sm font-medium">
                <span className="truncate max-w-[120px] text-foreground hidden sm:block">
                  {user?.primaryEmailAddress?.emailAddress || user?.fullName || 'User'}
                </span>
                <Button variant="ghost" size="icon" onClick={() => signOut({ redirectUrl: basePath || "/" })} title="Sign Out">
                  <LogOut className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            </Show>
          </div>
        </div>
      </div>
    </nav>
  );
}
