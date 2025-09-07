import { Upload, X } from "lucide-react";
import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import type { ControllerRenderProps, FieldError, FieldPath, FieldValues } from "react-hook-form";
import { toast } from "sonner";
import { FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "./button";

interface ImageUploaderProps<TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues>> {
  label?: string;
  error?: FieldError;
  field: ControllerRenderProps<TFieldValues, TName>;
  onFileSelected?: (file: File) => void;
  multiple?: boolean;
  maxFiles?: number;
}

const ImageUploader = <TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues>>({
  field,
  error,
  label = "Upload Images",
  onFileSelected,
  multiple = false,
  maxFiles = 5,
}: ImageUploaderProps<TFieldValues, TName>) => {
  const { value: files, onChange, onBlur } = field;

  const normalizedFiles = multiple ? (Array.isArray(files) ? files : files ? [files] : []) : files ? [files] : [];

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (multiple) {
        const currentFiles = normalizedFiles;

        if (currentFiles.length + acceptedFiles.length > maxFiles) {
          toast.error(`Maximum limit reached: ${maxFiles} images only.`);
          return;
        }

        const newFiles = [...currentFiles, ...acceptedFiles];
        onChange(newFiles);
      } else {
        onChange(acceptedFiles[0]);
      }

      if (onFileSelected && acceptedFiles.length > 0) {
        onFileSelected(acceptedFiles[0]);
      }
    },
    [onChange, normalizedFiles, onFileSelected, multiple, maxFiles],
  );

  const removeFile = useCallback(
    (indexToRemove: number) => {
      if (multiple) {
        const currentFiles = normalizedFiles;
        const newFiles = currentFiles.filter((_, index) => index !== indexToRemove);
        onChange(newFiles);
      } else {
        onChange(null);
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
        ) : normalizedFiles.length > 0 ? (
          <div className={`flex ${multiple ? "gap-2 overflow-x-auto px-2 py-2" : "justify-center"}`}>
            {normalizedFiles.map((file: File | string, index: number) => (
              <div key={index} className="relative flex-shrink-0">
                <img
                  src={typeof file === "string" ? file : URL.createObjectURL(file)}
                  alt={`preview-${index}`}
                  className="aspect-square h-24 w-24 rounded-md object-cover"
                />
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
