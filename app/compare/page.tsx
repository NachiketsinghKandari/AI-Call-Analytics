'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { Building2, Scale, Phone, Upload, ArrowRight, ArrowLeft, Loader2, CheckCircle2, X, FolderOpen, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AppLogo } from '@/components/logo';
import { ThemeToggle } from '@/components/theme-toggle';
import { useCompareStore, FIRM_CONFIGS } from '@/store/compareStore';
import { cn } from '@/lib/utils';
import { processFiles } from '@/lib/parser';

// Extend input element to include webkitdirectory
declare module 'react' {
  interface InputHTMLAttributes<T> extends HTMLAttributes<T> {
    webkitdirectory?: string;
    directory?: string;
  }
}

const FIRM_ICONS: Record<string, LucideIcon> = {
  sample: Building2,
  mccraw: Scale,
  vapi: Phone,
  upload: Upload,
};

const FIRM_COLORS: Record<string, string> = {
  sample: 'text-blue-500',
  mccraw: 'text-amber-500',
  vapi: 'text-green-500',
  upload: 'text-purple-500',
};

const FIRM_BG_COLORS: Record<string, string> = {
  sample: 'bg-blue-500/10 border-blue-500/30',
  mccraw: 'bg-amber-500/10 border-amber-500/30',
  vapi: 'bg-green-500/10 border-green-500/30',
  upload: 'bg-purple-500/10 border-purple-500/30',
};

const FIRM_DESCRIPTIONS: Record<string, { description: string; count: string }> = {
  sample: { description: 'Sample call data from Bey & Associates law firm with full transcripts.', count: '1,000+ calls' },
  mccraw: { description: 'Call data from McCraw Law with Gemini-generated transcripts and analysis.', count: '486 calls' },
  vapi: { description: 'VAPI call records with AI-generated analysis and full transcripts.', count: '730 calls' },
};

// Format folder name to be more readable
// "McCrawLaw-analysis" -> "McCraw Law Analysis"
function formatFolderName(name: string): string {
  return name
    // Replace hyphens and underscores with spaces
    .replace(/[-_]/g, ' ')
    // Add space before capital letters (camelCase -> camel Case)
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    // Capitalize first letter of each word
    .replace(/\b\w/g, (c) => c.toUpperCase())
    // Clean up multiple spaces
    .replace(/\s+/g, ' ')
    .trim();
}

