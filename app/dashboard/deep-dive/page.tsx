'use client';

import { useMemo, useState, useCallback } from 'react';
import { useHydrated } from '@/lib/hooks';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { FileList, useSelectedFile } from '@/components/data/FileList';
import { FileViewer } from '@/components/data/FileViewer';
import { useCallDataStore } from '@/store/callDataStore';
import { applyAllFilters } from '@/lib/filters';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { ChevronDown, Search, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function DeepDivePage() {
  const { files, filters, selectedFileId, setSelectedFileId } = useCallDataStore();
  const selectedFile = useSelectedFile();
  const [isFileListOpen, setIsFileListOpen] = useState(false);
  const hydrated = useHydrated();

  const filteredFiles = useMemo(() => {
    return applyAllFilters(files, filters);
  }, [files, filters]);

  // Find current index in filtered files
  const currentIndex = useMemo(() => {
    if (!selectedFileId) return -1;
    return filteredFiles.findIndex(f => f.id === selectedFileId);
  }, [filteredFiles, selectedFileId]);

  const goToPrevious = useCallback(() => {
    if (currentIndex > 0) {
      setSelectedFileId(filteredFiles[currentIndex - 1].id);
    }
  }, [currentIndex, filteredFiles, setSelectedFileId]);

  const goToNext = useCallback(() => {
    if (currentIndex < filteredFiles.length - 1) {
      setSelectedFileId(filteredFiles[currentIndex + 1].id);
    }
  }, [currentIndex, filteredFiles, setSelectedFileId]);

  const totalDuration = useMemo(() => {
    return filteredFiles.reduce((sum, f) => sum + (f.call_duration || 0), 0);
  }, [filteredFiles]);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Deep Dive</h1>
        <p className="text-muted-foreground">
          Browse and analyze individual call files
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-2xl font-bold">{filteredFiles.length}</div>
          <div className="text-sm text-muted-foreground">Filtered Files</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold">{formatDuration(totalDuration)}</div>
          <div className="text-sm text-muted-foreground">Total Duration</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold">
            {filteredFiles.filter((f) => f.transcript).length}
          </div>
          <div className="text-sm text-muted-foreground">With Transcripts</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold">
            {new Set(filteredFiles.map((f) => f.resolution_type)).size}
          </div>
          <div className="text-sm text-muted-foreground">Resolution Types</div>
        </Card>
      </div>

      {/* Collapsible File Search */}
      {hydrated ? (
        <Collapsible open={isFileListOpen} onOpenChange={setIsFileListOpen}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="py-3 cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <div>
                      {selectedFile ? (
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-primary" />
                          <span className="font-medium">{selectedFile.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {selectedFile.caller_type} • {selectedFile.resolution_type}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Search and select a file...</span>
                      )}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <ChevronDown
                      className={cn(
                        'h-4 w-4 transition-transform',
                        isFileListOpen && 'rotate-180'
                      )}
                    />
                  </Button>
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0 pb-4">
                <div className="h-[350px] border rounded-lg">
                  <FileList />
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      ) : (
        <Card>
          <CardHeader className="py-3">
            <div className="flex items-center gap-3">
              <Search className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Search and select a file...</span>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* File Viewer */}
      <div className="min-h-[500px]">
        <FileViewer
          file={selectedFile}
          currentIndex={currentIndex >= 0 ? currentIndex : undefined}
          totalFiles={filteredFiles.length}
          onPrevious={goToPrevious}
          onNext={goToNext}
        />
      </div>
    </div>
  );
}
