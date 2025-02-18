import { Navbar } from "./Navbar";
import { Navigation } from "./Navigation";
import { Analytics } from '@vercel/analytics/react';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex">
        {/* Menu desktop */}
        <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 lg:top-14">
          <div className="flex flex-col flex-grow border-r border-border bg-card px-4 py-6">
            <Navigation />
          </div>
        </div>
        <div className="lg:pl-64 flex flex-col flex-1">
          <main className="flex-1">
            {children}
            <Analytics />
          </main>
        </div>
      </div>
    </div>
  );
}
