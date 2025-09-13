import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Crop, RotateCcw } from 'lucide-react';

interface ImageCropperProps {
  imageUrl: string;
  onCropComplete: (croppedBlob: Blob) => void;
  onCancel: () => void;
}

export const ImageCropper: React.FC<ImageCropperProps> = ({
  imageUrl,
  onCropComplete,
  onCancel,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [cropPosition, setCropPosition] = useState({ x: 0, y: 0 });
  const [cropSize, setCropSize] = useState(200);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    const image = new Image();
    image.onload = () => {
      imageRef.current = image;
      setImageLoaded(true);
      drawCanvas();
      
      // Center the crop circle initially
      const canvas = canvasRef.current;
      if (canvas) {
        setCropPosition({
          x: (canvas.width - cropSize) / 2,
          y: (canvas.height - cropSize) / 2,
        });
      }
    };
    image.src = imageUrl;
  }, [imageUrl, cropSize]);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image || !imageLoaded) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to fit image while maintaining aspect ratio
    const maxSize = 400;
    let { width, height } = image;
    
    if (width > height) {
      if (width > maxSize) {
        height = (height * maxSize) / width;
        width = maxSize;
      }
    } else {
      if (height > maxSize) {
        width = (width * maxSize) / height;
        height = maxSize;
      }
    }

    canvas.width = width;
    canvas.height = height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw the image
    ctx.drawImage(image, 0, 0, width, height);
    
    // Create overlay with hole for crop circle
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, width, height);
    
    // Cut out the crop circle
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(
      cropPosition.x + cropSize / 2,
      cropPosition.y + cropSize / 2,
      cropSize / 2,
      0,
      2 * Math.PI
    );
    ctx.fill();
    ctx.restore();
    
    // Draw crop circle border
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(
      cropPosition.x + cropSize / 2,
      cropPosition.y + cropSize / 2,
      cropSize / 2,
      0,
      2 * Math.PI
    );
    ctx.stroke();
  }, [cropPosition, cropSize, imageLoaded]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  const handleMouseDown = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if click is inside the crop circle
    const centerX = cropPosition.x + cropSize / 2;
    const centerY = cropPosition.y + cropSize / 2;
    const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);

    if (distance <= cropSize / 2) {
      setIsDragging(true);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left - cropSize / 2;
    const y = e.clientY - rect.top - cropSize / 2;

    // Constrain to canvas bounds
    const maxX = canvas.width - cropSize;
    const maxY = canvas.height - cropSize;

    setCropPosition({
      x: Math.max(0, Math.min(maxX, x)),
      y: Math.max(0, Math.min(maxY, y)),
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleCrop = () => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image) return;

    // Create a new canvas for the cropped result
    const cropCanvas = document.createElement('canvas');
    const cropCtx = cropCanvas.getContext('2d');
    if (!cropCtx) return;

    const outputSize = 300; // Output size for the profile image
    cropCanvas.width = outputSize;
    cropCanvas.height = outputSize;

    // Calculate scale factors
    const scaleX = image.naturalWidth / canvas.width;
    const scaleY = image.naturalHeight / canvas.height;

    // Calculate crop area in original image coordinates
    const sourceX = cropPosition.x * scaleX;
    const sourceY = cropPosition.y * scaleY;
    const sourceSize = cropSize * Math.min(scaleX, scaleY);

    // Create circular clipping path
    cropCtx.beginPath();
    cropCtx.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, 2 * Math.PI);
    cropCtx.clip();

    // Draw the cropped portion
    cropCtx.drawImage(
      image,
      sourceX,
      sourceY,
      sourceSize,
      sourceSize,
      0,
      0,
      outputSize,
      outputSize
    );

    // Convert to blob
    cropCanvas.toBlob((blob) => {
      if (blob) {
        onCropComplete(blob);
      }
    }, 'image/png');
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -10 : 10;
    const newSize = Math.max(50, Math.min(300, cropSize + delta));
    
    // Adjust position to keep crop circle centered on the same spot
    const sizeDiff = newSize - cropSize;
    setCropPosition(prev => ({
      x: Math.max(0, prev.x - sizeDiff / 2),
      y: Math.max(0, prev.y - sizeDiff / 2),
    }));
    
    setCropSize(newSize);
  };

  if (!imageLoaded) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="text-center mb-4">
          <h3 className="font-semibold flex items-center justify-center gap-2">
            <Crop className="h-4 w-4" />
            Crop Your Profile Picture
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Drag the circle to position, scroll to resize
          </p>
        </div>
        
        <div className="flex justify-center mb-4">
          <canvas
            ref={canvasRef}
            className="border border-muted rounded-lg cursor-move"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
          />
        </div>
        
        <div className="flex gap-2 justify-center">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleCrop} className="flex items-center gap-2">
            <Crop className="h-4 w-4" />
            Crop & Upload
          </Button>
        </div>
      </Card>
    </div>
  );
};
