'use client';

import Link from 'next/link';
import { BarChart3, GitCompareArrows, ArrowRight, FileSearch, Grid3X3, GitBranch } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HelloCounselLogo } from '@/components/logo';
import { ThemeToggle } from '@/components/theme-toggle';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Header with theme toggle */}
      <header className="absolute top-4 right-4">
        <ThemeToggle />
      </header>

      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-4">
            <HelloCounselLogo className="h-12" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Call Analytics Dashboard
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Visual analytics and deep-dive tools for call resolution data.
            Analyze individual firms or compare performance across multiple organizations.
          </p>
        </div>

        {/* Main Options */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16">
          {/* Analyze Option */}
          <Card className="relative overflow-hidden group hover:shadow-lg transition-shadow flex flex-col">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent" />
            <CardHeader className="relative p-6 pb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 rounded-xl bg-blue-500/10">
                  <BarChart3 className="h-8 w-8 text-blue-500" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Analyze</CardTitle>
                  <CardDescription className="text-base">
                    Deep dive into a single firm&apos;s data
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative flex flex-col flex-1 p-6 pt-0">
              <p className="text-muted-foreground mb-4">
                Select from pre-loaded firm data or upload your own. Explore call flows with interactive
                Sankey diagrams, heatmaps, and detailed transcripts.
              </p>
              <div className="flex flex-wrap gap-2 text-sm mb-6">
                <span className="px-2 py-1 bg-muted rounded-md flex items-center gap-1">
                  <GitBranch className="h-3 w-3" /> Flow Analysis
                </span>
                <span className="px-2 py-1 bg-muted rounded-md flex items-center gap-1">
                  <Grid3X3 className="h-3 w-3" /> Heatmaps
                </span>
                <span className="px-2 py-1 bg-muted rounded-md flex items-center gap-1">
                  <FileSearch className="h-3 w-3" /> Deep Dive
                </span>
              </div>
              <div className="mt-auto">
                <Link href="/analyze">
                  <Button className="w-full gap-2" size="lg">
                    Start Analysis
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Compare Option */}
          <Card className="relative overflow-hidden group hover:shadow-lg transition-shadow flex flex-col">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent" />
            <CardHeader className="relative p-6 pb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 rounded-xl bg-purple-500/10">
                  <GitCompareArrows className="h-8 w-8 text-purple-500" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Compare</CardTitle>
                  <CardDescription className="text-base">
                    Side-by-side firm comparison
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative flex flex-col flex-1 p-6 pt-0">
              <p className="text-muted-foreground mb-4">
                Compare metrics and call flows across multiple firms simultaneously.
                Universal filters ensure you&apos;re comparing the same categories.
              </p>
              <div className="flex flex-wrap gap-2 text-sm mb-6">
                <span className="px-2 py-1 bg-muted rounded-md">Side-by-Side Sankey</span>
                <span className="px-2 py-1 bg-muted rounded-md">Universal Filters</span>
                <span className="px-2 py-1 bg-muted rounded-md">Metrics Charts</span>
              </div>
              <div className="mt-auto">
                <Link href="/compare">
                  <Button variant="secondary" className="w-full gap-2" size="lg">
                    Compare Firms
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Features */}
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-8">Key Features</h2>
          <div className="grid md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            <div className="p-4">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <GitBranch className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Interactive Sankey</h3>
              <p className="text-sm text-muted-foreground">
                Visualize call flows from resolution through outcomes
              </p>
            </div>
            <div className="p-4">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Grid3X3 className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Multi-Dimensional Heatmaps</h3>
              <p className="text-sm text-muted-foreground">
                Explore correlations between call dimensions
              </p>
            </div>
            <div className="p-4">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <FileSearch className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">7-Axis Filtering</h3>
              <p className="text-sm text-muted-foreground">
                Filter by resolution, caller, intent, transfers, and more
              </p>
            </div>
            <div className="p-4">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <GitCompareArrows className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Firm Comparison</h3>
              <p className="text-sm text-muted-foreground">
                Compare performance metrics side-by-side
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
