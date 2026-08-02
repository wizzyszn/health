import { Card, CardContent } from "@/components/ui/card";
import { MoreVertical, type LucideIcon } from "lucide-react";

export interface MetricCardProps {
  label: string;
  value: number;
  subtitle: string;
  icon: LucideIcon;
  bgLight: string;
  isLoading?: boolean;
}

export function MetricCard({
  label,
  value,
  subtitle,
  icon: Icon,
  bgLight,
  isLoading,
}: MetricCardProps) {
  return (
    <Card
      className={`group relative overflow-hidden border-0 ${bgLight} shadow-md hover:shadow-lg transition-all duration-300 cursor-default rounded-2xl`}
    >
      <CardContent className="p-5 flex flex-col justify-between">
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 rounded-full bg-black/10 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
            <Icon className="size-6 text-black" />
          </div>

          <button className="text-black/50 hover:text-black transition-colors">
            <MoreVertical className="size-5" />
          </button>
        </div>

        <div className="space-y-2 flex-grow">
          {isLoading ? (
            <>
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="h-8 w-12 rounded-md bg-black/15 animate-pulse" />
                <span className="h-6 w-28 rounded-md bg-black/15 animate-pulse" />
              </div>
              <span className="block h-4 w-36 rounded-md bg-black/10 animate-pulse" />
            </>
          ) : (
            <>
              <div className="flex items-baseline gap-2 flex-wrap">
                <p className="text-2xl font-bold text-black">{value}</p>
                <h3 className="text-lg font-semibold text-black">{label}</h3>
              </div>

              <p className="text-xs text-black/60 font-normal">{subtitle}</p>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
