import { MoveLeft } from "lucide-react";

export function PatientRecordGroupSkeleton({ count = 3 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="flex flex-col gap-2">
          <article className="rounded-[12px] border border-[#F0F0F0] bg-[#F7F7F7] p-3 sm:flex sm:items-center sm:justify-between">
            <div className="flex min-w-0 flex-1 items-start gap-3 sm:items-center">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] bg-black/15 animate-pulse sm:h-12 sm:w-12" />

              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-4 w-48 max-w-full rounded-md bg-black/15 animate-pulse" />
                <div className="flex flex-wrap items-center gap-2">
                  <div className="h-5 w-20 rounded-md bg-black/10 animate-pulse" />
                  <div className="h-3 w-24 rounded-md bg-black/10 animate-pulse" />
                  <div className="h-3 w-20 rounded-md bg-black/10 animate-pulse" />
                </div>
              </div>
            </div>

            <div className="mt-3 flex w-full shrink-0 items-center justify-between gap-2 border-t border-gray-200/60 pt-3 sm:mt-0 sm:w-auto sm:justify-end sm:border-none sm:pt-0">
              <div className="h-8 w-8 rounded-[8px] bg-black/10 animate-pulse sm:h-10 sm:w-10" />
              <div className="h-8 w-24 rounded-[8px] bg-black/10 animate-pulse sm:h-10 sm:w-[121px]" />
            </div>
          </article>
        </div>
      ))}
    </>
  );
}

