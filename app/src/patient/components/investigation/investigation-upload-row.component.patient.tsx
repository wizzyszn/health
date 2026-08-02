import { useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { uploadInvestigationResultImageReq } from "@/config/service/patient.service";
import { cn } from "@/lib/utils";

import { formatInvestigationLabel } from "@/shared/utils/investigation-display.util";
import { InvestigationRaw } from "./investigation.types.patient";

export function InvestigationUploadRow({
  inv,
  doctor,
}: {
  inv: InvestigationRaw;
  doctor: InvestigationRaw["doctor_id"];
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const [isUploading, setIsUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [viewResultIndex, setViewResultIndex] = useState<number | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const resultImages = inv.result_images || [];

  const resetSelection = () => {
    setSelectedFiles([]);
    previewUrls.forEach((url) => URL.revokeObjectURL(url));
    setPreviewUrls([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setSelectedFiles((prev) => [...prev, ...files]);
      setPreviewUrls((prev) => [
        ...prev,
        ...files.map((file) => URL.createObjectURL(file)),
      ]);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    try {
      await uploadInvestigationResultImageReq(inv._id, selectedFiles);
      toast.success("Result uploaded successfully");
      resetSelection();
      queryClient.invalidateQueries({ queryKey: ["patient-investigations"] });
    } catch {
      toast.error("Failed to upload result");
    } finally {
      setIsUploading(false);
    }
  };

  const handleOpenResults = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setImageLoaded(false);
    setViewResultIndex(0);
  };

  const handlePrevResult = () => {
    if (viewResultIndex === null || resultImages.length === 0) return;
    setImageLoaded(false);
    setViewResultIndex(
      (viewResultIndex - 1 + resultImages.length) % resultImages.length,
    );
  };

  const handleNextResult = () => {
    if (viewResultIndex === null || resultImages.length === 0) return;
    setImageLoaded(false);
    setViewResultIndex((viewResultIndex + 1) % resultImages.length);
  };

  const activeResultUrl =
    viewResultIndex !== null ? resultImages[viewResultIndex] : null;

  useEffect(() => {
    if (viewResultIndex === null) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        handlePrevResult();
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        handleNextResult();
      }

      if (event.key === "Escape") {
        event.preventDefault();
        setViewResultIndex(null);
        setImageLoaded(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [viewResultIndex, resultImages.length]);

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-[#F0F0F0] bg-white p-3 shadow-sm">
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-full min-w-0 flex-col sm:flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-semibold text-[#2B2B2B]">
              {formatInvestigationLabel(inv)}
            </span>
            <span className="shrink-0 rounded bg-[#EAEDFF] px-2 py-[2px] text-[10px] font-medium tracking-tight text-primary">
              Prescribed
            </span>
          </div>
          <span className="mt-0.5 truncate text-xs text-[#6C6C6C]">
            Status: Active • Doctor:{" "}
            {doctor?.full_name ||
              `Dr. ${doctor?.first_name} ${doctor?.last_name}`}
          </span>
        </div>

        <div className="flex w-full flex-wrap items-center justify-start gap-2 border-t border-gray-200/60 pt-2 sm:w-auto sm:justify-end sm:border-none sm:pt-0">
          {resultImages.length > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex h-8 items-center rounded-[8px] border border-[#EFEFEF] px-3 text-xs font-medium text-primary shadow-none hover:bg-[#F7F7F7]"
              onClick={handleOpenResults}
            >
              <Eye className="mr-1.5 h-3 w-3" />
              View Results ({resultImages.length})
            </Button>
          )}

          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileChange}
          />

          {selectedFiles.length === 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 rounded-[8px] border-[#EFEFEF] text-xs font-medium shadow-none hover:bg-[#F7F7F7]"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
            >
              <Upload className="mr-1.5 h-3 w-3" />
              {resultImages.length > 0 ? "Add More Result" : "Select File"}
            </Button>
          )}
        </div>
      </div>

      <Dialog
        open={previewUrls.length > 0}
        onOpenChange={(open) => {
          if (!open && !isUploading) {
            resetSelection();
          }
        }}
      >
        <DialogContent className="flex flex-col gap-4 p-6 sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-lg font-medium text-[#2B2B2B]">
              Upload Result
            </DialogTitle>
          </DialogHeader>

          {previewUrls.length > 0 && (
            <div className="mb-2 flex w-full items-center justify-between">
              <span className="text-sm font-normal text-[#2B2B2B]">
                Selected Files ({previewUrls.length})
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 cursor-pointer rounded-[6px] text-xs font-medium"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                Add another file
              </Button>
            </div>
          )}

          {previewUrls.length > 0 && (
            <div className="grid max-h-[50vh] w-full grid-cols-2 gap-3 overflow-y-auto rounded-lg border border-[#F0F0F0] bg-[#FAFAFA] p-3 sm:grid-cols-3">
              {previewUrls.map((url, idx) => (
                <div
                  key={url}
                  className="group relative flex h-32 flex-col overflow-hidden rounded-md border border-[#EFEFEF] bg-white shadow-sm"
                >
                  <img
                    src={url}
                    alt="preview"
                    className="h-24 w-full object-cover"
                  />
                  <button
                    type="button"
                    className="absolute right-1.5 top-1.5 rounded-full bg-white p-1 opacity-80 shadow-sm transition-opacity hover:opacity-100 focus:opacity-100 disabled:opacity-50"
                    onClick={() => handleRemoveFile(idx)}
                    disabled={isUploading}
                  >
                    <X className="h-3 w-3 text-red-500" />
                  </button>
                  <div className="flex-[1_0_0] truncate bg-white px-2 py-1.5 text-[11px] font-medium text-[#2B2B2B]">
                    {selectedFiles[idx]?.name}
                  </div>
                </div>
              ))}
            </div>
          )}

          <DialogFooter className="mt-2 flex w-full items-center gap-3 sm:justify-between">
            <Button
              type="button"
              variant="outline"
              className="min-w-[100px] rounded-[8px] text-[#2B2B2B]"
              onClick={resetSelection}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="min-w-[120px] rounded-[8px]"
              onClick={handleUpload}
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading
                </>
              ) : (
                "Upload Result"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={viewResultIndex !== null}
        onOpenChange={(open) => {
          if (!open) {
            setViewResultIndex(null);
            setImageLoaded(false);
          }
        }}
      >
        <DialogContent className="flex flex-col gap-4 p-6 sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle className="text-lg font-medium text-[#2B2B2B]">
              Investigation Result
            </DialogTitle>
            {resultImages.length > 1 && (
              <p className="text-xs text-[#6C6C6C]">
                Use left/right arrow keys to navigate and Esc to close.
              </p>
            )}
          </DialogHeader>

          {activeResultUrl && (
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="relative flex min-h-[300px] w-full justify-center rounded-lg border border-[#F0F0F0] bg-[#FAFAFA] p-2">
                {!imageLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                )}
                <img
                  src={activeResultUrl}
                  alt="result"
                  className={cn(
                    "max-h-[75vh] rounded object-contain transition-opacity duration-300",
                    imageLoaded ? "opacity-100" : "opacity-0",
                  )}
                  onLoad={() => setImageLoaded(true)}
                />
              </div>

              {resultImages.length > 1 && viewResultIndex !== null && (
                <div className="flex w-full items-center justify-between gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9 rounded-[8px] border-[#EFEFEF] px-3 text-xs font-medium"
                    onClick={handlePrevResult}
                  >
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    Previous
                  </Button>

                  <p className="text-xs font-medium text-[#6C6C6C]">
                    {viewResultIndex + 1} of {resultImages.length}
                  </p>

                  <Button
                    type="button"
                    variant="outline"
                    className="h-9 rounded-[8px] border-[#EFEFEF] px-3 text-xs font-medium"
                    onClick={handleNextResult}
                  >
                    Next
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
