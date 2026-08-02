import MainPageHeader from "@/shared/components/main-page-header.component.shared";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { AppointmentList } from "../components/appointment-list.component.doctor";
import { useDebounce } from "@/shared/hooks/use-debounce";

function Appointment() {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  return (
    <div className="flex flex-col h-full">
      <div className="sticky top-0 z-10 pb-4 space-y-4">
        <MainPageHeader
          heading="All Appointments"
          subHeading="Manage your complete appointment history"
        />

        <div className="relative">
          <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4 md:w-5 md:h-5" />
          <Input
            placeholder="Search by doctor's name, specialty, date, Ref ID or type...."
            className="pl-10 md:pl-12 bg-[#F7F7F7] border-none rounded-[12px] h-12 md:h-14 text-sm md:text-base placeholder:text-sm placeholder:truncate"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <section className="flex-1 overflow-y-auto">
        <AppointmentList searchTerm={debouncedSearchTerm} />
      </section>
    </div>
  );
}

export default Appointment;
