import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export function ReferralSearchBar({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="relative">
      <Search
        className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#9CA3AF]"
        strokeWidth={2}
      />
      <Input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search by specialist, hospital or consultation…"
        className="h-12 rounded-[12px] border-0 bg-[#F7F7F7] pl-12 pr-4 text-sm text-[#2B2B2B] shadow-none placeholder:text-[#6C6C6C] focus-visible:ring-1 focus-visible:ring-primary"
      />
    </div>
  );
}
