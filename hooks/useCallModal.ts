'use client';

/**
 * useCallModal Hook
 *
 * Manages modal state tied to URL for viewing individual calls.
 * Handles opening, closing, and navigating between calls in the modal.
 */

import { useCallback, useEffect, useState, useMemo } from 'react';
import type { FileInfo } from '@/lib/types';
import { useUrlState, findFileByCallId } from './useUrlState';

interface UseCallModalOptions {
  /** List of files to navigate through */
  files: FileInfo[];
  /** Callback when a file is opened */
  onOpen?: (file: FileInfo, index: number) => void;
}

interface UseCallModalReturn {
  /** Currently open file (null if modal is closed) */
  openFile: FileInfo | null;
  /** Index of the open file in the files array */
  openIndex: number;
  /** Whether the modal is open */
  isOpen: boolean;
  /** Whether URL state has been hydrated */
  isHydrated: boolean;
  /** Open modal with a specific file */
  openModal: (file: FileInfo) => void;
  /** Open modal with a file by call ID */
  openByCallId: (callId: string) => void;
  /** Close the modal */
  closeModal: () => void;
  /** Navigate to the next file */
  goToNext: () => void;
  /** Navigate to the previous file */
  goToPrevious: () => void;
  /** Whether there is a next file */
  hasNext: boolean;
  /** Whether there is a previous file */
  hasPrevious: boolean;
}

export function useCallModal(options: UseCallModalOptions): UseCallModalReturn {
  const { files, onOpen } = options;
  const { urlState, isHydrated, setCallInUrl, clearUrlParams } = useUrlState();

  // Initialize state from URL if present (computed once)
  const initialFile = useMemo(() => {
    if (urlState.callId && files.length > 0) {
      return findFileByCallId(files, urlState.callId) ?? null;
    }
    return null;
  }, [urlState.callId, files]);

  const initialIndex = useMemo(() => {
    if (initialFile) {
      return files.indexOf(initialFile);
    }
    return -1;
  }, [initialFile, files]);

  const [openFile, setOpenFile] = useState<FileInfo | null>(initialFile);
  const [openIndex, setOpenIndex] = useState(initialIndex);

  // Sync state when initialFile changes (e.g., when files load after URL is parsed)
  useEffect(() => {
    if (isHydrated && initialFile && openFile === null) {
      setOpenFile(initialFile);
      setOpenIndex(initialIndex);
      onOpen?.(initialFile, initialIndex);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHydrated, initialFile, initialIndex]);

  // Find index of a file
  const findIndex = useCallback(
    (file: FileInfo) => {
      return files.findIndex((f) => f.callId === file.callId);
    },
    [files]
  );

  // Open modal with a specific file
  const openModal = useCallback(
    (file: FileInfo) => {
      const index = findIndex(file);
      setOpenFile(file);
      setOpenIndex(index);
      setCallInUrl(file.callId, index);
      onOpen?.(file, index);
    },
    [findIndex, setCallInUrl, onOpen]
  );

  // Open modal with a file by call ID
  const openByCallId = useCallback(
    (callId: string) => {
      const file = findFileByCallId(files, callId);
      if (file) {
        openModal(file);
      }
    },
    [files, openModal]
  );

  // Close the modal
  const closeModal = useCallback(() => {
    setOpenFile(null);
    setOpenIndex(-1);
    clearUrlParams();
  }, [clearUrlParams]);

  // Navigate to next file
  const goToNext = useCallback(() => {
    if (openIndex < files.length - 1) {
      const nextFile = files[openIndex + 1];
      openModal(nextFile);
    }
  }, [openIndex, files, openModal]);

  // Navigate to previous file
  const goToPrevious = useCallback(() => {
    if (openIndex > 0) {
      const prevFile = files[openIndex - 1];
      openModal(prevFile);
    }
  }, [openIndex, files, openModal]);

  // Computed properties
  const hasNext = useMemo(() => openIndex < files.length - 1, [openIndex, files.length]);
  const hasPrevious = useMemo(() => openIndex > 0, [openIndex]);
  const isOpen = openFile !== null;

  return {
    openFile,
    openIndex,
    isOpen,
    isHydrated,
    openModal,
    openByCallId,
    closeModal,
    goToNext,
    goToPrevious,
    hasNext,
    hasPrevious,
  };
}
