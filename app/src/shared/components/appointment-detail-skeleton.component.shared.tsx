import { MoveLeft } from "lucide-react";

export function AppointmentDetailSkeleton() {
  return (
    <div className="p-4 md:p-6">
      <div className="mb-4 md:mb-6">
        <div className="mb-4 md:mb-5 flex items-center text-sm font-medium text-muted-foreground">
          <MoveLeft className="w-4 h-4 mr-2" />
          <span>Back</span>
        </div>
        <div className="h-7 w-56 rounded-md bg-black/15 animate-pulse" />
        <div className="mt-2 h-4 w-40 rounded-md bg-black/10 animate-pulse" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4 md:gap-6">
        <div className="bg-card rounded-[20px] border border-border p-4 md:p-6 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-5 md:mb-6 p-4 bg-[#F7F7F7] rounded-lg border border-border/50">
            <div className="w-10 h-10 rounded-full bg-black/15 animate-pulse shrink-0" />
            <div className="space-y-2">
              <div className="h-4 w-40 rounded-md bg-black/15 animate-pulse" />
              <div className="h-3 w-28 rounded-md bg-black/10 animate-pulse" />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 sm:gap-12 mb-4 md:mb-5">
            <SkeletonIconText widthClass="w-28" />
            <SkeletonIconText widthClass="w-36" />
          </div>

          <div className="flex flex-col sm:flex-row gap-4 sm:gap-12 mb-6 md:mb-8">
            <SkeletonIconText widthClass="w-24" />
            <SkeletonIconText widthClass="w-28" />
          </div>

          <div className="border-t border-border mb-5 md:mb-6" />

          <SectionSkeleton titleWidthClass="w-36">
            <div className="ml-0 md:ml-6 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="h-4 w-32 rounded-md bg-black/10 animate-pulse"
                />
              ))}
            </div>
          </SectionSkeleton>

          <div className="border-t border-border mb-5 md:mb-6" />

          <SectionSkeleton titleWidthClass="w-32">
            <div className="ml-0 md:ml-6 rounded-lg border border-border bg-[#F7F7F7] p-3 space-y-2">
              <div className="h-4 w-full rounded-md bg-black/10 animate-pulse" />
              <div className="h-4 w-5/6 rounded-md bg-black/10 animate-pulse" />
              <div className="h-4 w-2/3 rounded-md bg-black/10 animate-pulse" />
            </div>
          </SectionSkeleton>

          <SectionSkeleton titleWidthClass="w-24">
            <div className="ml-0 md:ml-6 space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-black/15 animate-pulse" />
                  <span className="h-4 w-4/5 rounded-md bg-black/10 animate-pulse" />
                </div>
              ))}
            </div>
          </SectionSkeleton>
        </div>

        <div className="mt-4 md:mt-0">
          <div className="bg-card rounded-xl border border-border p-4 md:p-5 sticky top-4 md:top-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="h-4 w-16 rounded-md bg-black/15 animate-pulse" />
              <div className="h-6 w-24 rounded-full bg-black/10 animate-pulse" />
            </div>
            <div className="space-y-3 flex flex-col">
              <div className="h-12 rounded-[12px] bg-black/15 animate-pulse" />
              <div className="h-12 rounded-[12px] bg-black/10 animate-pulse" />
              <div className="h-12 rounded-[12px] bg-black/10 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SkeletonIconText({ widthClass }: { widthClass: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="w-4 h-4 rounded bg-black/10 animate-pulse" />
      <span
        className={`h-4 ${widthClass} rounded-md bg-black/10 animate-pulse`}
      />
    </div>
  );
}

function SectionSkeleton({
  titleWidthClass,
  children,
}: {
  titleWidthClass: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-5 md:mb-6">
      <div className="flex items-center gap-2 mb-3">
        <span className="w-4 h-4 rounded bg-black/10 animate-pulse" />
        <span
          className={`h-4 ${titleWidthClass} rounded-md bg-black/15 animate-pulse`}
        />
      </div>
      {children}
    </div>
  );
}
