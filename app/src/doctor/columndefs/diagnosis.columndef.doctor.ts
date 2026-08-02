import { Diagnosis } from "@/lib/types";
import { ColumnDef } from "@tanstack/react-table";

const DiagnosisColumns: ColumnDef<Diagnosis>[] = [
  {
    accessorKey: "title",
    header: "Title",
  },
  {
    header: "Patient Name",
    cell: ({ row }) => {
      return `${row.original.consultation_id.patient_first_name} ${row.original.consultation_id.patient_last_name}`;
    },
  },
  {
    accessorKey: "description",
    header: "Description",
  },
  {
    accessorKey: "createdAt",
    header: "Created At",
    cell: ({ row }) => {
      return new Date(row.original.createdAt).toLocaleDateString();
    },
  },
];

export default DiagnosisColumns;
