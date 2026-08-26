import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getSinglePatientReq } from "@/config/service/admin.service";
import MainPageHeader from "@/shared/components/main-page-header.component.shared";
import Spinner from "@/shared/components/spinner.component";
import AdminPatientDetail from "@/admin/components/patient-detail.component.admin";

export default function AdminPatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-patient", id],
    queryFn: () => (id ? getSinglePatientReq(id) : Promise.reject()),
    enabled: Boolean(id),
  });

  const patient = data?.data;

  if (isLoading) {
    return <Spinner className="h-svh w-full" />;
  }

  if (!patient) {
    return (
      <div className="rounded-3xl border border-border bg-white p-8 text-center">
        <p className="text-muted-foreground">Patient not found.</p>
        <Link
          to="/admin/dashboard/patients"
          className="text-primary hover:underline"
        >
          Back to patients
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <MainPageHeader
          heading={`${patient.first_name} ${patient.last_name}`}
          subHeading="Patient record details"
        />
        <Link
          to="/admin/dashboard/patients"
          className="text-sm font-medium text-primary hover:underline"
        >
          Back to patient list
        </Link>
      </div>

      <AdminPatientDetail patient={patient} />
    </div>
  );
}
