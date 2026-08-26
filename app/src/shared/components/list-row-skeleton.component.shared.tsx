export function ListRowSkeleton({
  variant = "date",
}: {
  variant?: "date" | "avatar";
}) {
  return (
    <div className="flex bg-[#F7F7F7] flex-col sm:flex-row sm:items-center justify-between p-3 md:px-4 md:py-4 rounded-[12px] gap-3 sm:gap-0">
      <div className="flex items-start gap-3 md:gap-4 flex-1 min-w-0">
        {variant === "avatar" ? (
          <div className="w-[40px] h-[40px] md:w-[50px] md:h-[50px] rounded-full bg-black/15 animate-pulse flex-shrink-0" />
        ) : (
          <div className="flex flex-col items-center justify-center py-[4px] md:py-[6px] px-[8px] md:px-[10px] bg-white rounded-[8px] gap-1 min-w-[48px] md:min-w-[56px] flex-shrink-0">
            <div className="h-4 w-6 rounded-md bg-black/15 animate-pulse" />
            <div className="h-3 w-8 rounded-md bg-black/10 animate-pulse" />
          </div>
        )}

        <div className="flex-1 min-w-0 space-y-2 py-1">
          <div className="h-4 w-40 max-w-full rounded-md bg-black/15 animate-pulse" />
          <div className="flex flex-wrap items-center gap-2">
            <div className="h-3 w-24 rounded-md bg-black/10 animate-pulse" />
            <div className="h-3 w-20 rounded-md bg-black/10 animate-pulse" />
            <div className="h-3 w-32 rounded-md bg-black/10 animate-pulse" />
          </div>
        </div>
      </div>

      <div className="self-end sm:self-auto flex items-center gap-2">
        <div className="h-6 w-24 rounded-full bg-black/10 animate-pulse" />
        <div className="h-4 w-4 rounded bg-black/10 animate-pulse" />
      </div>
    </div>
  );
}
