import { Upload } from "lucide-react";
import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import type { ControllerRenderProps, FieldError } from "react-hook-form";
import type { z } from "zod";
import { FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { addItemSchema, registerSchema } from "@/lib/form-schemas";
import { uploadToImgbb } from "@/lib/utils";

interface ImageUploaderProps {
  label?: string;
  error?: FieldError;
  field: ControllerRenderProps<z.infer<typeof addItemSchema>> | ControllerRenderProps<z.infer<typeof registerSchema>>;
}

function ImageUploader({ field, error, label = "Upload an Image" }: ImageUploaderProps) {
  const { value: file, onChange, onBlur } = field;

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        const imageUrl = await uploadToImgbb(acceptedFiles[0]);
        onChange(imageUrl);
      }
    },
    [onChange],
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    multiple: false,
    accept: { "image/*": [] },
    noClick: true,
    noKeyboard: true,
  });

  return (
    <FormItem className="w-full">
      <FormLabel>{label}</FormLabel>
      <div
        {...getRootProps()}
        className="flex w-full cursor-pointer flex-col items-center justify-center gap-2.5 rounded-lg border-2 border-dashed bg-muted/50 px-10 py-10 backdrop-blur-sm"
        onClick={open}
      >
        <input {...getInputProps()} onBlur={onBlur} />

        {isDragActive ? (
          <span className="font-semibold text-lg">Drop the image here...</span>
        ) : file ? (
          <img src={file} alt="preview" className="aspect-square size-32 rounded-md object-cover" />
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
}

export default ImageUploader;
