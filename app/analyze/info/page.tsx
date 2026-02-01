'use client';

import { useState, useRef, useCallback } from 'react';
import { useHydrated } from '@/lib/hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ALL_CATEGORIES, type CategoryDefinition, type FieldDefinition } from '@/lib/definitions';
import { Search, ChevronDown, Download, Copy, Check, Loader2 } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useCallDataStore } from '@/store/callDataStore';
import { ShareButton } from '@/components/ShareButton';
import { createShareUrl, getBaseUrl } from '@/lib/urlState';

function DefinitionCard({ field }: { field: FieldDefinition }) {
  return (
    <div className="p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
      <div className="flex items-start gap-2 mb-1">
        <Badge variant="outline" className="text-xs font-mono shrink-0">
          {field.value}
        </Badge>
        <span className="text-sm font-medium">{field.label}</span>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">
        {field.description}
      </p>
    </div>
  );
}

function CategorySection({ category, defaultOpen = false }: { category: CategoryDefinition; defaultOpen?: boolean }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const hydrated = useHydrated();

  if (!hydrated) {
    return (
      <Card className="py-4">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{category.name}</CardTitle>
            <Badge variant="secondary" className="text-xs">
              {category.fields.length}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{category.description}</p>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="py-4">
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-2 cursor-pointer hover:bg-muted/30 transition-colors rounded-t-lg">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{category.name}</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {category.fields.length}
                </Badge>
                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? '' : '-rotate-90'}`} />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">{category.description}</p>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent>
            <div className="grid gap-2">
              {category.fields.map((field) => (
                <DefinitionCard key={field.value} field={field} />
              ))}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

export default function InfoPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [copied, setCopied] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const { filters, stats, dataSource } = useCallDataStore();

  // URL generation for sharing
  const getNavigationUrl = useCallback(() => {
    const url = new URL(getBaseUrl());
    if (dataSource && dataSource !== 'none' && dataSource !== 'uploaded') {
      url.searchParams.set('d', dataSource);
    }
    return url.toString();
  }, [dataSource]);

  const getShareUrl = useCallback(() => {
    return createShareUrl(getBaseUrl(), filters, {
      stats: stats ?? undefined,
      dataSource: dataSource !== 'none' && dataSource !== 'uploaded' ? dataSource : undefined,
    });
  }, [filters, stats, dataSource]);

  // Generate markdown content for copy
  const generateMarkdown = useCallback(() => {
    let md = '# Field Definitions\n\n';
    md += 'Reference guide for all classification fields used in call analysis.\n\n';

    md += '## About This System\n\n';
    md += 'This call analysis system models **operational call handling outcomes** based on spoken evidence from transcripts. ';
    md += 'It focuses on what the receptionist actually did, not caller emotions or satisfaction. ';
    md += 'Resolution means a valid operational terminal state was reached. ';
    md += 'Transfer detection is binary - if a transfer was attempted, the resolution type must be "transfer_attempted" regardless of other factors.\n\n';

    md += '## Key Rules\n\n';
    md += '1. If any transfer destination is recorded, resolution type **must** be "transfer_attempted"\n';
    md += '2. Transfer connection status is true if caller was placed into transfer path, not whether staff answered\n';
    md += '3. Resolution achieved is true only if transfer succeeded OR a fallback was accepted\n';
    md += '4. Spanish speakers are classified as "spanish_speaker" regardless of their role\n';
    md += '5. Secondary action can only be set if transfer failed and fallback was accepted\n\n';

    ALL_CATEGORIES.forEach((category) => {
      md += `## ${category.name}\n\n`;
      md += `${category.description}\n\n`;
      md += '| Value | Label | Description |\n';
      md += '|-------|-------|-------------|\n';
      category.fields.forEach((field) => {
        md += `| \`${field.value}\` | ${field.label} | ${field.description} |\n`;
      });
      md += '\n';
    });

    return md;
  }, []);

  const handleCopy = async () => {
    const markdown = generateMarkdown();
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const { default: jsPDF } = await import('jspdf');

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      let yPosition = margin;

      // Title
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Field Definitions', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 10;

      // Subtitle
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Reference guide for all classification fields used in call analysis', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 10;

      // Date
      pdf.setFontSize(8);
      pdf.text(`Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;

      // About section
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('About This System', margin, yPosition);
      yPosition += 7;

      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      const aboutText = 'This call analysis system models operational call handling outcomes based on spoken evidence from transcripts. It focuses on what the receptionist actually did, not caller emotions or satisfaction.';
      const aboutLines = pdf.splitTextToSize(aboutText, pageWidth - margin * 2);
      pdf.text(aboutLines, margin, yPosition);
      yPosition += aboutLines.length * 4 + 10;

      // Key Rules
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Key Rules', margin, yPosition);
      yPosition += 7;

      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      const rules = [
        '1. If any transfer destination is recorded, resolution type must be "transfer_attempted"',
        '2. Transfer connection status is true if caller was placed into transfer path',
        '3. Resolution achieved is true only if transfer succeeded OR a fallback was accepted',
        '4. Spanish speakers are classified as "spanish_speaker" regardless of their role',
        '5. Secondary action can only be set if transfer failed and fallback was accepted',
      ];
      rules.forEach((rule) => {
        const ruleLines = pdf.splitTextToSize(rule, pageWidth - margin * 2);
        if (yPosition + ruleLines.length * 4 > pageHeight - margin) {
          pdf.addPage();
          yPosition = margin;
        }
        pdf.text(ruleLines, margin, yPosition);
        yPosition += ruleLines.length * 4 + 2;
      });
      yPosition += 10;

      // Categories
      for (const category of ALL_CATEGORIES) {
        if (yPosition > pageHeight - 40) {
          pdf.addPage();
          yPosition = margin;
        }

        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text(category.name, margin, yPosition);
        yPosition += 5;

        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        const descLines = pdf.splitTextToSize(category.description, pageWidth - margin * 2);
        pdf.text(descLines, margin, yPosition);
        yPosition += descLines.length * 3 + 5;

        for (const field of category.fields) {
          if (yPosition > pageHeight - 20) {
            pdf.addPage();
            yPosition = margin;
          }

          pdf.setFontSize(9);
          pdf.setFont('helvetica', 'bold');
          pdf.text(`${field.value}`, margin, yPosition);
          pdf.setFont('helvetica', 'normal');
          pdf.text(` - ${field.label}`, margin + pdf.getTextWidth(field.value), yPosition);
          yPosition += 4;

          pdf.setFontSize(8);
          const fieldDescLines = pdf.splitTextToSize(field.description, pageWidth - margin * 2 - 5);
          pdf.text(fieldDescLines, margin + 5, yPosition);
          yPosition += fieldDescLines.length * 3 + 3;
        }
        yPosition += 5;
      }

      pdf.save(`field_definitions_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Failed to export PDF:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const filteredCategories = ALL_CATEGORIES.map((category) => ({
    ...category,
    fields: category.fields.filter(
      (field) =>
        field.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        field.value.toLowerCase().includes(searchTerm.toLowerCase()) ||
        field.description.toLowerCase().includes(searchTerm.toLowerCase())
    ),
  })).filter((category) => category.fields.length > 0);

  return (
    <div className="space-y-6" ref={contentRef}>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Field Definitions</h1>
          <p className="text-muted-foreground">
            Reference guide for all classification fields used in call analysis
          </p>
        </div>
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">{copied ? 'Copied!' : 'Copy'}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Copy as Markdown</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={handleExportPDF}
            disabled={isExporting}
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">Export PDF</span>
          </Button>
          <ShareButton
            getNavigationUrl={getNavigationUrl}
            getShareUrl={getShareUrl}
            variant="outline"
            size="sm"
            className="h-8 w-8"
          />
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search definitions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Overview */}
      <Card className="bg-muted/20">
        <CardContent className="p-4">
          <h3 className="font-semibold mb-2">About This System</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            This call analysis system models <strong>operational call handling outcomes</strong> based on
            spoken evidence from transcripts. It focuses on what the receptionist actually did, not caller
            emotions or satisfaction. Resolution means a valid operational terminal state was reached.
            Transfer detection is binary - if a transfer was attempted, the resolution type must be
            &quot;transfer_attempted&quot; regardless of other factors.
          </p>
        </CardContent>
      </Card>

      {/* Key Rules */}
      <Card className="py-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Key Rules</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-2">
              <span className="text-primary font-bold">1.</span>
              <span>If any transfer destination is recorded, resolution type <strong>must</strong> be &quot;transfer_attempted&quot;</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary font-bold">2.</span>
              <span>Transfer connection status is true if caller was placed into transfer path, not whether staff answered</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary font-bold">3.</span>
              <span>Resolution achieved is true only if transfer succeeded OR a fallback was accepted</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary font-bold">4.</span>
              <span>Spanish speakers are classified as &quot;spanish_speaker&quot; regardless of their role</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary font-bold">5.</span>
              <span>Secondary action can only be set if transfer failed and fallback was accepted</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Categories */}
      <div className="grid gap-6">
        {filteredCategories.map((category) => (
          <CategorySection key={category.name} category={category} />
        ))}
      </div>

      {filteredCategories.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            No definitions found matching &quot;{searchTerm}&quot;
          </CardContent>
        </Card>
      )}
    </div>
  );
}
