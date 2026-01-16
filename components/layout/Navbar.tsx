'use client';

import { useHydrated } from '@/lib/hooks';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { GitBranch, Grid3X3, FileSearch, LogOut, Menu, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HelloCounselLogo } from '@/components/logo';
import { ThemeToggle } from '@/components/theme-toggle';
import { useCallDataStore } from '@/store/callDataStore';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';

const navItems = [
  { href: '/dashboard/flow', label: 'Flow Analysis', icon: GitBranch },
  { href: '/dashboard/heatmap', label: 'Heatmap Analysis', icon: Grid3X3 },
  { href: '/dashboard/deep-dive', label: 'Deep Dive', icon: FileSearch },
  { href: '/dashboard/info', label: 'Definitions', icon: BookOpen },
];

export function Navbar() {
  const hydrated = useHydrated();
  const pathname = usePathname();
  const router = useRouter();
  const { clearData, stats, dataSource } = useCallDataStore();

  const handleChangeData = () => {
    clearData();
    router.push('/');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-4 gap-4">
        {/* Logo - width matches sidebar on lg screens for tab alignment */}
        <Link href="/" className="flex items-center gap-2 shrink-0 lg:w-[calc(18rem-1rem)]">
          <HelloCounselLogo className="h-6" />
          <span className="hidden sm:inline-block text-sm font-medium text-muted-foreground">
            Analytics
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1 flex-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? 'secondary' : 'ghost'}
                  size="sm"
                  className={cn(
                    'gap-2',
                    isActive && 'bg-secondary'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </nav>

        {/* Mobile Navigation */}
        <div className="md:hidden flex-1">
          {hydrated ? (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64">
                <div className="flex items-center gap-2 mb-6">
                  <HelloCounselLogo className="h-6" />
                  <span className="text-sm font-medium">Analytics</span>
                </div>
                <nav className="flex flex-col gap-1">
                  {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link key={item.href} href={item.href}>
                        <Button
                          variant={isActive ? 'secondary' : 'ghost'}
                          className="w-full justify-start gap-2"
                        >
                          <item.icon className="h-4 w-4" />
                          {item.label}
                        </Button>
                      </Link>
                    );
                  })}
                </nav>
              </SheetContent>
            </Sheet>
          ) : (
            <Button variant="ghost" size="icon" disabled>
              <Menu className="h-5 w-5" />
            </Button>
          )}
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2">
          {stats && (
            <span className="hidden lg:inline-block text-xs text-muted-foreground">
              {stats.totalFiles} files • {dataSource}
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleChangeData}
            className="gap-2"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Change Data</span>
          </Button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
