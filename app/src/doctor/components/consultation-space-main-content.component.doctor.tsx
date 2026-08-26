import { useState, useMemo } from "react";
import { FileText, TestTube, Pill, Send, Loader2, Rocket } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

import { InvestigationModal } from "./modal/investigation.modal.component.doctor";
import { MedicationModal } from "./modal/medication1.modal.component.doctor";
import { ReferralModal } from "./modal/referral.modal.component.doctor";
import { RebookModal } from "./modal/rebook.modal.component.doctor";
import { InvestigationResultsForm } from "./forms/investigations-result.form.component";
import { PhysicalExamForm } from "./forms/physical-exam.form.component.doctor";
import { DiagnosisForm } from "./forms/diagnosis.form.component.doctor";
import { TreatmentPlanForm } from "./forms/treatment-plan.form.component.doctor";
import { HistoryTakingForm } from "./forms/history-taking.form.component.doctor";
import { ConsultationPreview } from "./consultation-preview.component.doctor";
import ClinicalStepper, {
  StepStatus,
} from "./clinical-stepper.component.doctor";
import {
  getHistoryTakingForConsultationReq,
  getPhysicalExamForConsultationReq,
  getInvestigationForConsultationReq,
  getDiagnosisForConsultationReq,
  getTreatmentPlanForConsultationReq,
  markConsultationAsCompleted,
} from "@/config/service/doctor.service";
import { ConsultationMode } from "../pages/view-consultation-space.page.doctor";

interface TabState {
  id: string;
  label: string;
  status: StepStatus;
}

