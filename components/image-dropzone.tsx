'use client';

import { useCallback, useState } from 'react';
import { Upload, Image as ImageIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface ImageDropzoneProps {
  onImageSelect: (image: HTMLImageElement) => void;
  onClear: () => void;
  hasImage: boolean;
  disabled?: boolean;
}

export function ImageDropzone({ onImageSelect, onClear, hasImage, disabled }: ImageDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const processFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        onImageSelect(img);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }, [onImageSelect]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (disabled) return;

    const file = e.dataTransfer.files[0];
    if (file) {
      processFile(file);
    }
  }, [disabled, processFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  }, [processFile]);

  if (hasImage) {
    return (
      <div className="flex items-center justify-center gap-2 p-3 bg-secondary/50 rounded-lg border border-border">
        <ImageIcon className="w-4 h-4 text-primary" />
        <span className="text-sm text-foreground">Image loaded</span>
        <Button variant="ghost" size="sm" onClick={onClear} className="ml-2 h-7 px-2">
          <X className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={cn(
        'relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg transition-all cursor-pointer',
        isDragging
          ? 'border-primary bg-primary/10'
          : 'border-border hover:border-primary/50 hover:bg-secondary/30',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <input
        type="file"
        accept="image/*"
        onChange={handleFileInput}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        disabled={disabled}
      />
      <Upload className={cn('w-10 h-10 mb-3', isDragging ? 'text-primary' : 'text-muted-foreground')} />
      <p className="text-sm font-medium text-foreground">
        {isDragging ? 'Drop image here' : 'Drag & drop an image'}
      </p>
      <p className="text-xs text-muted-foreground mt-1">or click to browse</p>
    </div>
  );
}
