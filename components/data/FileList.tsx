'use client';

import { useMemo, useState } from 'react';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useCallDataStore } from '@/store/callDataStore';
import { applyAllFilters, searchFiles } from '@/lib/filters';
import type { FileInfo } from '@/lib/types';

interface FileListProps {
  onFileSelect?: (file: FileInfo) => void;
}

export function FileList({ onFileSelect }: FileListProps) {
  const { files, filters, selectedFileId, setSelectedFileId } = useCallDataStore();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFiles = useMemo(() => {
    const byFilters = applyAllFilters(files, filters);
    return searchFiles(byFilters, searchQuery);
  }, [files, filters, searchQuery]);

  const selectedIndex = useMemo(() => {
    return filteredFiles.findIndex((f) => f.id === selectedFileId);
  }, [filteredFiles, selectedFileId]);

  const handleSelectFile = (file: FileInfo) => {
    setSelectedFileId(file.id);
    onFileSelect?.(file);
  };

  const handlePrevious = () => {
    if (selectedIndex > 0) {
      const prevFile = filteredFiles[selectedIndex - 1];
      handleSelectFile(prevFile);
    }
  };

  const handleNext = () => {
    if (selectedIndex < filteredFiles.length - 1) {
      const nextFile = filteredFiles[selectedIndex + 1];
      handleSelectFile(nextFile);
    }
  };

  const selectedFile = selectedFileId
    ? filteredFiles.find((f) => f.id === selectedFileId) || null
    : null;

  return (
    <div className="flex flex-col h-full">
      {/* Search and Navigation */}
      <div className="p-3 border-b space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {filteredFiles.length} files
            {selectedIndex >= 0 && ` • ${selectedIndex + 1} of ${filteredFiles.length}`}
          </span>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={handlePrevious}
              disabled={selectedIndex <= 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={handleNext}
              disabled={selectedIndex >= filteredFiles.length - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* File List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {filteredFiles.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No files match your filters
            </div>
          ) : (
            filteredFiles.map((file) => (
              <button
                key={file.id}
                onClick={() => handleSelectFile(file)}
                className={`w-full text-left p-2 rounded-md transition-colors ${
                  file.id === selectedFileId
                    ? 'bg-primary/10 border border-primary/30'
                    : 'hover:bg-muted/50'
                }`}
              >
                <div className="text-sm font-medium truncate">{file.name}</div>
                <div className="flex items-center gap-1 mt-1 flex-wrap">
                  <Badge variant="outline" className="text-xs">
                    {file.resolution_type.replace(/_/g, ' ')}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {file.caller_type.replace(/_/g, ' ')}
                  </Badge>
                  {file.resolution_achieved === true && (
                    <Badge className="text-xs bg-green-500/20 text-green-500 hover:bg-green-500/30">
                      Resolved
                    </Badge>
                  )}
                  {file.resolution_achieved === false && (
                    <Badge className="text-xs bg-red-500/20 text-red-500 hover:bg-red-500/30">
                      Unresolved
                    </Badge>
                  )}
                </div>
                {file.call_duration && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Duration: {file.call_duration.toFixed(1)}s
                  </div>
                )}
              </button>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

export function useSelectedFile(): FileInfo | null {
  const { files, selectedFileId } = useCallDataStore();
  return files.find((f) => f.id === selectedFileId) || null;
}
