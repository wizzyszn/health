import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  Row,
  useReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import React, {
  ReactNode,
  Dispatch,
  SetStateAction,
  useMemo,
  useRef,
  useState,
  useCallback,
  JSX,
} from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FaLongArrowAltLeft, FaLongArrowAltRight } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import Spinner from "@/shared/components/spinner.component";

// Helper type for nested object keys
type NestedKeys<T> = {
  [K in keyof T]: K extends string | number
    ? T[K] extends object
      ? K | `${K}.${NestedKeys<T[K]>}`
      : K
    : never;
}[keyof T];

export interface TableProps<TData extends { _id: string | number }, TValue> {
  columns?: ColumnDef<TData, TValue>[];
  data?: TData[];
  tableTitle: string;
  searchKey?: NestedKeys<TData>;
  noData?: ReactNode;
  children?: ReactNode;
  isLoading?: boolean;
  currentPage?: number;
  totalPages?: number;
  setCurrentPage?: Dispatch<SetStateAction<number>>;
  onRowClick?: (row: TData) => void;
  routeTo?: string;
}

function DataTableComponent<TData extends { _id: string | number }, TValue>({
  columns,
  data,
  tableTitle,
  searchKey,
  noData,
  children,
  isLoading,
  currentPage,
  setCurrentPage,
  totalPages,
  onRowClick,
  routeTo,
}: TableProps<TData, TValue>) {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState({});
  const tableRef = useRef<HTMLTableElement | null>(null);
  const tableContainerRef = useRef<HTMLDivElement | null>(null);

  const table = useReactTable({
    data: data ?? [],
    columns: columns ?? [],
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onRowSelectionChange: setRowSelection,
    state: {
      columnFilters,
      rowSelection,
    },
    enableRowSelection: true,
  });
  const rowCount = useMemo(() => {
    if (!data || !data.length) return 0;
    return table.getRowModel().rows?.length || data.length;
  }, [data, table]);

  const navigate = useNavigate();
  const navigateToPath = useCallback(
    (id: string | number) => {
      if (!routeTo) {
        return;
      }
      navigate(`${routeTo}/${id}`);
    },
    [routeTo, navigate],
  );
  const tableRowHandleClick = (row: Row<TData>) => {
    onRowClick?.(row.original);
    navigateToPath(row.original._id);
  };
  return (
    <section className="relative my-7 overflow-hidden rounded-md w-full h-full">
      <header className="flex items-center justify-between px-4 py-3">
        <h3 className="text-lg font-semibold">{tableTitle}</h3>

        {searchKey && (
          <div className="relative flex w-[50%] min-w-[150px] max-w-[600px] items-center">
            <Search size={15} className="absolute left-3 opacity-50" />
            <Input
              placeholder="Search here..."
              value={
                (table
                  ?.getColumn(searchKey.toString())
                  ?.getFilterValue() as string) ?? ""
              }
              onChange={(event) =>
                table
                  ?.getColumn(searchKey.toString())
                  ?.setFilterValue(event.target.value)
              }
              className="w-full pl-8"
            />
          </div>
        )}
      </header>

      {children || (
        <>
          <div
            className="relative w-full overflow-x-auto overflow-y-hidden"
            ref={tableContainerRef}
          >
            {isLoading ? (
              <Spinner className="h-full" />
            ) : (
              <Table
                className={` min-w-[1200px] border-b ${
                  rowCount ? "" : "h-[300px]"
                }`}
                ref={tableRef}
              >
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead className=" bg-[#f1f1f1]" key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
                              )}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody className="">
                  {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row) => (
                      <TableRow
                        key={row.id}
                        className={`${routeTo && " hover:cursor-pointer"} h-20 hover:shadow-lg transition-shadow duration-500`}
                        onClick={() => {
                          tableRowHandleClick(row);
                        }}
                        data-state={row.getIsSelected() && "selected"}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={columns?.length}
                        className="text-center"
                      >
                        {noData || "No results."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </div>
          {!!rowCount && (
            <div className="flex items-center justify-between px-4 py-3">
              <div className="text-xs text-muted-foreground">
                Page {currentPage} of {totalPages ?? 0}
              </div>

              <div className="flex items-center gap-2">
                {Array.from({ length: totalPages ?? 0 }, (_, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    className={`${
                      (currentPage ?? 0) - 1 === index
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground"
                    } px-3 text-xs`}
                    onClick={() => setCurrentPage?.(index + 1)}
                  >
                    {index + 1}
                  </Button>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage?.((prev) => prev - 1)}
                  disabled={currentPage === undefined || currentPage === 1}
                  className="h-fit gap-2 py-1 text-xs"
                >
                  <FaLongArrowAltLeft /> Previous
                </Button>

                <Button
                  variant="outline"
                  onClick={() => setCurrentPage?.((prev) => prev + 1)}
                  disabled={
                    currentPage === undefined || currentPage === totalPages
                  }
                  className="h-fit gap-2 py-1 text-xs"
                >
                  Next <FaLongArrowAltRight />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
const DataTable = React.memo(DataTableComponent, (prevProps, nextProps) => {
  return (
    prevProps.children === nextProps.children &&
    prevProps.data === nextProps.data &&
    prevProps.columns === nextProps.columns &&
    prevProps.tableTitle === nextProps.tableTitle &&
    prevProps.isLoading === nextProps.isLoading &&
    prevProps.routeTo === nextProps.routeTo &&
    prevProps.totalPages === nextProps.totalPages &&
    prevProps.currentPage === nextProps.currentPage &&
    prevProps.onRowClick === nextProps.onRowClick &&
    prevProps.noData === nextProps.noData &&
    prevProps.searchKey === nextProps.searchKey
  );
}) as <TData extends { _id: number | string }, TValue>(
  props: TableProps<TData, TValue>,
) => JSX.Element;
export default DataTable;
