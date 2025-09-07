import React, { useRef, useState, useCallback } from 'react';
import { Upload } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface MobileFileInputProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSize?: number;
  className?: string;
  disabled?: boolean;
  useCapture?: boolean;
}

export const MobileFileInput: React.FC<MobileFileInputProps> = ({
  onFileSelect,
  accept = "image/*,video/*,application/pdf",
  maxSize = 10 * 1024 * 1024, // 10MB
  className = "",
  disabled = false,
  useCapture = false,
}) => {
  const isMobile = useIsMobile();
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > maxSize) {
        alert(`File size must be less than ${(maxSize / 1024 / 1024).toFixed(1)}MB`);
        return;
      }
      onFileSelect(file);
    }
    setIsUploading(false);
  }, [onFileSelect, maxSize]);

  return (
    <div className={className}>
      {/* Styled label containing a full-size transparent input (most reliable on mobile) */}
      <label
        role="button"
        tabIndex={0}
        aria-label="Upload file"
        className={`relative block rounded-lg border-2 border-dashed p-6 text-center transition-all duration-200 ease-in-out cursor-pointer select-none ${
          disabled ? 'border-border bg-muted cursor-not-allowed' : 'border-border bg-background hover:border-primary hover:bg-accent/20'
        } ${isUploading ? 'opacity-50' : ''}`}
      >
        {/* Full-size transparent input positioned over the label to catch the tap */}
        <input
          type="file"
          accept={accept}
          onChange={handleFileChange}
          capture={useCapture && isMobile ? "environment" : undefined}
          disabled={disabled}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        <div className="flex flex-col items-center justify-center space-y-3 pointer-events-none">
          <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full">
            <Upload className="w-6 h-6 text-primary" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">Tap to Upload</p>
            <p className="text-xs text-muted-foreground">
              Images, videos or PDF (MAX. {(maxSize / 1024 / 1024).toFixed(1)}MB)
            </p>
          </div>
        </div>
      </label>
    </div>
  );
};