export function PatientConsultationDetailSkeleton() {
  return (
    <div className="p-4 md:p-6">
      <PageTitleSkeleton titleWidthClass="w-60" referenceWidthClass="w-44" />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4 md:gap-6">
        <div className="bg-card rounded-[20px] border border-border p-4 md:p-6 min-w-0">
          <div className="mb-5 md:mb-6 p-4 md:p-5 bg-[#F7F7F7] rounded-xl border border-border/50">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 md:gap-4">
              <div className="w-12 h-12 rounded-full bg-black/15 animate-pulse shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-5 w-40 rounded-md bg-black/15 animate-pulse" />
                <div className="h-4 w-32 rounded-md bg-black/10 animate-pulse" />
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-12 mb-4 md:mb-5">
            <IconTextSkeleton widthClass="w-28" />
            <IconTextSkeleton widthClass="w-36" />
          </div>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-12 mb-6 md:mb-8">
            <IconTextSkeleton widthClass="w-24" />
            <IconTextSkeleton widthClass="w-28" />
          </div>

          <div className="border-t border-border mb-6" />
          <div className="space-y-3">
            <IconTextSkeleton widthClass="w-40" strong />
            <div className="ml-0 md:ml-6 rounded-lg border border-border bg-[#F7F7F7] p-3 space-y-2">
              <div className="h-4 w-full rounded-md bg-black/10 animate-pulse" />
              <div className="h-4 w-5/6 rounded-md bg-black/10 animate-pulse" />
              <div className="h-4 w-2/3 rounded-md bg-black/10 animate-pulse" />
            </div>
          </div>
        </div>

        <div>
          <div className="bg-card rounded-xl border border-border p-4 md:p-5 lg:sticky top-6">
            <div className="mb-5 flex items-center gap-2">
              <div className="h-4 w-4 rounded bg-black/10 animate-pulse" />
              <div className="h-4 w-28 rounded-md bg-black/15 animate-pulse" />
            </div>
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 rounded-lg border border-border bg-[#F7F7F7] p-3"
                >
                  <div className="h-8 w-8 rounded-full bg-black/10 animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 rounded-md bg-black/15 animate-pulse" />
                    <div className="h-3 w-full rounded-md bg-black/10 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-5 border-t border-border space-y-2">
              <div className="flex justify-between">
                <div className="h-3 w-32 rounded-md bg-black/10 animate-pulse" />
                <div className="h-3 w-8 rounded-md bg-black/15 animate-pulse" />
              </div>
              <div className="h-2 w-full rounded-full bg-black/10 animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      <div className="w-full rounded-xl bg-white shadow-sm border border-border mt-4 md:mt-6">
        <div className="flex gap-3 px-3 md:px-4 py-3 border-b border-border">
          <div className="h-4 w-24 rounded-md bg-black/15 animate-pulse" />
          <div className="h-4 w-24 rounded-md bg-black/10 animate-pulse" />
          <div className="h-4 w-20 rounded-md bg-black/10 animate-pulse" />
        </div>
        <div className="p-3 md:p-4">
          <PatientRecordGroupSkeleton count={2} />
        </div>
      </div>
    </div>
  );
}

export function PatientReferralDetailSkeleton() {
  return (
    <div className="p-4 md:p-6">
      <PageTitleSkeleton titleWidthClass="w-48" referenceWidthClass="w-40" />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 md:gap-6">
        <div className="bg-white rounded-[20px] border border-gray-100 p-4 md:p-6 shadow-sm min-w-0">
          <div className="mb-6 md:mb-8 p-4 md:p-5 bg-[#F7F7F7] rounded-xl border border-gray-100">
            <div className="h-3 w-28 rounded-md bg-black/10 animate-pulse mb-4" />
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 md:gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-black/15 animate-pulse shrink-0" />
              <div className="space-y-2 min-w-0 flex-1">
                <div className="h-5 w-44 rounded-md bg-black/15 animate-pulse" />
                <div className="h-4 w-32 rounded-md bg-black/10 animate-pulse" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-8 mb-6 md:mb-8">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <IconTextSkeleton widthClass="w-28" strong />
                <div className="ml-5 md:ml-6 h-4 w-36 rounded-md bg-black/10 animate-pulse" />
              </div>
            ))}
          </div>

          <div className="border-t border-gray-100 my-6 md:my-8" />

          <div className="space-y-3">
            <IconTextSkeleton widthClass="w-32" strong />
            <div className="ml-0 md:ml-6 p-3 md:p-4 rounded-lg border border-gray-100 bg-[#F9FAFB] space-y-2">
              <div className="h-4 w-full rounded-md bg-black/10 animate-pulse" />
              <div className="h-4 w-5/6 rounded-md bg-black/10 animate-pulse" />
              <div className="h-4 w-2/3 rounded-md bg-black/10 animate-pulse" />
            </div>
          </div>
        </div>

        <div className="space-y-4 md:space-y-6">
          <div className="bg-white rounded-xl border border-gray-100 p-4 md:p-5 shadow-sm sticky top-6">
            <div className="h-4 w-32 rounded-md bg-black/15 animate-pulse mb-5" />
            <div className="flex items-start gap-3 p-3 rounded-lg bg-[#F7F7F7] border border-gray-100">
              <div className="h-9 w-9 rounded-full bg-black/10 animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 rounded-md bg-black/15 animate-pulse" />
                <div className="h-3 w-40 rounded-md bg-black/10 animate-pulse" />
              </div>
            </div>
            <div className="mt-6 pt-5 border-t border-gray-100 space-y-2">
              <div className="flex justify-between">
                <div className="h-3 w-32 rounded-md bg-black/10 animate-pulse" />
                <div className="h-3 w-20 rounded-md bg-black/15 animate-pulse" />
              </div>
              <div className="h-2 w-full rounded-full bg-black/10 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PageTitleSkeleton({
  titleWidthClass,
  referenceWidthClass,
}: {
  titleWidthClass: string;
  referenceWidthClass: string;
}) {
  return (
    <div className="mb-4 md:mb-6">
      <div className="flex items-center text-sm font-medium text-muted-foreground mb-4 md:mb-5">
        <MoveLeft className="w-4 h-4 mr-2" />
        <span>Back</span>
      </div>
      <div
        className={`h-7 ${titleWidthClass} rounded-md bg-black/15 animate-pulse`}
      />
      <div
        className={`mt-2 h-4 ${referenceWidthClass} rounded-md bg-black/10 animate-pulse`}
      />
    </div>
  );
}

function IconTextSkeleton({
  widthClass,
  strong,
}: {
  widthClass: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-4 h-4 rounded bg-black/10 animate-pulse" />
      <span
        className={`h-4 ${widthClass} rounded-md ${
          strong ? "bg-black/15" : "bg-black/10"
        } animate-pulse`}
      />
    </div>
  );
}