export default function ComparePage() {
  const router = useRouter();
  const {
    selectedFirmIds,
    toggleFirmSelection,
    loadAllSelectedFirms,
    clearComparison,
    uploadedConfigs,
    addUploadedData,
    removeUploadedData,
    firmData,
  } = useCompareStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  // Clear comparison state on mount
  useEffect(() => {
    clearComparison();
  }, [clearComparison]);

  // Handle file upload
  const handleUpload = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      if (fileArray.length === 0) return;

      setIsUploading(true);
      try {
        const processed = await processFiles(fileArray);
        if (processed.length === 0) {
          alert('No valid JSON files found in the selected folder');
          return;
        }

        // Extract folder name from first file's path and format it nicely
        const firstPath = fileArray[0].webkitRelativePath || fileArray[0].name;
        const rawFolderName = firstPath.split('/')[0] || 'Uploaded Data';
        const folderName = formatFolderName(rawFolderName);

        addUploadedData(folderName, processed);
      } catch (err) {
        console.error('Upload failed:', err);
        alert('Failed to process uploaded files');
      } finally {
        setIsUploading(false);
      }
    },
    [addUploadedData]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const items = e.dataTransfer.items;
    const files: File[] = [];

    const processEntry = async (entry: FileSystemEntry): Promise<void> => {
      if (entry.isFile) {
        const fileEntry = entry as FileSystemFileEntry;
        return new Promise((resolve) => {
          fileEntry.file((file) => {
            const fullPath = entry.fullPath.startsWith('/')
              ? entry.fullPath.slice(1)
              : entry.fullPath;
            Object.defineProperty(file, 'webkitRelativePath', {
              value: fullPath,
              writable: false,
            });
            files.push(file);
            resolve();
          });
        });
      } else if (entry.isDirectory) {
        const dirEntry = entry as FileSystemDirectoryEntry;
        const reader = dirEntry.createReader();

        return new Promise((resolve) => {
          const readEntries = () => {
            reader.readEntries(async (entries) => {
              if (entries.length === 0) {
                resolve();
                return;
              }
              for (const entry of entries) {
                await processEntry(entry);
              }
              readEntries();
            });
          };
          readEntries();
        });
      }
    };

    setIsUploading(true);
    try {
      for (let i = 0; i < items.length; i++) {
        const entry = items[i].webkitGetAsEntry();
        if (entry) {
          await processEntry(entry);
        }
      }

      if (files.length > 0) {
        await handleUpload(files);
      }
    } catch (err) {
      console.error('Drop failed:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleStartComparison = async () => {
    if (selectedFirmIds.length < 2) return;

    setIsLoading(true);
    try {
      await loadAllSelectedFirms();
      router.push('/compare/dashboard');
    } catch (err) {
      console.error('Failed to load firm data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const isSelected = (firmId: string) => selectedFirmIds.includes(firmId);

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
            Select Firms to Compare
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose 2 or more firms to compare side-by-side. You&apos;ll see synchronized Sankey diagrams
            and metrics with universal filters.
          </p>
        </div>

        {/* Firm Selection */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto mb-8">
          {/* Pre-loaded firms */}
          {FIRM_CONFIGS.map((config) => {
            const Icon = FIRM_ICONS[config.id];
            const selected = isSelected(config.id);
            const info = FIRM_DESCRIPTIONS[config.id];

            return (
              <Card
                key={config.id}
                className={cn(
                  'relative overflow-hidden cursor-pointer transition-all hover:shadow-md',
                  selected && `border-2 ${FIRM_BG_COLORS[config.id]}`
                )}
                onClick={() => toggleFirmSelection(config.id)}
              >
                {selected && (
                  <div className="absolute top-4 right-4">
                    <CheckCircle2 className={cn('h-6 w-6', FIRM_COLORS[config.id])} />
                  </div>
                )}
                <CardHeader className="p-5 pb-3">
                  <div className="flex items-center gap-2">
                    <Icon className={cn('h-6 w-6', FIRM_COLORS[config.id])} />
                    <CardTitle className="text-lg">{config.name}</CardTitle>
                  </div>
                  <CardDescription className="text-sm mt-2">
                    {info.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-5 pt-0">
                  <p className="text-sm text-muted-foreground">{info.count}</p>
                </CardContent>
              </Card>
            );
          })}

          {/* Uploaded data cards */}
          {uploadedConfigs.map((config) => {
            const selected = isSelected(config.id);
            const data = firmData[config.id];
            const fileCount = data?.files?.length || 0;

            return (
              <Card
                key={config.id}
                className={cn(
                  'relative overflow-hidden cursor-pointer transition-all hover:shadow-md',
                  selected && 'border-2 bg-purple-500/10 border-purple-500/30'
                )}
                onClick={() => toggleFirmSelection(config.id)}
              >
                {selected && (
                  <div className="absolute top-4 right-4">
                    <CheckCircle2 className="h-6 w-6 text-purple-500" />
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 h-6 w-6 opacity-60 hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeUploadedData(config.id);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
                <CardHeader className="p-5 pb-3">
                  <div className="flex items-center gap-2">
                    <Upload className="h-6 w-6 text-purple-500" />
                    <CardTitle className="text-lg truncate pr-6">{config.name}</CardTitle>
                  </div>
                  <CardDescription className="text-sm mt-2">
                    Uploaded call data
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-5 pt-0">
                  <p className="text-sm text-muted-foreground">{fileCount} calls</p>
                </CardContent>
              </Card>
            );
          })}

          {/* Upload new data card */}
          <Card
            className={cn(
              'relative overflow-hidden transition-all hover:shadow-md border-dashed border-2',
              isDragging && 'border-purple-500 bg-purple-500/5'
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              ref={uploadInputRef}
              type="file"
              webkitdirectory=""
              directory=""
              multiple
              className="hidden"
              onChange={(e) => e.target.files && handleUpload(e.target.files)}
            />
            <CardHeader className="p-5 pb-3">
              <div className="flex items-center gap-2">
                <FolderOpen className="h-6 w-6 text-muted-foreground" />
                <CardTitle className="text-lg">Upload Data</CardTitle>
              </div>
              <CardDescription className="text-sm mt-2">
                Add your own call data for comparison
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 pt-0">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => uploadInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Select Folder
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Selection Status */}
        <div className="max-w-4xl mx-auto text-center mb-8">
          <p className="text-muted-foreground mb-4">
            {selectedFirmIds.length === 0 && 'Select at least 2 firms to compare'}
            {selectedFirmIds.length === 1 && 'Select 1 more firm to compare'}
            {selectedFirmIds.length >= 2 && `${selectedFirmIds.length} firms selected`}
          </p>

          <Button
            size="lg"
            onClick={handleStartComparison}
            disabled={selectedFirmIds.length < 2 || isLoading}
            className="gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading Data...
              </>
            ) : (
              <>
                Start Comparison
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>

        {/* Info */}
        <div className="max-w-2xl mx-auto text-center text-sm text-muted-foreground">
          <p>
            The comparison view will show side-by-side Sankey diagrams for each firm,
            with universal filters that apply to all firms simultaneously. This ensures
            you&apos;re comparing the same categories across different organizations.
          </p>
        </div>
      </div>
    </main>
  );
}