export function ConsultationMainContent({
  consultationId,
  mode = "edit",
  patientId,
  patientMedical,
}: {
  consultationId?: string;
  mode?: ConsultationMode;
  /** Consultation's patient id — enables the referral attachments selector. */
  patientId?: string;
  patientMedical?: {
    allergies: string[];
    previousMedicalConditions: string[];
  };
}) {
  const [editingTab, setEditingTab] = useState<string | null>("history");
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);

  const queryClient = useQueryClient();

  const isLocked = mode === "locked";
  const isEditable = mode === "edit";

  const { mutate: completeConsultation, isPending: isCompleting } = useMutation(
    {
      mutationFn: () => markConsultationAsCompleted(consultationId!),
      onSuccess: () => {
        toast.success("Consultation finalized successfully");
        setPublishDialogOpen(false);
        setShowPreview(false);
        // Invalidate the wrapper query so mode re-computes to addendum/preview
        queryClient.invalidateQueries({ queryKey: ["consultation"] });
      },
      onError: (error) => {
        console.error(error);
        toast.error("Failed to finalize consultation");
      },
    },
  );

  const { data: historyRes } = useQuery({
    queryKey: ["consultation-history", consultationId],
    queryFn: () => getHistoryTakingForConsultationReq(consultationId!),
    enabled: !!consultationId,
    retry: false,
  });

  const { data: physicalRes } = useQuery({
    queryKey: ["consultation-physical", consultationId],
    queryFn: () => getPhysicalExamForConsultationReq(consultationId!),
    enabled: !!consultationId,
    retry: false,
  });

  const { data: investigationRes } = useQuery({
    queryKey: ["consultation-investigation", consultationId],
    queryFn: () => getInvestigationForConsultationReq(consultationId!),
    enabled: !!consultationId,
    retry: false,
  });

  const { data: diagnosisRes } = useQuery({
    queryKey: ["consultation-diagnosis", consultationId],
    queryFn: () => getDiagnosisForConsultationReq(consultationId!),
    enabled: !!consultationId,
    retry: false,
  });

  const { data: treatmentRes } = useQuery({
    queryKey: ["consultation-treatment", consultationId],
    queryFn: () => getTreatmentPlanForConsultationReq(consultationId!),
    enabled: !!consultationId,
    retry: false,
  });

  const tabs: TabState[] = useMemo(() => {
    const getStatus = (status?: string): StepStatus => {
      if (status === "COMPLETED") return "completed";
      if (status === "INCOMPLETE") return "in-progress";
      return "pending";
    };

    return [
      {
        id: "history",
        label: "History",
        status: getStatus(historyRes?.data?.status),
      },
      {
        id: "physical",
        label: "Physical",
        status: getStatus(physicalRes?.data?.status),
      },
      {
        id: "investigation",
        label: "Investigation",
        status: getStatus(investigationRes?.data?.status),
      },
      {
        id: "diagnosis",
        label: "Diagnosis",
        status: getStatus(diagnosisRes?.data?.status),
      },
      {
        id: "treatment",
        label: "Treatment Plan",
        status: getStatus(treatmentRes?.data?.status),
      },
    ];
  }, [
    historyRes?.data?.status,
    physicalRes?.data?.status,
    investigationRes?.data?.status,
    diagnosisRes?.data?.status,
    treatmentRes?.data?.status,
  ]);

  const handleTabEdit = (tabId: string) => {
    setEditingTab(editingTab === tabId ? null : tabId);
  };

  const handleSave = () => {
    // Keep the current form visible after a normal save.
  };

  const handleSaveAndContinue = () => {
    const currentIndex = tabs.findIndex((t) => t.id === editingTab);
    if (currentIndex >= 0 && currentIndex < tabs.length - 1) {
      setEditingTab(tabs[currentIndex + 1].id);
    } else {
      setEditingTab(null);
    }
  };

  // ── Render branch 1: preview and addendum modes hand off to ConsultationPreview.
  // "preview" → read-only view for any non-owner doctor on a completed consultation.
  // "addendum" → assigned doctor via patient route; ConsultationPreview handles
  //              the addendum UX for the preview layer; individual forms handle it
  //              for the stepper layer (see branch 3 below).
  if (mode === "preview" || mode === "addendum") {
    return (
      <ConsultationPreview consultationId={consultationId ?? ""} mode={mode} />
    );
  }

  // ── Render branch 2: edit mode, doctor triggered preview-before-publish ──
  if (isEditable && showPreview) {
    return (
      <>
        <ConsultationPreview
          consultationId={consultationId ?? ""}
          mode="edit"
          onBack={() => setShowPreview(false)}
          onPublish={() => setPublishDialogOpen(true)}
        />
        <Dialog open={publishDialogOpen} onOpenChange={setPublishDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Publish Clinical Record</DialogTitle>
              <DialogDescription>
                Are you sure you want to mark this consultation as completed?
                This action will finalize the clinical record. You can only
                append addendums going forward.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setPublishDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => completeConsultation()}
                disabled={isCompleting}
              >
                {isCompleting ? (
                  <Loader2 className="animate-spin w-4 h-4" />
                ) : (
                  "Confirm Finalize"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // ── Render branch 3: edit mode (normal flow) OR locked mode (patient route,
  //    unassigned doctor). Both show the stepper + forms; mode is passed to every
  //    form so each one drives its own disabled/addendum state correctly.
  //    The bottom action bar is hidden in locked mode — an unassigned doctor
  //    should not be able to order investigations, medications, or referrals.
  return (
    <div className="flex flex-col h-full">
      <div className="sticky top-0 z-20 shadow-sm">
        <ClinicalStepper
          steps={tabs}
          currentEditingId={editingTab}
          onStepEdit={handleTabEdit}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {editingTab === "history" && (
          <HistoryTakingForm
            consultationId={consultationId}
            mode={mode}
            onCancel={() => setEditingTab(null)}
            onSave={handleSave}
            onSaveAndContinue={handleSaveAndContinue}
          />
        )}

        {editingTab === "physical" && (
          <PhysicalExamForm
            consultationId={consultationId}
            mode={mode}
            onCancel={() => setEditingTab(null)}
            onSave={handleSave}
            onSaveAndContinue={handleSaveAndContinue}
          />
        )}

        {editingTab === "investigation" && (
          <InvestigationResultsForm
            consultationId={consultationId}
            mode={mode}
            onCancel={() => setEditingTab(null)}
            onSave={handleSave}
            onSaveAndContinue={handleSaveAndContinue}
          />
        )}

        {editingTab === "diagnosis" && (
          <DiagnosisForm
            consultationId={consultationId}
            mode={mode}
            onCancel={() => setEditingTab(null)}
            onSave={handleSave}
            onSaveAndContinue={handleSaveAndContinue}
          />
        )}

        {editingTab === "treatment" && (
          <TreatmentPlanForm
            consultationId={consultationId}
            mode={mode}
            onCancel={() => setEditingTab(null)}
            onSave={handleSave}
            onSaveAndContinue={handleSaveAndContinue}
          />
        )}

        {!editingTab && (
          <div className="text-center text-[#6B7280] py-12">
            <p>
              Select a tab above and click Edit to view and modify consultation
              details
            </p>
          </div>
        )}
      </div>

      {/* Bottom Action Bar: hidden in locked mode.
          An unassigned doctor arriving via the patient route should not be
          able to order investigations, medications, or referrals. */}
      {!isLocked && (
        <div className="mt-auto bg-white border-t border-[#E5E7EB] p-3 sm:p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10 shrink-0">
          <div className="flex flex-wrap justify-center sm:justify-start gap-2 sm:gap-3 w-full">
            <button
              onClick={() => setActiveModal("investigation")}
              className="flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2.5 bg-[#5164E8] text-white rounded-md hover:bg-[#4153D7] transition-colors shadow-sm text-xs sm:text-sm font-medium flex-1 sm:flex-none justify-center"
            >
              <TestTube className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Investigation</span>
            </button>
            <button
              onClick={() => setActiveModal("medication")}
              className="flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2.5 bg-[#5164E8] text-white rounded-md hover:bg-[#4153D7] transition-colors shadow-sm text-xs sm:text-sm font-medium flex-1 sm:flex-none justify-center"
            >
              <Pill className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Medication</span>
            </button>
            <button
              onClick={() => setActiveModal("referral")}
              className="flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2.5 bg-[#5164E8] text-white rounded-md hover:bg-[#4153D7] transition-colors shadow-sm text-xs sm:text-sm font-medium flex-1 sm:flex-none justify-center"
            >
              <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Referral</span>
            </button>
            <button
              onClick={() => setActiveModal("rebook")}
              className="flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2.5 bg-[#5164E8] text-white rounded-md hover:bg-[#4153D7] transition-colors shadow-sm text-xs sm:text-sm font-medium flex-1 sm:flex-none justify-center"
            >
              <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Rebook</span>
            </button>

            {/* "Completed" button only makes sense in edit mode — the assigned
                doctor on a completed consultation (addendum mode) has no reason
                to re-finalize, and locked doctors can't reach this bar anyway. */}
            {isEditable && (
              <button
                onClick={() => setShowPreview(true)}
                className="flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2.5 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors shadow-sm text-xs sm:text-sm font-medium w-full sm:w-auto sm:ml-auto justify-center mt-1 sm:mt-0"
              >
                <Rocket className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Publish</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      {activeModal === "investigation" && (
        <InvestigationModal
          onClose={() => setActiveModal(null)}
          consultationId={consultationId ?? ""}
        />
      )}
      {activeModal === "medication" && (
        <MedicationModal
          onClose={() => setActiveModal(null)}
          consultationId={consultationId}
        />
      )}
      {activeModal === "referral" && (
        <ReferralModal
          onClose={() => setActiveModal(null)}
          consultationId={consultationId ?? ""}
          patientId={patientId}
          patientMedical={patientMedical}
        />
      )}
      {activeModal === "rebook" && (
        <RebookModal onClose={() => setActiveModal(null)} />
      )}
    </div>
  );
}
