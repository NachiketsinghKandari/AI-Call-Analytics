'use client';

/**
 * ShareButton Component
 *
 * Dropdown button for sharing URLs with or without filters.
 * Uses clipboard API with visual feedback.
 */

import { useState } from 'react';
import { Share2, Link, Filter, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface ShareButtonProps {
  /** Generate URL without filters (just navigation) */
  getNavigationUrl: () => string;
  /** Generate URL with filters */
  getShareUrl: () => string;
  /** Optional class name */
  className?: string;
  /** Button variant */
  variant?: 'default' | 'ghost' | 'outline';
  /** Button size */
  size?: 'default' | 'sm' | 'icon';
}

export function ShareButton({
  getNavigationUrl,
  getShareUrl,
  className,
  variant = 'ghost',
  size = 'icon',
}: ShareButtonProps) {
  const [copiedType, setCopiedType] = useState<'link' | 'share' | null>(null);

  const copyToClipboard = async (url: string, type: 'link' | 'share') => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleCopyLink = async () => {
    const url = getNavigationUrl();
    await copyToClipboard(url, 'link');
  };

  const handleCopyWithFilters = async () => {
    const url = getShareUrl();
    await copyToClipboard(url, 'share');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={cn('h-7 w-7', className)}
          title="Share"
        >
          <Share2 className="h-3.5 w-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={handleCopyLink}>
          {copiedType === 'link' ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Link className="h-4 w-4" />
          )}
          <span>{copiedType === 'link' ? 'Copied!' : 'Copy link'}</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCopyWithFilters}>
          {copiedType === 'share' ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Filter className="h-4 w-4" />
          )}
          <span>{copiedType === 'share' ? 'Copied!' : 'Copy with filters'}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
