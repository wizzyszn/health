import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Globe, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ALL_TIMEZONES = (Intl as any).supportedValuesOf("timeZone") as string[];

interface TimezoneSelectorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export default function TimezoneSelector({
  value,
  onChange,
  className,
}: TimezoneSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce the search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const groupedTimezones = useMemo(() => {
    const term = debouncedSearch.toLowerCase().replace(/_/g, " ");
    const filtered = ALL_TIMEZONES.filter((tz) =>
      tz.toLowerCase().replace(/_/g, " ").includes(term),
    );

    const groups: Record<string, string[]> = {};
    filtered.forEach((tz) => {
      const parts = tz.split("/");
      const region = parts.length > 1 ? parts[0] : "Other";
      if (!groups[region]) groups[region] = [];
      groups[region].push(tz);
    });

    return groups;
  }, [debouncedSearch]);

  return (
    <div
      className={cn(
        "w-full rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden",
        className,
      )}
    >
      <div className="sticky top-0 z-10 flex flex-col space-y-1.5 border-b bg-card p-6">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold leading-none tracking-tight">
            Select Timezone
          </h3>
        </div>
        <p className="text-sm text-muted-foreground pt-2">
          Find and select your local timezone.
        </p>

        <div className="mt-4 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search city or region..."
            className="pl-9 h-11 w-full bg-muted/50 border-transparent focus-visible:bg-transparent focus-visible:border-primary"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div
          className={cn(
            "mt-4 p-4 rounded-lg flex items-center justify-between border transition-all duration-300",
            value
              ? "bg-primary/10 border-primary/20"
              : "bg-muted/50 border-transparent",
          )}
        >
          <span className="text-sm font-medium">Selected Timezone</span>
          <span className="text-sm font-bold text-primary">
            {value ? value.replace(/_/g, " ") : "No timezone selected"}
          </span>
        </div>
      </div>

      <div className="p-6 h-[400px] overflow-y-auto custom-scrollbar">
        {Object.keys(groupedTimezones).length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <Globe className="w-12 h-12 mb-3 opacity-20" />
            <p className="text-sm font-medium">
              No timezones found for "{debouncedSearch}"
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {Object.entries(groupedTimezones).map(([region, tzs]) => (
              <div key={region} className="space-y-4">
                <div className="flex items-center gap-2 border-b pb-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <h4 className="text-sm font-semibold text-foreground/80 uppercase tracking-wider">
                    {region}
                  </h4>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                  {tzs.map((tz) => {
                    const isSelected = value === tz;
                    const displayName = (
                      tz.split("/").slice(1).join("/") || tz
                    ).replace(/_/g, " ");
                    return (
                      <Button
                        key={tz}
                        type="button"
                        variant="ghost"
                        onClick={() => onChange(tz)}
                        className={cn(
                          "w-full transition-all relative text-xs px-2 h-10 border z-0 justify-center truncate",
                          isSelected
                            ? "text-primary-foreground border-primary"
                            : "bg-card border-border text-foreground hover:border-primary/50 hover:bg-primary/5 hover:text-primary",
                        )}
                        title={tz.replace(/_/g, " ")}
                      >
                        {isSelected && (
                          <motion.div
                            layoutId="active-timezone-slot"
                            className="absolute inset-0 bg-primary rounded-md -z-10"
                            initial={false}
                            animate={{ opacity: 1 }}
                            transition={{
                              type: "spring",
                              stiffness: 300,
                              damping: 25,
                            }}
                          />
                        )}
                        <span className="truncate">{displayName}</span>
                      </Button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
