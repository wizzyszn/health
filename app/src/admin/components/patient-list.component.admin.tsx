import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/shared/hooks/use-debounce";
import { Pagination } from "@/shared/components/pagination.component.shared";
import AdminPatientItemRow from "@/admin/components/patient-item-row.component.admin";
import { getAllPatientsReq } from "@/config/service/admin.service";
import type { AdminPatient } from "@/admin/types/admin.types";
import { GeneralReturnInt, PatientProfileInterface } from "@/lib/types";

export default function AdminPatientList() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);

  const { data, isLoading } = useQuery<
    GeneralReturnInt<{
      patients?: PatientProfileInterface[];
      items?: PatientProfileInterface[];
      meta?: {
        page: number;
        perPage: number;
        total: number;
        lastPage: number;
      };
      pagination?: {
        page: number;
        perPage: number;
        total: number;
        totalPages: number;
      };
    }>
  >({
    queryKey: ["admin-patients", page, debouncedSearch],
    queryFn: () =>
      getAllPatientsReq({
        page: String(page),
        perPage: String(10),
        q: debouncedSearch,
      }),
    placeholderData: (previousData) => previousData,
  });

  const patients: AdminPatient[] =
    (data?.data?.patients || data?.data?.items || []).map((patient) => ({
      ...patient,
      full_name: `${patient.first_name} ${patient.last_name}`,
    })) ?? [];

  const meta = data?.data?.meta;
  const pagination = data?.data?.pagination;
  const totalPages = meta?.lastPage ?? pagination?.totalPages ?? 1;

  return (
    <div className="flex flex-col h-full">
      <div className="sticky top-0 z-10 pb-4 space-y-4">
        <div className="relative">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
            size={20}
          />
          <Input
            placeholder="Search by patient name, email, registration number..."
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            className="pl-12 bg-[#F7F7F7] border-none rounded-[12px] h-14 text-base"
          />
        </div>
      </div>

      <section className="flex-1 overflow-y-auto">
        <div className="w-full rounded-xl bg-white shadow-sm border border-border p-4">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="h-[72px] w-full rounded-xl bg-muted animate-pulse border border-border mb-3"
              />
            ))
          ) : patients.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No patients found.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {patients.map((patient) => (
                <Link
                  key={patient._id}
                  to={`/admin/dashboard/patients/${patient._id}`}
                  className="block"
                >
                  <AdminPatientItemRow patient={patient} />
                </Link>
              ))}
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
