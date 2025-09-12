import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ImageIcon, Upload, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ImageUploadProps {
  onImageUpload: (url: string) => void;
  onImageRemove: () => void;
  existingImage?: string;
  maxSize?: number; // in MB
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  onImageUpload,
  onImageRemove,
  existingImage,
  maxSize = 5
}) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(existingImage || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      toast({
        title: "File too large",
        description: `Please select an image smaller than ${maxSize}MB`,
        variant: "destructive"
      });
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive"
      });
      return;
    }

    try {
      setUploading(true);
      
      // Create preview
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);

      // Check if storage bucket exists by trying to upload
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `community-posts/${fileName}`;

      const { data, error } = await supabase.storage
        .from('community-images')
        .upload(filePath, file);

      if (error) {
        // If bucket doesn't exist, show specific error
        if (error.message.includes('Bucket not found')) {
          toast({
            title: "Storage not configured",
            description: "Please contact admin to set up image storage",
            variant: "destructive"
          });
        } else {
          throw error;
        }
        return;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('community-images')
        .getPublicUrl(filePath);

      onImageUpload(publicUrl);
      toast({
        title: "Image uploaded",
        description: "Your image has been uploaded successfully"
      });

    } catch (error: any) {
      console.error("Upload error:", error);
      
      let errorMessage = "Failed to upload image. Please try again.";
      if (error.message?.includes('column "image_url" does not exist')) {
        errorMessage = "Image uploads not supported yet. Database needs updating.";
      } else if (error.message?.includes('Bucket not found')) {
        errorMessage = "Image storage not configured. Please contact admin.";
      }
      
      toast({
        title: "Upload failed",
        description: errorMessage,
        variant: "destructive"
      });
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onImageRemove();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {preview ? (
        <Card className="relative">
          <CardContent className="p-4">
            <div className="relative">
              <img 
                src={preview} 
                alt="Upload preview" 
                className="w-full h-48 object-cover rounded-md"
              />
              <Button
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                onClick={handleRemove}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
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
                  Click to upload an image
                </p>
                <p className="text-xs text-muted-foreground">
                  Max size: {maxSize}MB
                </p>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {!preview && !uploading && (
        <Button
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          className="w-full"
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload Image
        </Button>
      )}
    </div>
  );
};