import { PatientProfileInterface } from "@/lib/types";

interface AdminPatientDetailProps {
  patient: PatientProfileInterface;
}

export default function AdminPatientDetail({
  patient,
}: AdminPatientDetailProps) {
  function calculateAge(dob: string | null | undefined): string {
    if (!dob) return "";
    const birthDate = new Date(dob);
    if (isNaN(birthDate.getTime())) return "";

    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return String(age);
  }

  const fullName = `${patient.first_name} ${patient.last_name}`.trim();
  const age = calculateAge(patient.date_of_birth);
  return (
    <div className="grid grid-cols-[1fr_320px] gap-6">
      <div className="bg-card rounded-[20px] border border-border p-6 min-w-0">
        <div className="flex items-center gap-4 mb-6 p-4 bg-[#F7F7F7] rounded-xl">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary text-lg font-semibold">
            {patient.first_name?.charAt(0) || "P"}
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-foreground">
              {fullName}
            </h2>
            <p className="text-sm text-muted-foreground">
              {patient.registration_no || "Patient ID not available"}
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 mb-6 text-sm text-muted-foreground">
          <div>
            <p className="font-medium text-foreground">Email</p>
            <p>{patient.email}</p>
          </div>
          <div>
            <p className="font-medium text-foreground">Phone</p>
            <p>{patient.phone_number || "Not provided"}</p>
          </div>
          <div>
            <p className="font-medium text-foreground">DOB</p>
            <p>{patient.date_of_birth?.split("T")[0] || "N/A"}</p>
          </div>
          <div>
            <p className="font-medium text-foreground">Gender</p>
            <p>{patient.gender || "Unspecified"}</p>
          </div>
        </div>

        <div className="border-t border-border mb-6" />

        <div className="grid gap-4 sm:grid-cols-2 text-sm text-muted-foreground">
          <div>
            <p className="font-medium text-foreground">Marital status</p>
            <p>{patient.marital_status || "Unspecified"}</p>
          </div>
          <div>
            <p className="font-medium text-foreground">Occupation</p>
            <p>{patient.occupation || "Unspecified"}</p>
          </div>
          <div className="sm:col-span-2">
            <p className="font-medium text-foreground">Address</p>
            <p>{patient.address || "Unspecified"}</p>
          </div>
        </div>
      </div>

      <aside className="space-y-6">
        <div className="bg-card rounded-xl border border-border p-5 sticky top-6">
          <h3 className="text-sm font-semibold text-[#727171] mb-4">
            Patient summary
          </h3>
          <div className="space-y-4 text-sm text-muted-foreground">
            <div>
              <p className="font-medium text-foreground">Age</p>
              <p>{age || "N/A"}</p>
            </div>
            <div>
              <p className="font-medium text-foreground">Registration #</p>
              <p>{patient.registration_no || "N/A"}</p>
            </div>
            <div>
              <p className="font-medium text-foreground">Profile verified</p>
              <p>{patient.profile_picture_url ? "Yes" : "No"}</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold text-[#727171] mb-4">
            Medical history
          </h3>
          <div className="space-y-4 text-sm text-muted-foreground">
            <div>
              <p className="font-medium text-foreground">Allergies</p>
              <p>
                {patient.allergies?.length
                  ? patient.allergies.join(", ")
                  : "None"}
              </p>
            </div>
            <div>
              <p className="font-medium text-foreground">Previous conditions</p>
              <p>
                {patient.previous_medical_conditions?.length
                  ? patient.previous_medical_conditions.join(", ")
                  : "None"}
              </p>
            </div>
            <div>
              <p className="font-medium text-foreground">Medical flags</p>
              <p>
                {patient.medical_flags?.length
                  ? patient.medical_flags.join(", ")
                  : "None"}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
