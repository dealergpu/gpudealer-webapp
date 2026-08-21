import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border bg-card mt-auto">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <img src="/gpu-dealer-logo-white.svg" alt="GPUDealer" className="h-7 w-auto mb-4" />
            <p className="text-sm text-muted-foreground mb-4 max-w-xs">
              The premier marketplace for used AI compute hardware, data center components, and professional GPUs.
            </p>
            <p className="text-sm font-medium font-heading text-foreground">
              Find. Sell. Request.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold text-foreground mb-4">Marketplace</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/gpus?category=gpu" className="hover:text-accent transition-colors">Browse GPUs</Link></li>
              <li><Link href="/gpus?category=server" className="hover:text-accent transition-colors">Server Racks</Link></li>
              <li><Link href="/gpus?category=memory" className="hover:text-accent transition-colors">Memory & Storage</Link></li>
              <li><Link href="/sell" className="hover:text-accent transition-colors">Sell Your Hardware</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-foreground mb-4">Requests</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/request" className="hover:text-accent transition-colors">Submit Request</Link></li>
              <li><Link href="/gpus" className="hover:text-accent transition-colors">View Active Requests</Link></li>
              <li><Link href="/dashboard" className="hover:text-accent transition-colors">Manage Requests</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-foreground mb-4">Account</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/sign-in" className="hover:text-accent transition-colors">Sign In</Link></li>
              <li><Link href="/sign-up" className="hover:text-accent transition-colors">Create Account</Link></li>
              <li><Link href="/dashboard" className="hover:text-accent transition-colors">Dashboard</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} GPUDealer Marketplace. All rights reserved.
          </p>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <span className="hover:text-foreground cursor-pointer">Terms of Service</span>
            <span className="hover:text-foreground cursor-pointer">Privacy Policy</span>
            <span className="hover:text-foreground cursor-pointer">Trust & Safety</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
