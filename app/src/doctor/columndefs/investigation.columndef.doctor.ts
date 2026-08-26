import { Investigation } from "@/lib/types";
import { ColumnDef } from "@tanstack/react-table";

const investigationColumns: ColumnDef<Investigation>[] = [
  {
    header: "Title",
    accessorKey: "name",
  },
  {
    header: "Patient Name",
    cell: ({ row }) => {
      return `${row.original.consultation_id.patient_first_name} ${row.original.consultation_id.patient_last_name}`;
    },
  },
  {
    header: "Description",
    accessorKey: "consultation_id.details",
  },
  {
    header: "Status",
    accessorKey: "status",
  },
  {
    header: "Amount",
    accessorKey: "consultation_id.amount",
  },
];

export default investigationColumns;
