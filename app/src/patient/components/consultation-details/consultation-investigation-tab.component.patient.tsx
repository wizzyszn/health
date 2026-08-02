import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConsultationInvestigationUploadItem } from "./consultation-investigation-upload-item.component.patient";
import type { InvestigationItem } from "./consultation-detail.types.patient";
import { PatientRecordGroupSkeleton } from "@/shared/components/patient-record-skeletons.component.shared";

interface InvestigationSummary {
  investigation_count?: number;
}

interface ConsultationInvestigationTabProps {
  isLoading: boolean;
  isError: boolean;
  investigationItems: InvestigationItem[];
  investigationSummary: InvestigationSummary | undefined;
  uploadingInvestigationId: string | null;
  onUpload: (investigationId: string, files: File[]) => Promise<void>;
  onDownloadRequest: () => void;
}

export function ConsultationInvestigationTab({
  isLoading,
  isError,
  investigationItems,
  investigationSummary,
  uploadingInvestigationId,
  onUpload,
  onDownloadRequest,
}: ConsultationInvestigationTabProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        <PatientRecordGroupSkeleton count={2} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        Failed to load investigation data.
      </div>
    );
  }

  if (investigationItems.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        No investigation data found.
      </div>
    );
  }

  const count =
    investigationSummary?.investigation_count ?? investigationItems.length;

  return (
    <div className="space-y-3 md:space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between rounded-lg border border-border bg-[#F7F7F7] p-3 gap-2 sm:gap-0">
        <p className="text-sm font-medium text-foreground">
          {count} investigation{count > 1 ? "s" : ""}
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 md:h-9 text-xs"
          onClick={onDownloadRequest}
        >
          <Download className="mr-1.5 h-3.5 w-3.5" />
          Download Request
        </Button>
      </div>

      {investigationItems.map((investigation) => (
        <ConsultationInvestigationUploadItem
          key={investigation._id}
          investigation={investigation}
          isUploading={uploadingInvestigationId === investigation._id}
          onUpload={onUpload}
        />
      ))}
    </div>
  );
}
