'use client';

import { useState } from 'react';
import { useHydrated } from '@/lib/hooks';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { GitBranch, Grid3X3, FileSearch, LogOut, Menu, BookOpen, Building2, Scale, Phone, Upload, ChevronDown, Loader2, MoreVertical, Moon, Sun, ChevronsUpDown, BarChart3, GitCompareArrows } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HelloCounselLogo } from '@/components/logo';
import { useCallDataStore } from '@/store/callDataStore';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const navItems = [
  { href: '/analyze/flow', label: 'Flow Analysis', icon: GitBranch },
  { href: '/analyze/heatmap', label: 'Heatmap Analysis', icon: Grid3X3 },
  { href: '/analyze/deep-dive', label: 'Deep Dive', icon: FileSearch },
  { href: '/analyze/info', label: 'Definitions', icon: BookOpen },
];

const dataSources = [
  { id: 'sample', label: 'Bey & Associates', icon: Building2, color: 'text-blue-500', endpoint: '/api/sample-data' },
  { id: 'mccraw', label: 'McCraw Law', icon: Scale, color: 'text-amber-500', endpoint: '/api/mccraw-data' },
  { id: 'vapi', label: 'VAPI', icon: Phone, color: 'text-green-500', endpoint: '/api/vapi-data' },
] as const;

type DataSourceId = typeof dataSources[number]['id'];

