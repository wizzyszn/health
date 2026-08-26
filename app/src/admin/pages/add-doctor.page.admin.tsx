import MainPageHeader from "@/shared/components/main-page-header.component.shared";
import AdminAddDoctorForm from "@/admin/components/add-doctor-form.component.admin";

export default function AdminAddDoctor() {
  return (
    <div className="space-y-8">
      <MainPageHeader
        heading="Add a doctor"
        subHeading="Create a doctor with name, email, optional phone number, and password."
      />
      <div className="rounded-3xl border border-border bg-white p-6 shadow-sm">
        <AdminAddDoctorForm />
      </div>
    </div>
  );
}
