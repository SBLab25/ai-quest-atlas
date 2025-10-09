import React, { useState, useEffect } from 'react';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from '@/components/ui/carousel';
import { cn } from '@/lib/utils';

interface PostImageCarouselProps {
  images: string[];
  alt?: string;
  className?: string;
  showCounter?: boolean;
  onImageClick?: (imageUrl: string, index: number) => void;
}

export const PostImageCarousel: React.FC<PostImageCarouselProps> = ({
  images,
  alt = "Post media",
  className,
  showCounter = true,
  onImageClick
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [api, setApi] = useState<CarouselApi>();
  
  useEffect(() => {
    if (!api) {
      return;
    }

    const onSelect = () => {
      setCurrentIndex(api.selectedScrollSnap());
    };

    api.on("select", onSelect);
    onSelect(); // Set initial value

    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  if (!images || images.length === 0) {
    return null;
  }

  const isVideo = (url: string) => {
    return url.includes('.mp4') || url.includes('.mov') || url.includes('.webm') || 
           url.includes('video') || url.toLowerCase().match(/\.(mp4|mov|webm|avi)$/);
  };

  const renderMedia = (url: string, index: number) => {
    if (isVideo(url)) {
      return (
        <video
          key={`video-${index}`}
          src={url}
          controls
          className={cn("w-full h-full object-cover", onImageClick ? "cursor-pointer" : "cursor-default")}
          playsInline
          preload="metadata"
          onClick={onImageClick ? () => onImageClick(url, index) : undefined}
          onError={(e) => {
            console.error('Failed to load video:', url);
            const target = e.target as HTMLVideoElement;
            target.style.display = 'none';
          }}
        />
      );
    } else {
      return (
        <img
          key={`image-${index}`}
          src={url}
          alt={`${alt} ${index + 1}`}
          loading="lazy"
          className={cn("w-full h-full object-cover", onImageClick ? "cursor-pointer" : "cursor-default")}
          onClick={onImageClick ? () => onImageClick(url, index) : undefined}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            console.error('Failed to load image:', url);
            target.style.display = 'none';
          }}
        />
      );
    }
  };

  if (images.length === 1) {
    return (
      <div className={cn("w-full h-full", className)}>
        {renderMedia(images[0], 0)}
      </div>
    );
  }

  return (
    <div className={cn("relative w-full h-full", className)}>
      <Carousel
        className="w-full h-full"
        opts={{
          align: "start",
          loop: true,
        }}
        setApi={setApi}
      >
        <CarouselContent className="h-full">
          {images.map((image, index) => (
            <CarouselItem key={index} className="h-full">
              {renderMedia(image, index)}
            </CarouselItem>
          ))}
        </CarouselContent>
        
        {/* Navigation buttons - only show if multiple images */}
        <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 bg-black/50 border-none text-white hover:bg-black/70" />
        <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 bg-black/50 border-none text-white hover:bg-black/70" />
        
        {/* Image counter */}
        {showCounter && images.length > 1 && (
          <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded-full text-xs font-medium">
            {currentIndex + 1}/{images.length}
          </div>
        )}
        
        {/* Dot indicators */}
        {images.length > 1 && images.length <= 5 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {images.map((_, index) => (
              <div
                key={index}
                className={cn(
                  "h-1.5 w-1.5 rounded-full transition-colors",
                  index === currentIndex ? "bg-white" : "bg-white/50"
                )}
              />
            ))}
          </div>
        )}
      </Carousel>
    </div>
  );
};