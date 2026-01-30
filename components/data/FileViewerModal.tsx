'use client';

import { useEffect, useMemo, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CopyButton } from '@/components/ui/copy-button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { FileInfo } from '@/lib/types';

interface FileViewerModalProps {
  files: FileInfo[];
  currentIndex: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onIndexChange: (index: number) => void;
}

function JsonViewer({ data }: { data: unknown }) {
  const highlighted = useMemo(() => {
    const json = JSON.stringify(data, null, 2);
    return json.replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
      (match) => {
        // Softer colors for comfortable reading
        let cls = 'text-amber-600/80 dark:text-amber-400/70';
        if (/^"/.test(match)) {
          if (/:$/.test(match)) {
            cls = 'text-sky-600/80 dark:text-sky-400/70 font-medium';
            match = match.slice(0, -1) + '</span><span class="text-foreground/50">:';
          } else {
            cls = 'text-emerald-600/80 dark:text-emerald-400/70';
          }
        } else if (/true|false/.test(match)) {
          cls = 'text-violet-600/80 dark:text-violet-400/70 font-medium';
        } else if (/null/.test(match)) {
          cls = 'text-foreground/40 italic';
        }
        return `<span class="${cls}">${match}</span>`;
      }
    );
  }, [data]);

  return (
    <pre
      className="text-xs font-mono whitespace-pre-wrap leading-relaxed text-foreground/60"
      dangerouslySetInnerHTML={{ __html: highlighted }}
    />
  );
}

function TranscriptViewer({ transcript }: { transcript: string | null }) {
  if (!transcript) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        No transcript available
      </div>
    );
  }

  return (
    <pre className="text-sm font-serif leading-loose whitespace-pre-wrap text-foreground/75 dark:text-foreground/70">
      {transcript}
    </pre>
  );
}

export function FileViewerModal({
  files,
  currentIndex,
  open,
  onOpenChange,
  onIndexChange,
}: FileViewerModalProps) {
  const file = files[currentIndex];
  const totalFiles = files.length;
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < totalFiles - 1;

  const jsonString = useMemo(() => {
    return file ? JSON.stringify(file.data, null, 2) : '';
  }, [file]);

  const goToPrevious = useCallback(() => {
    if (hasPrevious) {
      onIndexChange(currentIndex - 1);
    }
  }, [hasPrevious, currentIndex, onIndexChange]);

  const goToNext = useCallback(() => {
    if (hasNext) {
      onIndexChange(currentIndex + 1);
    }
  }, [hasNext, currentIndex, onIndexChange]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goToPrevious();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goToNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, goToPrevious, goToNext]);

  if (!file) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-[90vw] lg:w-[calc(100vw-18rem-3rem)] lg:max-w-none lg:left-[calc(18rem+(100vw-18rem)/2)] lg:top-[calc(3.5rem+(100vh-3.5rem)/2)] h-[80vh] lg:h-[calc(100vh-3.5rem-3rem)] flex flex-col">
        {/* Header */}
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 pr-8">
            <span className="truncate max-w-[150px] sm:max-w-[300px] lg:max-w-[400px]">{file.name}</span>
            <CopyButton text={file.name} />
          </DialogTitle>
          {/* Badges row - responsive layout */}
          <div className="flex flex-wrap gap-1.5 mt-1">
            <Badge variant="outline" className="text-xs">
              {file.resolution_type.replace(/_/g, ' ')}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {file.caller_type.replace(/_/g, ' ')}
            </Badge>
            {file.resolution_achieved === true && (
              <Badge className="bg-green-500/20 text-green-500 text-xs">Resolved</Badge>
            )}
            {file.resolution_achieved === false && (
              <Badge className="bg-red-500/20 text-red-500 text-xs">Unresolved</Badge>
            )}
          </div>
          <DialogDescription className="flex flex-wrap gap-x-4 gap-y-1 text-xs mt-2">
            <span>
              <span className="text-muted-foreground">Duration:</span>{' '}
              <span className="font-medium">
                {file.call_duration ? `${file.call_duration.toFixed(1)}s` : 'N/A'}
              </span>
            </span>
            <span>
              <span className="text-muted-foreground">Intent:</span>{' '}
              <span className="font-medium">
                {file.primary_intent?.replace(/_/g, ' ') || 'N/A'}
              </span>
            </span>
            <span>
              <span className="text-muted-foreground">Transfer:</span>{' '}
              <span className="font-medium">
                {file.transfer_success === true
                  ? 'Connected'
                  : file.transfer_success === false
                  ? 'Failed'
                  : 'N/A'}
              </span>
            </span>
          </DialogDescription>
        </DialogHeader>

        {/* Side-by-side content */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0">
          {/* Transcript Panel */}
          <div className="flex flex-col min-h-0 rounded-lg overflow-hidden bg-muted/40 dark:bg-muted/30">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/50 flex-shrink-0">
              <span className="text-sm font-medium text-foreground/80">Transcript</span>
              {file.transcript && <CopyButton text={file.transcript} />}
            </div>
            <div className="flex-1 overflow-auto p-5">
              <TranscriptViewer transcript={file.transcript} />
            </div>
          </div>

          {/* JSON Panel */}
          <div className="flex flex-col min-h-0 rounded-lg overflow-hidden bg-muted/40 dark:bg-muted/30">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/50 flex-shrink-0">
              <span className="text-sm font-medium text-foreground/80">JSON Data</span>
              <CopyButton text={jsonString} />
            </div>
            <div className="flex-1 overflow-auto p-5">
              <JsonViewer data={file.data} />
            </div>
          </div>
        </div>

        {/* Footer with navigation */}
        <DialogFooter className="flex-shrink-0 border-t pt-4">
          <div className="flex items-center justify-between w-full gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPrevious}
              disabled={!hasPrevious}
              className="gap-1 h-10 px-3 sm:px-4"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Previous</span>
              <span className="sm:hidden">Prev</span>
            </Button>
            <span className="text-xs sm:text-sm text-muted-foreground text-center">
              {currentIndex + 1} / {totalFiles}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={goToNext}
              disabled={!hasNext}
              className="gap-1 h-10 px-3 sm:px-4"
            >
              <span>Next</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
