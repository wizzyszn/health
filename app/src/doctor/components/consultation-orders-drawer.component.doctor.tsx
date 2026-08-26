import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, ClipboardList, Pill, Beaker, Send } from "lucide-react";
// import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getInvestigationListForConsultationReq,
  getMedicationsForConsultation,
  listReferralsForConsultationReq,
  // updateMedicationRecordReq,
} from "@/config/service/doctor.service";
import {
  formatInvestigationLabel,
  getInvestigationDisplayFields,
} from "@/shared/utils/investigation-display.util";

export function ConsultationOrdersDrawer({
  consultationId,
}: {
  consultationId: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewResultUrl, setViewResultUrl] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  // const queryClient = useQueryClient();

  // const generatePrescriptionMutation = useMutation({
  //   mutationFn: (medicationId: string) =>
  //     updateMedicationRecordReq({ assign_to_patient: true }, medicationId),
  //   onSuccess: () => {
  //     toast.success("Prescription generated and assigned to patient.");
  //     queryClient.invalidateQueries({
  //       queryKey: ["consultation-medications-list", consultationId],
  //     });
  //   },
  //   onError: (error: Error) => {
  //     toast.error(error.message || "Failed to generate prescription.");
  //   },
  // });

  const { data: investigationsRes, isLoading: isLoadingInv } = useQuery({
    queryKey: ["consultation-investigations-list", consultationId],
    queryFn: () => getInvestigationListForConsultationReq(consultationId),
    enabled: isOpen && !!consultationId,
  });

  const { data: medicationsRes, isLoading: isLoadingMed } = useQuery({
    queryKey: ["consultation-medications-list", consultationId],
    queryFn: () => getMedicationsForConsultation(consultationId),
    enabled: isOpen && !!consultationId,
  });

  const { data: referralsRes, isLoading: isLoadingRef } = useQuery({
    queryKey: ["referrals", consultationId],
    queryFn: () => listReferralsForConsultationReq(consultationId),
    enabled: isOpen && !!consultationId,
  });

  // Handle array structures safely
  const investigations = Array.isArray(investigationsRes?.data)
    ? (investigationsRes?.data ?? [])
    : [];
  const medications = Array.isArray(medicationsRes?.data)
    ? (medicationsRes?.data ?? [])
    : [];
  const referrals = Array.isArray(referralsRes?.data)
    ? (referralsRes?.data ?? [])
    : [];

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          className="flex items-center justify-center gap-2 h-10 px-4 rounded-[8px] border-[#EFEFEF] shadow-sm hover:bg-[#F7F7F7]"
        >
          <ClipboardList className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-[#2B2B2B]">Orders</span>
        </Button>
      </SheetTrigger>

      <SheetContent className="sm:max-w-md w-full overflow-y-auto flex flex-col gap-4 sm:gap-6 p-4 sm:p-6">
        <SheetHeader>
          <SheetTitle className="text-xl font-semibold text-[#2B2B2B]">
            Orders
          </SheetTitle>
        </SheetHeader>

        <Tabs
          defaultValue="investigations"
          className="w-full flex flex-col min-h-0 flex-1"
        >
          <TabsList className="grid w-full grid-cols-3 rounded-[8px] bg-[#F7F7F7] p-1 h-11">
            <TabsTrigger
              value="investigations"
              className="flex items-center gap-2 rounded-[6px] data-[state=active]:bg-white data-[state=active]:shadow-sm h-full text-sm font-medium"
            >
              <Beaker className="h-4 w-4" />
              Tests
            </TabsTrigger>
            <TabsTrigger
              value="medications"
              className="flex items-center gap-2 rounded-[6px] data-[state=active]:bg-white data-[state=active]:shadow-sm h-full text-sm font-medium"
            >
              <Pill className="h-4 w-4" />
              Rx
            </TabsTrigger>
            <TabsTrigger
              value="referrals"
              className="flex items-center gap-2 rounded-[6px] data-[state=active]:bg-white data-[state=active]:shadow-sm h-full text-sm font-medium"
            >
              <Send className="h-4 w-4" />
              Referrals
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto min-h-0 mt-4">
            <TabsContent
              value="investigations"
              className="m-0 flex flex-col gap-4"
            >
              {isLoadingInv ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : investigations.length === 0 ? (
                <div className="text-center p-8 border border-dashed border-[#EFEFEF] rounded-[12px] bg-[#FAFAFA] text-[#6C6C6C]">
                  <p className="text-sm font-medium">
                    No investigations requested
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {investigations.map((inv, idx) => {
                    const { category, priority, specimen } =
                      getInvestigationDisplayFields(inv);

                    return (
                      <div
                        key={inv._id || idx}
                        className="p-3 sm:p-4 border border-[#EFEFEF] rounded-[12px] bg-white shadow-sm flex flex-col gap-1.5 hover:border-primary/50 transition-colors"
                      >
                        <span className="font-medium text-sm text-[#2B2B2B]">
                          {formatInvestigationLabel(inv)}
                        </span>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-[#6C6C6C]">
                          {category && category !== "Other" && (
                            <span className="rounded bg-[#F7F7F7] px-2 py-0.5">
                              {category}
                            </span>
                          )}
                          {specimen && specimen !== "-" && (
                            <span className="rounded bg-[#F7F7F7] px-2 py-0.5">
                              Specimen: {specimen}
                            </span>
                          )}
                          {priority && (
                            <span className="rounded bg-[#F7F7F7] px-2 py-0.5">
                              {priority}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span
                            className={`text-xs font-semibold px-2 py-0.5 rounded self-start ${
                              inv.assign_to_patient
                                ? "bg-green-50 text-green-600"
                                : "bg-amber-50 text-amber-600"
                            }`}
                          >
                            {inv.assign_to_patient
                              ? "Assigned to patient"
                              : "Pending"}
                          </span>
                          {inv.result_images &&
                            inv.result_images.length > 0 &&
                            inv.result_images.map((imgUrl, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setViewResultUrl(imgUrl);
                                }}
                                className="bg-[#F7F7F7] border border-[#EFEFEF] font-medium px-2 py-0.5 rounded-[4px] text-xs text-primary hover:bg-[#EFEFEF] transition-colors"
                              >
                                View Result{" "}
                                {(inv.result_images?.length ?? 0) > 1
                                  ? i + 1
                                  : ""}
                              </button>
                            ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent
              value="medications"
              className="m-0 flex flex-col gap-4"
            >
              {isLoadingMed ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : medications.length === 0 ? (
                <div className="text-center p-8 border border-dashed border-[#EFEFEF] rounded-[12px] bg-[#FAFAFA] text-[#6C6C6C]">
                  <p className="text-sm font-medium">
                    No medications prescribed
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {medications.map((med, idx) => (
                    <div
                      key={idx}
                      className="p-3 sm:p-4 border border-[#EFEFEF] rounded-[12px] bg-white shadow-sm flex flex-col gap-2.5 hover:border-primary/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-medium text-sm text-[#2B2B2B]">
                          {med.medication}
                        </div>
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded shrink-0 ${
                            med.assign_to_patient
                              ? "bg-green-50 text-green-600"
                              : "bg-amber-50 text-amber-600"
                          }`}
                        >
                          {med.assign_to_patient
                            ? "Assigned to patient"
                            : "Pending"}
                        </span>
                      </div>
                      <div className="text-xs flex flex-wrap items-center gap-x-1 sm:gap-x-2 gap-y-1 sm:gap-y-1.5 text-[#6C6C6C]">
                        <span className="bg-[#F7F7F7] px-2 py-1 rounded-[6px] text-[#2B2B2B]">
                          Dose:{" "}
                          <span className="font-semibold">
                            {med.dose} {med.unit}
                          </span>
                        </span>
                        <span className="bg-[#F7F7F7] px-2 py-1 rounded-[6px] text-[#2B2B2B]">
                          Freq:{" "}
                          <span className="font-semibold">{med.interval}</span>
                        </span>
                        <span className="bg-[#F7F7F7] px-2 py-1 rounded-[6px] text-[#2B2B2B]">
                          Dur:{" "}
                          <span className="font-semibold">
                            {med.duration} {med.duration_unit}
                          </span>
                        </span>
                        {med.formulary && (
                          <span className="bg-[#EAEDFF] text-primary font-semibold px-2 py-1 rounded-[6px]">
                            {med.formulary}
                          </span>
                        )}
                      </div>
                      {/* {!med.assign_to_patient && (
                        <button
                          type="button"
                          disabled={generatePrescriptionMutation.isPending}
                          onClick={() =>
                            generatePrescriptionMutation.mutate(med._id)
                          }
                          className="mt-1 self-start flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#5164E8] bg-indigo-50 border border-[#5164E8] rounded-[6px] hover:bg-indigo-100 transition-colors disabled:opacity-50"
                        >
                          {generatePrescriptionMutation.isPending ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <FileText className="w-3 h-3" />
                          )}
                          Generate Prescription
                        </button>
                      )} */}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="referrals" className="m-0 flex flex-col gap-4">
              {isLoadingRef ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : referrals.length === 0 ? (
                <div className="text-center p-8 border border-dashed border-[#EFEFEF] rounded-[12px] bg-[#FAFAFA] text-[#6C6C6C]">
                  <p className="text-sm font-medium">No referrals created</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {referrals.map((ref, idx) => (
                    <div
                      key={ref._id || idx}
                      className="p-3 sm:p-4 border border-[#EFEFEF] rounded-[12px] bg-white shadow-sm flex flex-col gap-1.5 hover:border-primary/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          {ref.referred_doctor_name ? (
                            <>
                              <div className="font-medium text-sm text-[#2B2B2B]">
                                {ref.referred_doctor_name}
                              </div>
                              <div className="text-xs text-[#6C6C6C]">
                                {ref.specialist_name}
                                {ref.hospital && ` • ${ref.hospital}`}
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="font-medium text-sm text-[#2B2B2B]">
                                {ref.specialist_name}
                              </div>
                              <div className="text-xs text-[#6C6C6C]">
                                {ref.hospital}
                              </div>
                            </>
                          )}
                        </div>
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded shrink-0 ${
                            ref.assign_to_patient
                              ? "bg-green-50 text-green-600"
                              : "bg-amber-50 text-amber-600"
                          }`}
                        >
                          {ref.assign_to_patient
                            ? "Assigned to patient"
                            : "Pending"}
                        </span>
                      </div>
                      <p className="text-sm text-[#2B2B2B] mt-0.5">
                        {ref.referral_details}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </SheetContent>

      <Dialog
        open={!!viewResultUrl}
        onOpenChange={(open) => {
          if (!open) {
            setViewResultUrl(null);
            setImageLoaded(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-[700px] flex flex-col gap-4 p-6 z-[60]">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-[#2B2B2B]">
              Investigation Result
            </DialogTitle>
          </DialogHeader>

          {viewResultUrl && (
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="relative flex w-full min-h-[300px] justify-center rounded-lg border border-[#F0F0F0] bg-[#FAFAFA] p-2">
                {!imageLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                )}
                <img
                  src={viewResultUrl}
                  alt="result"
                  className={`max-h-[75vh] object-contain rounded transition-opacity duration-300 ${
                    imageLoaded ? "opacity-100" : "opacity-0"
                  }`}
                  onLoad={() => setImageLoaded(true)}
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Sheet>
  );
}
