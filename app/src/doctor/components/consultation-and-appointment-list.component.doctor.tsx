import { TabbedList } from "@/shared/components/tabbed-list.component.shared";
import { ConsultationList } from "./consultation-list.component.doctor";
import { AppointmentList } from "./appointment-list.component.doctor";

// consultation-and-appointment-list.component.doctor.tsx
export function DoctorConsultationAndAppointmentList() {
  return (
    <TabbedList
      tabs={[
        {
          value: "consultations",
          label: "Consultations",
          content: <ConsultationList inTabs />,
        },
        {
          value: "appointments",
          label: "Appointments",
          content: <AppointmentList inTabs />,
        },
      ]}
    />
  );
}
