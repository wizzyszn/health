import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import MainPageHeader from "@/shared/components/main-page-header.component.shared";
import { Input } from "@/components/ui/input";
import {
  PatientList,
  type DoctorPatient,
} from "@/doctor/components/patient-list.component.doctor";
import { useDebounce } from "@/shared/hooks/use-debounce";
import { getDoctorPatientsReq } from "@/config/service/doctor.service";

function PatientsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: [
      "doctor-patients",
      {
        q: debouncedSearchTerm,
        page: String(page),
        limit: String(limit),
      },
    ],
    queryFn: () =>
      getDoctorPatientsReq({
        q: debouncedSearchTerm,
        page: String(page),
        limit: String(limit),
      }),
    placeholderData: keepPreviousData,
  });

  const patients = (data?.data?.patients as DoctorPatient[]) || [];
  const totalPages = data?.data?.meta?.lastPage ?? 1;

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  return (
    <div className="flex flex-col h-full">
      <div className="sticky top-0 z-10 pb-4 space-y-4">
        <MainPageHeader
          heading="All Patients"
          subHeading="Search and open patient consultations"
        />

        <div className="relative">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
            size={20}
          />
          <Input
            ref={searchInputRef}
            placeholder="Search by name, full name, email, phone, registration number..."
            className="pl-12 bg-[#F7F7F7] border-none rounded-[12px] h-14 text-base"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            onClick={() => searchInputRef.current?.focus()}
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-xs text-muted-foreground bg-white border border-border px-2 py-1 rounded shadow-sm opacity-70">
            <span className="text-[10px] font-sans">⌘</span>
            <span className="font-medium">K</span>
          </div>
        </div>
      </div>

      <section className="flex-1 overflow-y-auto">
        <PatientList
          patients={patients}
          totalPages={totalPages}
          page={page}
          isLoading={isLoading || isFetching}
          isDebouncing={searchTerm !== debouncedSearchTerm}
          onPageChange={(nextPage) => setPage(nextPage)}
        />
      </section>
    </div>
  );
}

export default PatientsPage;
