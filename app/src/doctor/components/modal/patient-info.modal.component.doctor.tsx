import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Consultation } from "@/lib/types";
import { memo } from "react";
type Props = {
  patientInfo: Consultation;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};
const PatientInfo = memo(({ open, onOpenChange, patientInfo }: Props) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>Patient Information</DialogHeader>
        <div className="grid grid-cols-2 gap-4 pt-4">
          {[
            {
              title: "Full Name",
              value: `${patientInfo.patient_first_name} ${patientInfo.patient_last_name}`,
            },
            { title: "Age", value: patientInfo.patient_age },
            { title: "Gender", value: patientInfo.patient_gender },
            {
              title: "Marital Status",
              value: patientInfo.patient_marital_status,
            },
            {
              title: "Occupation",
              value: patientInfo.patient_occupation,
            },
            { title: "Address", value: patientInfo.patient_address },
          ].map((info) => (
            <div key={info.title}>
              <h3 className="text-muted-foreground">{info.title}</h3>
              <h4 className="text-xl font-normal">{info.value}</h4>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
});

export default PatientInfo;
