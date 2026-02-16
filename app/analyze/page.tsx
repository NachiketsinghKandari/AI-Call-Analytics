'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Upload, Building2, Scale, Phone, ArrowRight, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FolderUploader } from '@/components/data/FolderUploader';
import { useCallDataStore } from '@/store/callDataStore';
import { AppLogo } from '@/components/logo';
import { ThemeToggle } from '@/components/theme-toggle';

type DataSourceLoading = 'none' | 'sample' | 'mccraw' | 'vapi';

export default function AnalyzePage() {
  const router = useRouter();
  const { files, dataSource, setLoading, setFiles, setDataSource, setError } = useCallDataStore();
  const [loadingSource, setLoadingSource] = useState<DataSourceLoading>('none');

  // Redirect to flow analysis if data is loaded
  useEffect(() => {
    if (files.length > 0 && dataSource !== 'none') {
      router.push('/analyze/flow');
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
      router.push('/analyze/flow');
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
      {/* Header */}
      <header className="flex items-center justify-between p-4">
        <Link href="/">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </Link>
        <ThemeToggle />
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <AppLogo className="text-2xl" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-3">
            Select Data Source
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose a pre-loaded firm dataset or upload your own call data for analysis.
          </p>
        </div>

        {/* Data Source Options */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {/* Bey & Associates */}
          <Card className="relative overflow-hidden p-4 flex flex-col hover:shadow-md transition-shadow">
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
          <Card className="relative overflow-hidden p-4 flex flex-col hover:shadow-md transition-shadow">
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

          {/* VAPI */}
          <Card className="relative overflow-hidden p-4 flex flex-col hover:shadow-md transition-shadow">
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

          {/* Upload */}
          <Card className="relative overflow-hidden p-4 flex flex-col hover:shadow-md transition-shadow">
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
      </div>
    </main>
  );
}
