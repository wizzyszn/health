import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import useUrlSearchParams from "@/shared/hooks/use-url-search-params";

interface PaginationProps {
  currentPage?: number;
  totalPages: number;
  onPageChange?: (page: number) => void;
}

export function Pagination({
  currentPage: propCurrentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  const { getParam, updateParam } = useUrlSearchParams();
  const pageParam = getParam("page");
  const currentPage =
    propCurrentPage ?? (pageParam ? parseInt(pageParam, 10) : 1);

  const handlePageChange = (page: number) => {
    updateParam("page", String(page));
    onPageChange?.(page);
  };

  // Removed the guard that hides pagination for single pages to ensure component visibility

  const getVisiblePages = () => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="flex items-center justify-center gap-1 mt-4">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 rounded-lg"
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage <= 1}
      >
        <ChevronLeft size={16} />
      </Button>

      {getVisiblePages().map((page, i) =>
        page === "..." ? (
          <span
            key={`dots-${i}`}
            className="px-2 text-sm text-muted-foreground"
          >
            …
          </span>
        ) : (
          <Button
            key={page}
            variant={page === currentPage ? "default" : "ghost"}
            size="icon"
            className="h-8 w-8 rounded-lg text-sm"
            onClick={() => handlePageChange(page as number)}
          >
            {page}
          </Button>
        ),
      )}

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 rounded-lg"
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
      >
        <ChevronRight size={16} />
      </Button>
    </div>
  );
}
