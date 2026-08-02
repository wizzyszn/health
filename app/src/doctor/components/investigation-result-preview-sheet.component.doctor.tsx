import { useEffect, useState } from "react";
import {
  Beaker,
  Calendar,
  ChevronLeft,
  ChevronRight,
  FileText,
  Loader2,
  Stethoscope,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { formatZonedDate } from "@/lib/utils";
import { format } from "date-fns";
import {
  formatInvestigationLabel,
  getInvestigationDisplayFields,
} from "@/shared/utils/investigation-display.util";

export type InvestigationResultPreviewContext = {
  investigation: {
    _id: string;
    name: string;
    category?: string | null;
    test_requested?: string | null;
    priority?: string;
    specimen?: string;
    result_images?: string[];
    createdAt?: string;
    doctor_id?: {
      first_name?: string;
      last_name?: string;
      full_name?: string;
      specializations?: string[];
    };
  };
  consultation?: {
    _id?: string;
    title?: string;
    type?: string;
    appointment_id?: {
      appointment_number?: string;
      scheduled_start_at_utc?: string;
      reason_for_visit?: string;
    };
    doctor_id?: {
      first_name?: string;
      last_name?: string;
      full_name?: string;
      specializations?: string[];
    };
  } | null;
};

function InfoItem({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value?: React.ReactNode;
  icon?: typeof Calendar;
}) {
  if (value === undefined || value === null || value === "") return null;

  return (
    <div className="min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF] mb-1">
        {label}
      </p>
      <div className="flex items-start gap-2 text-sm text-[#374151]">
        {Icon && <Icon className="w-4 h-4 shrink-0 text-[#6B7280] mt-0.5" />}
        <span className="break-words">{value}</span>
      </div>
    </div>
  );
}

interface InvestigationResultPreviewSheetProps {
  context: InvestigationResultPreviewContext | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InvestigationResultPreviewSheet({
  context,
  open,
  onOpenChange,
}: InvestigationResultPreviewSheetProps) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);

  const investigation = context?.investigation;
  const consultation = context?.consultation;
  const resultImages = investigation?.result_images ?? [];
  const activeImageUrl = resultImages[activeImageIndex];

  const { category, priority, specimen } = getInvestigationDisplayFields(
    investigation || {},
  );
  const main = formatInvestigationLabel(investigation || {});
  const metaParts = [
    category && category !== "Other" ? `Category: ${category}` : "",
    specimen && specimen !== "-" ? `Specimen: ${specimen}` : "",
    priority ? `Priority: ${priority}` : "",
  ].filter(Boolean);

  const doctor = investigation?.doctor_id || consultation?.doctor_id;
  const doctorName =
    doctor?.full_name ||
    (doctor?.first_name && doctor?.last_name
      ? `Dr. ${doctor.first_name} ${doctor.last_name}`
      : undefined);

  const scheduledStart = consultation?.appointment_id?.scheduled_start_at_utc;
  const consultationDate = scheduledStart
    ? formatZonedDate(scheduledStart, {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : investigation?.createdAt
      ? format(new Date(investigation.createdAt), "MMM d, yyyy")
      : undefined;

  useEffect(() => {
    if (open) {
      setActiveImageIndex(0);
      setImageLoaded(false);
    }
  }, [open, investigation?._id]);

  useEffect(() => {
    if (!open || resultImages.length <= 1) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setImageLoaded(false);
        setActiveImageIndex(
          (prev) => (prev - 1 + resultImages.length) % resultImages.length,
        );
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        setImageLoaded(false);
        setActiveImageIndex((prev) => (prev + 1) % resultImages.length);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, resultImages.length]);

  const handlePrev = () => {
    if (resultImages.length === 0) return;
    setImageLoaded(false);
    setActiveImageIndex(
      (prev) => (prev - 1 + resultImages.length) % resultImages.length,
    );
  };

  const handleNext = () => {
    if (resultImages.length === 0) return;
    setImageLoaded(false);
    setActiveImageIndex((prev) => (prev + 1) % resultImages.length);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl md:max-w-2xl lg:max-w-3xl p-0 flex flex-col overflow-hidden"
      >
        <SheetHeader className="px-4 sm:px-6 pt-6 pb-4 border-b border-[#E5E7EB] shrink-0 pr-12 space-y-2">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#EAEDFF] flex items-center justify-center shrink-0">
              <Beaker className="w-5 h-5 text-[#5164E8]" />
            </div>
            <div className="min-w-0">
              <SheetTitle className="text-lg font-semibold text-[#1F2937] text-left">
                {main || "Investigation Result"}
              </SheetTitle>
              {metaParts.length > 0 && (
                <p className="text-xs text-[#6B7280] mt-1 leading-relaxed">
                  {metaParts.join(" • ")}
                </p>
              )}
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-[#E5E7EB]">
            <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg p-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoItem
                  label="Appointment Ref"
                  value={consultation?.appointment_id?.appointment_number}
                  icon={FileText}
                />
                <InfoItem
                  label="Consultation Date"
                  value={consultationDate}
                  icon={Calendar}
                />
                <InfoItem
                  label="Reason for Visit"
                  value={consultation?.appointment_id?.reason_for_visit}
                />
                <InfoItem
                  label="Ordered By"
                  value={doctorName}
                  icon={Stethoscope}
                />
                {priority && (
                  <InfoItem
                    label="Priority"
                    value={
                      <span
                        className={`inline-block text-xs px-2 py-0.5 rounded ${
                          priority.toLowerCase() === "stat"
                            ? "bg-red-100 text-red-700"
                            : priority.toLowerCase() === "urgent"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-violet-100 text-violet-700"
                        }`}
                      >
                        {priority}
                      </span>
                    }
                  />
                )}
                <InfoItem
                  label="Results Uploaded"
                  value={`${resultImages.length} ${
                    resultImages.length === 1 ? "file" : "files"
                  }`}
                />
              </div>
            </div>
          </div>

          <div className="px-4 sm:px-6 py-4 sm:py-5">
            <h3 className="text-sm font-semibold text-[#1F2937] mb-3">
              Result Images
            </h3>

            {activeImageUrl ? (
              <div className="space-y-4">
                <div className="relative flex min-h-[280px] w-full items-center justify-center rounded-lg border border-[#E5E7EB] bg-[#FAFAFA] p-3">
                  {!imageLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-[#5164E8]" />
                    </div>
                  )}
                  <img
                    src={activeImageUrl}
                    alt={`Investigation result ${activeImageIndex + 1}`}
                    className={`max-h-[60vh] w-full object-contain rounded transition-opacity duration-300 ${
                      imageLoaded ? "opacity-100" : "opacity-0"
                    }`}
                    onLoad={() => setImageLoaded(true)}
                  />
                </div>

                {resultImages.length > 1 && (
                  <>
                    <div className="flex items-center justify-between gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handlePrev}
                        className="h-8 text-xs"
                      >
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Previous
                      </Button>
                      <p className="text-xs font-medium text-[#6B7280]">
                        {activeImageIndex + 1} of {resultImages.length}
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleNext}
                        className="h-8 text-xs"
                      >
                        Next
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                      {resultImages.map((url, index) => (
                        <button
                          key={url}
                          type="button"
                          onClick={() => {
                            setImageLoaded(false);
                            setActiveImageIndex(index);
                          }}
                          className={`aspect-square rounded-md border overflow-hidden bg-white transition-colors ${
                            index === activeImageIndex
                              ? "border-[#5164E8] ring-2 ring-[#5164E8]/20"
                              : "border-[#E5E7EB] hover:border-[#5164E8]/50"
                          }`}
                        >
                          <img
                            src={url}
                            alt={`Thumbnail ${index + 1}`}
                            className="h-full w-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <p className="text-sm text-[#6B7280] text-center py-8">
                No result images available.
              </p>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
