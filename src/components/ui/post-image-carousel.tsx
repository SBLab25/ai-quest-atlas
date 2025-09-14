import React, { useState, useEffect } from 'react';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from '@/components/ui/carousel';
import { cn } from '@/lib/utils';

interface PostImageCarouselProps {
  images: string[];
  alt?: string;
  className?: string;
  showCounter?: boolean;
}

export const PostImageCarousel: React.FC<PostImageCarouselProps> = ({
  images,
  alt = "Post image",
  className,
  showCounter = true
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

  if (images.length === 1) {
    return (
      <AspectRatio ratio={1} className={className}>
        <img
          src={images[0]}
          alt={alt}
          loading="lazy"
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            console.error('Failed to load image:', images[0]);
            target.style.display = 'none';
          }}
        />
      </AspectRatio>
    );
  }

  return (
    <div className={cn("relative w-full h-full", className)}>
      <AspectRatio ratio={1} className="w-full h-full">
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
              <img
                src={image}
                alt={`${alt} ${index + 1}`}
                loading="lazy"
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  console.error('Failed to load image:', image);
                  target.style.display = 'none';
                }}
              />
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
      </AspectRatio>
    </div>
  );
};