export function Navbar() {
  const hydrated = useHydrated();
  const pathname = usePathname();
  const router = useRouter();
  const { setTheme } = useTheme();
  const { clearData, stats, dataSource, setFiles, setDataSource, setLoading, setError } = useCallDataStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoadingSource, setIsLoadingSource] = useState<DataSourceId | null>(null);

  const handleChangeData = () => {
    clearData();
    router.push('/');
  };

  const handleUploadData = () => {
    clearData();
    router.push('/analyze');
  };

  const handleLoadSource = async (sourceId: DataSourceId) => {
    const source = dataSources.find(s => s.id === sourceId);
    if (!source) return;

    setIsLoadingSource(sourceId);
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(source.endpoint);
      if (!response.ok) {
        throw new Error(`Failed to load ${source.label} data`);
      }
      const data = await response.json();
      setFiles(data.files);
      setDataSource(sourceId);
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to load ${source.label} data`);
    } finally {
      setLoading(false);
      setIsLoadingSource(null);
    }
  };

  const currentSource = dataSources.find(s => s.id === dataSource);
  const CurrentIcon = currentSource?.icon || Building2;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background">
      <div className="flex h-14 items-center px-4 gap-4">
        {/* Logo + Mode Switcher - width matches sidebar on lg screens */}
        <div className="flex items-center gap-2 shrink-0 lg:w-[calc(18rem-1rem)]">
          <Link href="/" className="flex items-center shrink-0">
            <HelloCounselLogo className="h-6" />
          </Link>

          {/* Mode Switcher */}
          {hydrated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground hover:text-foreground">
                  <BarChart3 className="h-4 w-4" />
                  <span className="hidden sm:inline">Analyze</span>
                  <ChevronsUpDown className="h-3 w-3 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuItem className="gap-2 bg-accent">
                  <BarChart3 className="h-4 w-4" />
                  Analyze
                  <span className="ml-auto text-xs text-muted-foreground">Active</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/compare')} className="gap-2">
                  <GitCompareArrows className="h-4 w-4" />
                  Compare
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground" disabled>
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Analyze</span>
              <ChevronsUpDown className="h-3 w-3 opacity-50" />
            </Button>
          )}
        </div>

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
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64">
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                <div className="flex items-center gap-2 mb-6">
                  <HelloCounselLogo className="h-6" />
                  <span className="text-sm font-medium">Analytics</span>
                </div>
                <nav className="flex flex-col gap-1">
                  {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Button
                          variant={isActive ? 'secondary' : 'ghost'}
                          className="w-full justify-start gap-2 h-11"
                        >
                          <item.icon className="h-4 w-4" />
                          {item.label}
                        </Button>
                      </Link>
                    );
                  })}
                </nav>

                {/* Mobile Data Source Selector */}
                <div className="mt-6 pt-6 border-t">
                  <p className="text-xs text-muted-foreground mb-2 px-2">Data Source</p>
                  <div className="flex flex-col gap-1">
                    {dataSources.map((source) => {
                      const isActive = dataSource === source.id;
                      const isLoading = isLoadingSource === source.id;
                      return (
                        <Button
                          key={source.id}
                          variant={isActive ? 'secondary' : 'ghost'}
                          className="w-full justify-start gap-2 h-11"
                          onClick={() => {
                            if (!isActive) handleLoadSource(source.id);
                            setMobileMenuOpen(false);
                          }}
                          disabled={isLoadingSource !== null}
                        >
                          {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <source.icon className={cn("h-4 w-4", source.color)} />
                          )}
                          {source.label}
                        </Button>
                      );
                    })}
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-2 h-11"
                      onClick={() => {
                        handleUploadData();
                        setMobileMenuOpen(false);
                      }}
                    >
                      <Upload className="h-4 w-4 text-purple-500" />
                      Upload Data
                    </Button>
                  </div>
                </div>

                {/* Mobile Settings */}
                <div className="mt-6 pt-6 border-t">
                  <p className="text-xs text-muted-foreground mb-2 px-2">Settings</p>
                  <div className="flex flex-col gap-1">
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-2 h-11"
                      onClick={() => {
                        setTheme('light');
                        setMobileMenuOpen(false);
                      }}
                    >
                      <Sun className="h-4 w-4" />
                      Light Mode
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-2 h-11"
                      onClick={() => {
                        setTheme('dark');
                        setMobileMenuOpen(false);
                      }}
                    >
                      <Moon className="h-4 w-4" />
                      Dark Mode
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-2 h-11 text-red-500 hover:text-red-600"
                      onClick={() => {
                        handleChangeData();
                        setMobileMenuOpen(false);
                      }}
                    >
                      <LogOut className="h-4 w-4" />
                      Exit
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          ) : (
            <Button variant="ghost" size="icon" className="h-10 w-10" disabled>
              <Menu className="h-5 w-5" />
            </Button>
          )}
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2">
          {/* Data Source Dropdown */}
          {hydrated && stats && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 hidden sm:flex min-w-[140px] lg:min-w-[180px]">
                  {isLoadingSource ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CurrentIcon className={cn("h-4 w-4", currentSource?.color)} />
                  )}
                  <span className="hidden lg:inline">{currentSource?.label || 'Select Data'}</span>
                  <span className="lg:hidden">{stats.totalFiles}</span>
                  <ChevronDown className="h-3 w-3 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {dataSources.map((source) => {
                  const isActive = dataSource === source.id;
                  const isLoading = isLoadingSource === source.id;
                  return (
                    <DropdownMenuItem
                      key={source.id}
                      onClick={() => !isActive && handleLoadSource(source.id)}
                      className={cn("gap-2", isActive && "bg-accent")}
                      disabled={isLoadingSource !== null}
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <source.icon className={cn("h-4 w-4", source.color)} />
                      )}
                      {source.label}
                      {isActive && <span className="ml-auto text-xs text-muted-foreground">Active</span>}
                    </DropdownMenuItem>
                  );
                })}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleUploadData} className="gap-2">
                  <Upload className="h-4 w-4 text-purple-500" />
                  Upload Data
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Stats badge for mobile */}
          {stats && (
            <span className="sm:hidden text-xs text-muted-foreground">
              {stats.totalFiles}
            </span>
          )}

          {/* 3-dot overflow menu */}
          {hydrated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setTheme('light')} className="gap-2">
                  <Sun className="h-4 w-4" />
                  Light Mode
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('dark')} className="gap-2">
                  <Moon className="h-4 w-4" />
                  Dark Mode
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleChangeData} className="gap-2 text-red-500 focus:text-red-500">
                  <LogOut className="h-4 w-4" />
                  Exit
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="ghost" size="icon" className="h-9 w-9" disabled>
              <MoreVertical className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
