import { Loader2, Upload, X } from "lucide-react";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import type { ControllerRenderProps, FieldError, FieldPath, FieldValues } from "react-hook-form";
import { toast } from "sonner";
import { FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { uploadToImgbb } from "@/lib/utils";
import { Button } from "./button";

interface ImageUploaderProps<TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues>> {
  label?: string;
  error?: FieldError;
  field: ControllerRenderProps<TFieldValues, TName>;
  onFileSelected?: (file: File) => void;
  multiple?: boolean;
  maxFiles?: number;
}

/**
 * ImageUploader component that automatically uploads images to ImgBB and returns URLs.
 * The field value will be a string (URL) for single mode or string[] (URLs) for multiple mode.
 */
const ImageUploader = <TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues>>({
  field,
  error,
  label = "Upload Images",
  onFileSelected,
  multiple = false,
  maxFiles = 5,
}: ImageUploaderProps<TFieldValues, TName>) => {
  const { value: files, onChange, onBlur } = field;
  const [isUploading, setIsUploading] = useState(false);

  const normalizedFiles = multiple
    ? Array.isArray(files)
      ? files.filter(Boolean)
      : files
        ? [files]
        : []
    : files
      ? [files]
      : [];

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (isUploading) return;

      if (multiple) {
        const currentFiles = normalizedFiles;

        if (currentFiles.length + acceptedFiles.length > maxFiles) {
          toast.error(`Maximum limit reached: ${maxFiles} images only.`);
          return;
        }
      }

      setIsUploading(true);

      try {
        const uploadPromises = acceptedFiles.map(async (file) => {
          const url = await uploadToImgbb(file);
          return url;
        });

        const uploadedUrls = await Promise.all(uploadPromises);

        if (multiple) {
          const currentFiles = normalizedFiles;
          const newFiles = [...currentFiles, ...uploadedUrls];
          onChange(newFiles);
        } else {
          onChange(uploadedUrls[0]);
        }

        if (onFileSelected && acceptedFiles.length > 0) {
          onFileSelected(acceptedFiles[0]);
        }

        toast.success(`${acceptedFiles.length} image(s) uploaded successfully!`);
      } catch (_error) {
        toast.error("Failed to upload image(s). Please try again.");
      } finally {
        setIsUploading(false);
      }
    },
    [onChange, normalizedFiles, onFileSelected, multiple, maxFiles, isUploading],
  );

  const removeFile = useCallback(
    (indexToRemove: number) => {
      if (multiple) {
        const currentFiles = normalizedFiles;
        const newFiles = currentFiles.filter((_: string, index: number) => index !== indexToRemove);
        onChange(newFiles);
      } else {
        onChange("");
      }
    },
    [onChange, normalizedFiles, multiple],
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    multiple,
    accept: { "image/*": [] },
    noClick: true,
    noKeyboard: true,
  });

  return (
    <FormItem className="w-full">
      <FormLabel>{label}</FormLabel>
      <div
        {...getRootProps()}
        className="flex w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed bg-muted/50 px-10 py-8 backdrop-blur-sm"
        onClick={open}
      >
        <input {...getInputProps()} onBlur={onBlur} />
        {isDragActive ? (
          <span className="font-semibold text-lg">Drop the image(s) here…</span>
        ) : isUploading ? (
          <div className="flex w-full flex-col items-center justify-center">
            <Loader2 className="size-8 animate-spin text-primary" />
            <span className="mt-2 font-medium text-[16px] leading-[16px]">Uploading image(s)...</span>
          </div>
        ) : normalizedFiles.length > 0 ? (
          <div className={`flex ${multiple ? "gap-2 overflow-x-auto px-2 py-2" : "justify-center"}`}>
            {normalizedFiles.map((file: string, index: number) => (
              <div key={index} className="relative flex-shrink-0">
                <img src={file} alt={`preview-${index}`} className="aspect-square h-24 w-24 rounded-md object-cover" />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="-top-2 -right-2 absolute h-6 w-6 cursor-pointer rounded-full p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(index);
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex w-full flex-col items-center justify-center">
            <div className="size-12 rounded-full bg-[#0F233F] p-3 text-white">
              <Upload className="size-full" />
            </div>
            <span className="font mt-5 mb-2 font-medium text-[16px] leading-[16px]">Click or Drag and Drop</span>
            <span className="font font-medium text-[16px] leading-[16px]">to upload an image.</span>
          </div>
        )}
      </div>
      {error && <FormMessage>{error.message}</FormMessage>}
    </FormItem>
  );
};

export default ImageUploader;
