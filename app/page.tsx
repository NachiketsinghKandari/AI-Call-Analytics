'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Upload, Building2, Scale, Phone, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FolderUploader } from '@/components/data/FolderUploader';
import { useCallDataStore } from '@/store/callDataStore';
import { HelloCounselLogo } from '@/components/logo';
import { ThemeToggle } from '@/components/theme-toggle';

type DataSourceLoading = 'none' | 'sample' | 'mccraw' | 'vapi';

export default function HomePage() {
  const router = useRouter();
  const { files, dataSource, setLoading, setFiles, setDataSource, setError } = useCallDataStore();
  const [loadingSource, setLoadingSource] = useState<DataSourceLoading>('none');

  // Redirect to dashboard if data is loaded
  useEffect(() => {
    if (files.length > 0 && dataSource !== 'none') {
      router.push('/dashboard/flow');
    }
  }, [files, dataSource, router]);

  const handleLoadData = async (source: 'sample' | 'mccraw' | 'vapi') => {
    setLoadingSource(source);
    setLoading(true);
    setError(null);

    const endpoints = {
      sample: '/api/sample-data',
      mccraw: '/api/mccraw-data',
      vapi: '/api/vapi-data',
    };

    try {
      const response = await fetch(endpoints[source]);
      if (!response.ok) {
        throw new Error(`Failed to load ${source} data`);
      }
      const data = await response.json();
      setFiles(data.files);
      setDataSource(source);
      router.push('/dashboard/flow');
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to load ${source} data`);
      setLoadingSource('none');
    } finally {
      setLoading(false);
    }
  };

  const isLoading = loadingSource !== 'none';

  return (
    <main className="min-h-screen bg-background">
      {/* Header with theme toggle */}
      <header className="absolute top-4 right-4">
        <ThemeToggle />
      </header>

      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <HelloCounselLogo className="h-10" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-3">
            Call Analysis
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Visual analytics and deep-dive tools for call resolution data.
            Explore call flows, analyze patterns, and dive into individual transcripts.
          </p>
        </div>

        {/* Data Source Options */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {/* Bey & Associates (Sample Data) */}
          <Card className="relative overflow-hidden p-4 flex flex-col">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-500" />
                <CardTitle className="text-base">Bey & Associates</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Sample call data from Bey & Associates law firm with full transcripts.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 flex flex-col items-center justify-center flex-1">
              <Button
                size="default"
                onClick={() => handleLoadData('sample')}
                disabled={isLoading}
                className="gap-2 w-full"
              >
                {loadingSource === 'sample' ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    Load Data
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground mt-3 text-center">
                1,000+ call records
              </p>
            </CardContent>
          </Card>

          {/* McCraw Law */}
          <Card className="relative overflow-hidden p-4 flex flex-col">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Scale className="h-5 w-5 text-amber-500" />
                <CardTitle className="text-base">McCraw Law</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Call data from McCraw Law with Gemini-generated transcripts and analysis.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 flex flex-col items-center justify-center flex-1">
              <Button
                size="default"
                onClick={() => handleLoadData('mccraw')}
                disabled={isLoading}
                className="gap-2 w-full"
              >
                {loadingSource === 'mccraw' ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    Load Data
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground mt-3 text-center">
                486 call records
              </p>
            </CardContent>
          </Card>

          {/* VAPI Data */}
          <Card className="relative overflow-hidden p-4 flex flex-col">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-green-500" />
                <CardTitle className="text-base">VAPI</CardTitle>
              </div>
              <CardDescription className="text-xs">
                VAPI call records with AI-generated analysis and full transcripts.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 flex flex-col items-center justify-center flex-1">
              <Button
                size="default"
                onClick={() => handleLoadData('vapi')}
                disabled={isLoading}
                className="gap-2 w-full"
              >
                {loadingSource === 'vapi' ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    Load Data
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground mt-3 text-center">
                730 call records
              </p>
            </CardContent>
          </Card>

          {/* Upload Folder */}
          <Card className="relative overflow-hidden p-4 flex flex-col">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-purple-500" />
                <CardTitle className="text-base">Upload Data</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Select a folder with JSON metadata and TXT transcripts.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <FolderUploader compact />
            </CardContent>
          </Card>
        </div>

        {/* Features */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-semibold mb-8">Features</h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="p-4">
              <h3 className="font-semibold mb-2">Interactive Sankey Diagram</h3>
              <p className="text-sm text-muted-foreground">
                Visualize call flows from resolution status through types, transfer outcomes, and destinations.
              </p>
            </div>
            <div className="p-4">
              <h3 className="font-semibold mb-2">Multi-Dimensional Heatmaps</h3>
              <p className="text-sm text-muted-foreground">
                Explore correlations between resolution types, caller types, and primary intents.
              </p>
            </div>
            <div className="p-4">
              <h3 className="font-semibold mb-2">7-Axis Filtering</h3>
              <p className="text-sm text-muted-foreground">
                Filter by resolution type, status, caller, intent, transfer outcome, duration, and multi-case.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
