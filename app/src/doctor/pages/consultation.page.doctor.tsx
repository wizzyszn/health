import MainPageHeader from "@/shared/components/main-page-header.component.shared";
import { ConsultationList } from "../components/consultation-list.component.doctor";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useEffect, useRef } from "react";
import { useDebounce } from "@/shared/hooks/use-debounce";

function Consultation() {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const searchInputRef = useRef<HTMLInputElement>(null);

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
          heading="All Consultations"
          subHeading="Manage your complete consultation history"
        />

        <div className="relative">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
            size={20}
          />
          <Input
            ref={searchInputRef}
            placeholder="Search by doctor's name, specialty, date, Ref ID or type...."
            className="pl-12 bg-[#F7F7F7] border-none rounded-[12px] h-14 text-base"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onClick={() => searchInputRef.current?.focus()}
          />
          <div
            className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-xs text-muted-foreground bg-white border border-border px-2 py-1 rounded shadow-sm opacity-70 cursor-pointer"
            onClick={() => searchInputRef.current?.focus()}
          >
            <span className="text-[10px] font-sans">⌘</span>
            <span className="font-medium">K</span>
          </div>
        </div>
      </div>

      <section className="flex-1 overflow-y-auto">
        <ConsultationList searchTerm={debouncedSearchTerm} />
      </section>
    </div>
  );
}

export default Consultation;
