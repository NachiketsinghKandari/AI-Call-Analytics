'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ALL_CATEGORIES, type CategoryDefinition, type FieldDefinition } from '@/lib/definitions';
import { Search, ChevronDown } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Field Definitions</h1>
        <p className="text-muted-foreground">
          Reference guide for all classification fields used in call analysis
        </p>
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
            "transfer_attempted" regardless of other factors.
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
              <span>If any transfer destination is recorded, resolution type <strong>must</strong> be "transfer_attempted"</span>
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
              <span>Spanish speakers are classified as "spanish_speaker" regardless of their role</span>
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
            No definitions found matching "{searchTerm}"
          </CardContent>
        </Card>
      )}
    </div>
  );
}
