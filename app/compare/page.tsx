'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Building2, Scale, Phone, ArrowRight, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { HelloCounselLogo } from '@/components/logo';
import { ThemeToggle } from '@/components/theme-toggle';
import { useCompareStore, FIRM_CONFIGS } from '@/store/compareStore';
import { cn } from '@/lib/utils';

const FIRM_ICONS: Record<string, React.ElementType> = {
  sample: Building2,
  mccraw: Scale,
  vapi: Phone,
};

const FIRM_COLORS: Record<string, string> = {
  sample: 'text-blue-500',
  mccraw: 'text-amber-500',
  vapi: 'text-green-500',
};

const FIRM_BG_COLORS: Record<string, string> = {
  sample: 'bg-blue-500/10 border-blue-500/30',
  mccraw: 'bg-amber-500/10 border-amber-500/30',
  vapi: 'bg-green-500/10 border-green-500/30',
};

const FIRM_DESCRIPTIONS: Record<string, { description: string; count: string }> = {
  sample: { description: 'Sample call data from Bey & Associates law firm with full transcripts.', count: '1,000+ calls' },
  mccraw: { description: 'Call data from McCraw Law with Gemini-generated transcripts and analysis.', count: '486 calls' },
  vapi: { description: 'VAPI call records with AI-generated analysis and full transcripts.', count: '730 calls' },
};

export default function ComparePage() {
  const router = useRouter();
  const { selectedFirmIds, toggleFirmSelection, loadAllSelectedFirms, clearComparison } = useCompareStore();
  const [isLoading, setIsLoading] = useState(false);

  // Clear comparison state on mount
  useEffect(() => {
    clearComparison();
  }, [clearComparison]);

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
            <HelloCounselLogo className="h-10" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-3">
            Select Firms to Compare
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose 2-3 firms to compare side-by-side. You&apos;ll see synchronized Sankey diagrams
            and metrics with universal filters.
          </p>
        </div>

        {/* Firm Selection */}
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-8">
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
