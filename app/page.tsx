'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Upload, Database, Phone, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FolderUploader } from '@/components/data/FolderUploader';
import { useCallDataStore } from '@/store/callDataStore';
import { HelloCounselLogo } from '@/components/logo';
import { ThemeToggle } from '@/components/theme-toggle';

export default function HomePage() {
  const router = useRouter();
  const { files, dataSource, setLoading, setFiles, setDataSource, setError } = useCallDataStore();
  const [isLoadingSample, setIsLoadingSample] = useState(false);
  const [isLoadingVapi, setIsLoadingVapi] = useState(false);

  // Redirect to dashboard if data is loaded
  useEffect(() => {
    if (files.length > 0 && dataSource !== 'none') {
      router.push('/dashboard/flow');
    }
  }, [files, dataSource, router]);

  const handleLoadSampleData = async () => {
    setIsLoadingSample(true);
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/sample-data');
      if (!response.ok) {
        throw new Error('Failed to load sample data');
      }
      const data = await response.json();
      setFiles(data.files);
      setDataSource('sample');
      router.push('/dashboard/flow');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sample data');
      setIsLoadingSample(false);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadVapiData = async () => {
    setIsLoadingVapi(true);
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/vapi-data');
      if (!response.ok) {
        throw new Error('Failed to load VAPI data');
      }
      const data = await response.json();
      setFiles(data.files);
      setDataSource('vapi');
      router.push('/dashboard/flow');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load VAPI data');
      setIsLoadingVapi(false);
    } finally {
      setLoading(false);
    }
  };

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
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {/* Upload Folder */}
          <Card className="relative overflow-hidden p-4">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-primary" />
                <CardTitle>Upload Your Data</CardTitle>
              </div>
              <CardDescription>
                Select a folder containing JSON metadata and TXT transcript files.
                Supports nested folders.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <FolderUploader compact />
            </CardContent>
          </Card>

          {/* Sample Data */}
          <Card className="relative overflow-hidden p-4">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                <CardTitle>Try Sample Data</CardTitle>
              </div>
              <CardDescription>
                Explore the dashboard with pre-loaded sample call data to see
                all features in action.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 flex flex-col items-center justify-center flex-1">
              <Button
                size="lg"
                onClick={handleLoadSampleData}
                disabled={isLoadingSample}
                className="gap-2"
              >
                {isLoadingSample ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    Load Sample Data
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground mt-4 text-center">
                1,000+ real call records with transcripts
              </p>
            </CardContent>
          </Card>

          {/* VAPI Data */}
          <Card className="relative overflow-hidden p-4">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-primary" />
                <CardTitle>Load VAPI Data</CardTitle>
              </div>
              <CardDescription>
                Explore 730 analyzed VAPI call records with full transcripts
                and AI analysis.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 flex flex-col items-center justify-center flex-1">
              <Button
                size="lg"
                onClick={handleLoadVapiData}
                disabled={isLoadingVapi}
                className="gap-2"
              >
                {isLoadingVapi ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    Load VAPI Data
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground mt-4 text-center">
                730 call records with AI analysis
              </p>
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
