'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CopyButton } from '@/components/ui/copy-button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { FileInfo } from '@/lib/types';

interface FileViewerProps {
  file: FileInfo | null;
  currentIndex?: number;
  totalFiles?: number;
  onPrevious?: () => void;
  onNext?: () => void;
}

function JsonViewer({ data }: { data: unknown }) {
  const highlighted = useMemo(() => {
    const json = JSON.stringify(data, null, 2);
    // Syntax highlight JSON
    return json.replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
      (match) => {
        let cls = 'text-orange-500 dark:text-orange-400'; // number
        if (/^"/.test(match)) {
          if (/:$/.test(match)) {
            cls = 'text-blue-600 dark:text-blue-400 font-medium'; // key
            match = match.slice(0, -1) + '</span><span class="text-muted-foreground">:'; // separate colon
          } else {
            cls = 'text-green-600 dark:text-green-400'; // string value
          }
        } else if (/true|false/.test(match)) {
          cls = 'text-purple-600 dark:text-purple-400 font-medium'; // boolean
        } else if (/null/.test(match)) {
          cls = 'text-gray-500 italic'; // null
        }
        return `<span class="${cls}">${match}</span>`;
      }
    );
  }, [data]);

  return (
    <ScrollArea className="h-[600px]">
      <pre
        className="text-xs font-mono p-4 bg-muted/30 rounded-lg whitespace-pre-wrap leading-relaxed"
        dangerouslySetInnerHTML={{ __html: highlighted }}
      />
    </ScrollArea>
  );
}

function TranscriptViewer({ transcript }: { transcript: string | null }) {
  if (!transcript) {
    return (
      <div className="flex items-center justify-center h-[600px] text-muted-foreground">
        No transcript available
      </div>
    );
  }

  return (
    <ScrollArea className="h-[600px]">
      <pre className="text-sm font-serif leading-relaxed p-4 bg-muted/30 rounded-lg whitespace-pre-wrap">
        {transcript}
      </pre>
    </ScrollArea>
  );
}

export function FileViewer({ file, currentIndex, totalFiles, onPrevious, onNext }: FileViewerProps) {
  const jsonString = useMemo(() => {
    return file ? JSON.stringify(file.data, null, 2) : '';
  }, [file]);

  const hasNavigation = onPrevious !== undefined || onNext !== undefined;
  const hasPrevious = currentIndex !== undefined && currentIndex > 0;
  const hasNext = currentIndex !== undefined && totalFiles !== undefined && currentIndex < totalFiles - 1;

  if (!file) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          Select a file to view its contents
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* File Info Header */}
      <Card>
        <CardHeader className="py-3">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-sm flex items-center gap-2 flex-wrap flex-1 min-w-0">
              <span className="truncate">{file.name}</span>
              <CopyButton text={file.name} />
              <Badge variant="outline">{file.resolution_type}</Badge>
              <Badge variant="secondary">{file.caller_type}</Badge>
              {file.resolution_achieved === true && (
                <Badge className="bg-green-500/20 text-green-500">Resolved</Badge>
              )}
              {file.resolution_achieved === false && (
                <Badge className="bg-red-500/20 text-red-500">Unresolved</Badge>
              )}
            </CardTitle>
            {hasNavigation && (
              <div className="flex items-center gap-1 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={onPrevious}
                  disabled={!hasPrevious}
                  title="Previous file"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-xs text-muted-foreground min-w-[4rem] text-center">
                  {currentIndex !== undefined && totalFiles !== undefined
                    ? `${currentIndex + 1} / ${totalFiles}`
                    : ''}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={onNext}
                  disabled={!hasNext}
                  title="Next file"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="py-0 pb-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Duration:</span>
              <span className="ml-2 font-medium">
                {file.call_duration ? `${file.call_duration.toFixed(1)}s` : 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Transfer:</span>
              <span className="ml-2 font-medium">
                {file.transfer_success === true
                  ? 'Connected'
                  : file.transfer_success === false
                  ? 'Failed'
                  : 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Intent:</span>
              <span className="ml-2 font-medium">
                {file.primary_intent?.replace(/_/g, ' ') || 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Destination:</span>
              <span className="ml-2 font-medium">
                {file.transfer_destination?.replace(/_/g, ' ') || 'N/A'}
              </span>
            </div>
          </div>
          {file.final_outcome && (
            <div className="mt-3 text-sm">
              <span className="text-muted-foreground">Outcome:</span>
              <p className="mt-1 text-muted-foreground italic">{file.final_outcome}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Content Tabs */}
      <Tabs defaultValue="both" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="both">Both</TabsTrigger>
          <TabsTrigger value="transcript">Transcript</TabsTrigger>
          <TabsTrigger value="json">JSON</TabsTrigger>
        </TabsList>

        <TabsContent value="both" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="py-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm">Transcript</CardTitle>
                {file.transcript && <CopyButton text={file.transcript} />}
              </CardHeader>
              <CardContent className="p-2">
                <TranscriptViewer transcript={file.transcript} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="py-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm">JSON Data</CardTitle>
                <CopyButton text={jsonString} />
              </CardHeader>
              <CardContent className="p-2">
                <JsonViewer data={file.data} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="transcript" className="mt-4">
          <Card>
            <CardHeader className="py-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm">Transcript</CardTitle>
              {file.transcript && <CopyButton text={file.transcript} />}
            </CardHeader>
            <CardContent className="p-2">
              <TranscriptViewer transcript={file.transcript} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="json" className="mt-4">
          <Card>
            <CardHeader className="py-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm">JSON Data</CardTitle>
              <CopyButton text={jsonString} />
            </CardHeader>
            <CardContent className="p-2">
              <JsonViewer data={file.data} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
