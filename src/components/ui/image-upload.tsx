import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, FileImage } from "lucide-react";

interface ImageUploadProps {
  onImageUpload: (url: string) => void;
  bucket: string;
  folder?: string;
  maxSize?: number; // in MB
  accept?: string;
  className?: string;
  existingImageUrl?: string; // Add this to handle existing images
}

export function ImageUpload({
  onImageUpload,
  bucket,
  folder = "",
  maxSize = 5,
  accept = "image/*",
  className = "",
  existingImageUrl = "",
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string>(existingImageUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Update preview when existingImageUrl changes
  useEffect(() => {
    setPreview(existingImageUrl);
  }, [existingImageUrl]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      toast({
        title: "File too large",
        description: `Please select an image smaller than ${maxSize}MB`,
        variant: "destructive",
      });
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Upload to Supabase
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = folder ? `${user.id}/${folder}/${fileName}` : `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      onImageUpload(filePath);
      
      toast({
        title: "Success",
        description: "Image uploaded successfully",
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
      setPreview("");
    } finally {
      setUploading(false);
    }
  };

  const clearPreview = () => {
    setPreview("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <Input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        disabled={uploading}
        className="hidden"
      />
      
      {!preview ? (
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full h-32 border-dashed border-2 flex flex-col items-center justify-center gap-2"
        >
          {uploading ? (
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          ) : (
            <>
              <Upload className="h-6 w-6" />
              <span>Click to upload image</span>
              <span className="text-xs text-muted-foreground">Max size: {maxSize}MB</span>
            </>
          )}
        </Button>
      ) : (
        <div className="relative">
          <img
            src={preview.startsWith('http') ? preview : `${supabase.storage.from(bucket).getPublicUrl('').data.publicUrl}/${preview}`}
            alt="Preview"
            className="w-full h-32 object-cover rounded-md border"
          />
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={clearPreview}
            className="absolute top-2 right-2"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}
      
      {preview && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <FileImage className="h-4 w-4" />
          <span>Image ready for upload</span>
        </div>
      )}
    </div>
  );
}