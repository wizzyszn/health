import { Consultation } from "@/lib/types";
import { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";

const getConsultationColumns = (): ColumnDef<Consultation>[] => [
  {
    accessorKey: "title",
    header: "Title",
  },
  {
    accessorKey: "type",
    header: "Type of Consulation",
  },
  {
    accessorKey: "consoltation_for",
    header: "Who is Consulting?",
  },
  {
    accessorKey: "patient_gender",
    header: "Gender",
  },
  {
    accessorKey: "session_start_date",
    header: "Start Date",
    cell: ({ row }) =>
      new Date(row.original.session_start_date).toLocaleString(),
  },
  {
    accessorKey: "session_end_date",
    header: "End Date",
    cell: ({ row }) => new Date(row.original.session_end_date).toLocaleString(),
  },
  {
    header: "Session Duration",
    cell: ({ row }) => {
      const startDate = new Date(row.original.session_start_date);
      const endDate = new Date(row.original.session_end_date);

      // Calculate difference in milliseconds
      const diffMs = endDate.getTime() - startDate.getTime();

      // Convert to hours and minutes
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

      // Format the output
      let duration = "";
      if (hours > 0) {
        duration += `${hours} hour${hours !== 1 ? "s" : ""}`;
      }
      if (minutes > 0) {
        if (hours > 0) duration += " ";
        duration += `${minutes} minute${minutes !== 1 ? "s" : ""}`;
      }
      if (hours === 0 && minutes === 0) {
        duration = "0 minutes";
      }

      return duration;
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      let status;
      switch (row.original.status) {
        case "COMPLETED":
          status = "✅ Success";
          break;
        case "PENDING":
          status = "🟡 Pending";
          break;
        case "CANCELED":
          status = "❌ Failed";
          break;
        default:
          status = "";
          break;
      }
      return status;
    },
  },
];
export const useConsultationColumns = () => {
  return useMemo(getConsultationColumns, []);
};
