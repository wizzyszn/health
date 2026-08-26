import MainPageHeader from "@/shared/components/main-page-header.component.shared";
import AdminPatientList from "@/admin/components/patient-list.component.admin";

export default function AdminPatients() {
  return (
    <div className="space-y-8">
      <MainPageHeader
        heading="Patient registry"
        subHeading="Search all patients and open records from a single admin dashboard."
      />
      <AdminPatientList />
    </div>
  );
}
