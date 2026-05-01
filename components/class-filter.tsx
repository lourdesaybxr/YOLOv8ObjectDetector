'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Check, Filter } from 'lucide-react';
import { CLASS_CATEGORIES, CLASS_COLORS, COCO_CLASSES } from '@/lib/coco-classes';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

interface ClassFilterProps {
  enabledClasses: Set<string>;
  onClassToggle: (className: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onSelectCategory: (category: string) => void;
}

export function ClassFilter({
  enabledClasses,
  onClassToggle,
  onSelectAll,
  onDeselectAll,
  onSelectCategory
}: ClassFilterProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['People', 'Vehicles', 'Animals']));

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const isCategoryFullySelected = (category: string) => {
    const classes = CLASS_CATEGORIES[category as keyof typeof CLASS_CATEGORIES];
    return classes.every(c => enabledClasses.has(c));
  };

  const isCategoryPartiallySelected = (category: string) => {
    const classes = CLASS_CATEGORIES[category as keyof typeof CLASS_CATEGORIES];
    const selected = classes.filter(c => enabledClasses.has(c)).length;
    return selected > 0 && selected < classes.length;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <Filter className="w-4 h-4 text-primary" />
        <h2 className="font-semibold text-sm text-foreground">Class Filter</h2>
      </div>
      
      <div className="flex gap-2 px-4 py-2 border-b border-border">
        <Button variant="outline" size="sm" onClick={onSelectAll} className="flex-1 text-xs">
          All
        </Button>
        <Button variant="outline" size="sm" onClick={onDeselectAll} className="flex-1 text-xs">
          None
        </Button>
      </div>

      <div className="px-4 py-2 text-xs text-muted-foreground border-b border-border">
        {enabledClasses.size} of {COCO_CLASSES.length} classes selected
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          {Object.entries(CLASS_CATEGORIES).map(([category, classes]) => (
            <div key={category} className="mb-1">
              {/* Cambiamos el <button> exterior por un <div> accesible */}
              <div
                onClick={() => toggleCategory(category)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleCategory(category);
                  }
                }}
                role="button"
                tabIndex={0}
                className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md hover:bg-secondary/50 transition-colors cursor-pointer"
              >
                {expandedCategories.has(category) ? (
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                )}
                <span className="text-sm font-medium text-foreground">{category}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {classes.filter(c => enabledClasses.has(c)).length}/{classes.length}
                </span>
                
                {/* El botón interior se mantiene intacto */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectCategory(category);
                  }}
                  className={cn(
                    'w-4 h-4 rounded border flex items-center justify-center transition-colors',
                    isCategoryFullySelected(category)
                      ? 'bg-primary border-primary'
                      : isCategoryPartiallySelected(category)
                      ? 'bg-primary/50 border-primary'
                      : 'border-muted-foreground/30'
                  )}
                >
                  {(isCategoryFullySelected(category) || isCategoryPartiallySelected(category)) && (
                    <Check className="w-3 h-3 text-primary-foreground" />
                  )}
                </button>
              </div>

              {expandedCategories.has(category) && (
                <div className="ml-5 mt-1 space-y-0.5">
                  {classes.map((className) => (
                    <label
                      key={className}
                      className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-secondary/30 cursor-pointer transition-colors"
                    >
                      <Checkbox
                        checked={enabledClasses.has(className)}
                        onCheckedChange={() => onClassToggle(className)}
                        className="border-muted-foreground/30"
                      />
                      <span
                        // Se actualizó flex-shrink-0 a shrink-0 👇
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: CLASS_COLORS[className] }}
                      />
                      <span className="text-xs text-foreground capitalize">{className}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}