import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { GroupedMedicationItem } from "./consultation-detail.types.patient";
import { PatientRecordGroupSkeleton } from "@/shared/components/patient-record-skeletons.component.shared";

interface MedicationGroup {
  formulary: string;
  count: number;
  medications: GroupedMedicationItem[];
}

interface ConsultationMedicationTabProps {
  isLoading: boolean;
  isError: boolean;
  medicationGroups: MedicationGroup[];
  onDownloadPdf: (med: GroupedMedicationItem) => void;
}

export function ConsultationMedicationTab({
  isLoading,
  isError,
  medicationGroups,
  onDownloadPdf,
}: ConsultationMedicationTabProps) {
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
        Failed to load medication data.
      </div>
    );
  }

  if (medicationGroups.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        No medication data found.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {medicationGroups.map((group, groupIndex) => (
        <div
          key={`${group.formulary}-${groupIndex}`}
          className="rounded-lg border border-border bg-[#F7F7F7] p-4"
        >
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">
              {group.formulary}
            </p>
            <p className="text-xs text-muted-foreground">
              {group.count} prescription{group.count > 1 ? "s" : ""}
            </p>
          </div>

          <div className="space-y-2">
            {group.medications.map((med) => (
              <div
                key={med._id}
                className="rounded-md bg-white border border-border px-3 py-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {med.medication}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {med.dose} {med.unit} • {med.interval} • {med.duration}{" "}
                      {med.duration_unit}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => onDownloadPdf(med)}
                  >
                    <Download className="mr-1 h-3.5 w-3.5" />
                    PDF
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
