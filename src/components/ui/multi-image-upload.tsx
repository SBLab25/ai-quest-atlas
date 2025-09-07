import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ImageIcon, Upload, X, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface MultiImageUploadProps {
  onImagesUpdate: (urls: string[]) => void;
  existingImages?: string[];
  maxImages?: number;
  maxSize?: number; // in MB
}

export const MultiImageUpload: React.FC<MultiImageUploadProps> = ({
  onImagesUpdate,
  existingImages = [],
  maxImages = 3,
  maxSize = 5
}) => {
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState<string[]>(existingImages);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    // Check if adding these files would exceed max limit
    if (images.length + files.length > maxImages) {
      toast({
        title: "Too many images",
        description: `You can only upload up to ${maxImages} images`,
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    const newUrls: string[] = [];

    try {
      for (const file of files) {
        // Validate file size
        if (file.size > maxSize * 1024 * 1024) {
          toast({
            title: "File too large",
            description: `Please select images smaller than ${maxSize}MB`,
            variant: "destructive"
          });
          continue;
        }

        // Validate file type
        if (!file.type.startsWith("image/")) {
          toast({
            title: "Invalid file type",
            description: "Please select image files only",
            variant: "destructive"
          });
          continue;
        }

        // Upload file
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `community-posts/${fileName}`;

        const { data, error } = await supabase.storage
          .from('community-images')
          .upload(filePath, file);

        if (error) {
          if (error.message.includes('Bucket not found')) {
            toast({
              title: "Storage not configured",
              description: "Please contact admin to set up image storage",
              variant: "destructive"
            });
          } else {
            throw error;
          }
          continue;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('community-images')
          .getPublicUrl(filePath);

        newUrls.push(publicUrl);
      }

      if (newUrls.length > 0) {
        const updatedImages = [...images, ...newUrls];
        setImages(updatedImages);
        onImagesUpdate(updatedImages);
        
        toast({
          title: "Images uploaded",
          description: `${newUrls.length} image(s) uploaded successfully`
        });
      }

    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: "Failed to upload images. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = (index: number) => {
    const updatedImages = images.filter((_, i) => i !== index);
    setImages(updatedImages);
    onImagesUpdate(updatedImages);
  };

  const canAddMore = images.length < maxImages;

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Display uploaded images */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          {images.map((url, index) => (
            <Card key={index} className="relative">
              <CardContent className="p-2">
                <div className="relative">
                  <img 
                    src={url} 
                    alt={`Upload ${index + 1}`} 
                    className="w-full h-32 object-cover rounded-md"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-1 right-1 h-6 w-6 p-0"
                    onClick={() => handleRemoveImage(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {/* Add more button */}
          {canAddMore && (
            <Card 
              className="border-dashed border-2 cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <CardContent className="flex flex-col items-center justify-center h-32 text-center">
                {uploading ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                ) : (
                  <>
                    <Plus className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-xs text-muted-foreground">
                      Add image
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Initial upload area when no images */}
      {images.length === 0 && (
        <Card 
          className="border-dashed border-2 cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <CardContent className="flex flex-col items-center justify-center p-8 text-center">
            {uploading ? (
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            ) : (
              <>
                <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground mb-2">
                  Click to upload images (up to {maxImages})
                </p>
                <p className="text-xs text-muted-foreground">
                  Max size: {maxSize}MB each
                </p>
              </>
            )}
          </CardContent>
        </Card>
      )}
      
      {/* Upload button */}
      {images.length === 0 && !uploading && (
        <Button
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          className="w-full"
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload Images
        </Button>
      )}

      {/* Info text */}
      <p className="text-xs text-muted-foreground text-center">
        {images.length}/{maxImages} images selected
      </p>
    </div>
  );
};