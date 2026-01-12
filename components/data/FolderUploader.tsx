'use client';

import { useCallback, useRef, useState } from 'react';
import { Upload, FolderOpen, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { processFiles } from '@/lib/parser';
import { useCallDataStore } from '@/store/callDataStore';
import { cn } from '@/lib/utils';

// Extend input element to include webkitdirectory
declare module 'react' {
  interface InputHTMLAttributes<T> extends HTMLAttributes<T> {
    webkitdirectory?: string;
    directory?: string;
  }
}

interface FolderUploaderProps {
  /** Compact mode: no card wrapper, no header - just the drop zone */
  compact?: boolean;
  className?: string;
}

export function FolderUploader({ compact = false, className }: FolderUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string | null>(null);

  const { setFiles, setLoading, setError, setDataSource } = useCallDataStore();
  const isProcessing = processingStatus !== null;

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);

      if (fileArray.length === 0) {
        setError('No files selected');
        return;
      }

      setLoading(true);
      setError(null);
      setProcessingStatus(`Processing ${fileArray.length} files...`);

      try {
        const processed = await processFiles(fileArray);

        if (processed.length === 0) {
          setError('No valid JSON files found in the selected folder');
          setLoading(false);
          setProcessingStatus(null);
          return;
        }

        setFiles(processed);
        setDataSource('uploaded');
        setProcessingStatus(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to process files');
        setProcessingStatus(null);
      } finally {
        setLoading(false);
      }
    },
    [setFiles, setLoading, setError, setDataSource]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

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

    // Process dropped items recursively
    const processEntry = async (entry: FileSystemEntry): Promise<void> => {
      if (entry.isFile) {
        const fileEntry = entry as FileSystemFileEntry;
        return new Promise((resolve) => {
          fileEntry.file((file) => {
            // Create a new file with the full path
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

    setLoading(true);
    setProcessingStatus('Reading files...');

    try {
      for (let i = 0; i < items.length; i++) {
        const entry = items[i].webkitGetAsEntry();
        if (entry) {
          await processEntry(entry);
        }
      }

      if (files.length > 0) {
        await handleFiles(files);
      } else {
        setError('No files found in dropped folder');
        setLoading(false);
        setProcessingStatus(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to read dropped files');
      setLoading(false);
      setProcessingStatus(null);
    }
  };

  const openFolderDialog = () => {
    inputRef.current?.click();
  };

  const dropZoneContent = (
    <>
      <input
        ref={inputRef}
        type="file"
        webkitdirectory=""
        directory=""
        multiple
        className="hidden"
        onChange={handleInputChange}
      />

      <div className="flex flex-col items-center justify-center gap-4 text-center">
        {isProcessing ? (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {processingStatus || 'Processing...'}
            </p>
          </>
        ) : compact ? (
          // Compact mode: minimal drop zone for embedding
          <>
            <div
              className={cn(
                "w-full rounded-lg border-2 border-dashed p-8 transition-colors cursor-pointer hover:border-primary/50 hover:bg-muted/50",
                isDragging && "border-primary bg-primary/5"
              )}
              onClick={openFolderDialog}
            >
              <div className="flex flex-col items-center gap-3">
                <div className="rounded-full bg-muted p-3">
                  <FolderOpen className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Click to select folder</p>
                  <p className="text-xs text-muted-foreground">
                    or drag and drop here
                  </p>
                </div>
              </div>
            </div>
          </>
        ) : (
          // Full mode: standalone card with header
          <>
            <div className="rounded-full bg-muted p-4">
              <FolderOpen className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Upload Your Data</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Select a folder containing JSON and TXT files
              </p>
            </div>
            <Button onClick={openFolderDialog} className="gap-2">
              <Upload className="h-4 w-4" />
              Select Folder
            </Button>
            <p className="text-xs text-muted-foreground">
              or drag and drop a folder here
            </p>
          </>
        )}
      </div>
    </>
  );

  // Compact mode: just return the content with drag handlers
  if (compact) {
    return (
      <div
        className={cn("w-full", className)}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {dropZoneContent}
      </div>
    );
  }

  // Full mode: wrap in Card
  return (
    <Card
      className={cn(
        "transition-colors",
        isDragging && "border-primary border-2 bg-primary/5",
        className
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <CardContent className="p-8">
        {dropZoneContent}
      </CardContent>
    </Card>
  );
}
