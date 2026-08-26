import { useRef, useState, useEffect } from "react";
import { Eye, Upload, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatInvestigationLabel } from "@/shared/utils/investigation-display.util";
import type { InvestigationItem } from "./consultation-detail.types.patient";

interface ConsultationInvestigationUploadItemProps {
  investigation: InvestigationItem;
  isUploading: boolean;
  onUpload: (investigationId: string, files: File[]) => Promise<void>;
}

export function ConsultationInvestigationUploadItem({
  investigation,
  isUploading,
  onUpload,
}: ConsultationInvestigationUploadItemProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [viewResultIndex, setViewResultIndex] = useState<number | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  const resultImages = investigation.result_images ?? [];
  const activeResultUrl =
    viewResultIndex !== null ? resultImages[viewResultIndex] : null;

  const handleOpenResults = () => {
    if (resultImages.length > 0) {
      setViewResultIndex(0);
      setImageLoaded(false);
    }
  };

  const handlePrevResult = () => {
    setViewResultIndex((prev) => {
      if (prev === null) return 0;
      return prev === 0 ? resultImages.length - 1 : prev - 1;
    });
    setImageLoaded(false);
  };

  const handleNextResult = () => {
    setViewResultIndex((prev) => {
      if (prev === null) return 0;
      return prev === resultImages.length - 1 ? 0 : prev + 1;
    });
    setImageLoaded(false);
  };

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
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [viewResultIndex, resultImages.length]);

  return (
    <>
      <div className="rounded-lg border border-border bg-[#F7F7F7] p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-foreground">
              {formatInvestigationLabel(investigation)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Investigation ID: {investigation._id.slice(-8).toUpperCase()}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 justify-end">
            {resultImages.length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={handleOpenResults}
              >
                <Eye className="mr-1 h-3.5 w-3.5" />
                View Results ({resultImages.length})
              </Button>
            )}

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-1 h-3.5 w-3.5" />
                  Upload Result
                </>
              )}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={async (event) => {
                const files = Array.from(event.target.files ?? []);
                if (files.length === 0) return;
                await onUpload(investigation._id, files);
                event.currentTarget.value = "";
              }}
            />
          </div>
        </div>
      </div>

      <Dialog
        open={viewResultIndex !== null}
        onOpenChange={(open) => {
          if (!open) {
            setViewResultIndex(null);
            setImageLoaded(false);
          }
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {formatInvestigationLabel(investigation)} — Results
            </DialogTitle>
            {resultImages.length > 1 && (
              <p className="text-xs text-muted-foreground mt-1">
                Use left/right arrow keys to navigate and Esc to close.
              </p>
            )}
          </DialogHeader>

          <div className="flex flex-col items-center gap-4 py-2">
            {activeResultUrl && (
              <div className="relative w-full flex items-center justify-center min-h-[300px] bg-muted rounded-lg overflow-hidden">
                {!imageLoaded && (
                  <Loader2 className="h-6 w-6 animate-spin text-primary absolute" />
                )}
                <img
                  key={activeResultUrl}
                  src={activeResultUrl}
                  alt={`Result ${viewResultIndex !== null ? viewResultIndex + 1 : ""}`}
                  className={`max-h-[500px] max-w-full object-contain transition-opacity duration-200 ${
                    imageLoaded ? "opacity-100" : "opacity-0"
                  }`}
                  onLoad={() => setImageLoaded(true)}
                />
              </div>
            )}

            {resultImages.length > 1 && (
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevResult}
                  className="h-8 text-xs"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <p className="text-sm text-muted-foreground">
                  {viewResultIndex !== null ? viewResultIndex + 1 : 0} of{" "}
                  {resultImages.length}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextResult}
                  className="h-8 text-xs"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
