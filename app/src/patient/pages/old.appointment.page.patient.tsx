import { useCallback, useEffect, useState } from "react";
import ConsultationFormModal from "../components/modals/consultation.modal.component";
import {
  Consultation,
  Consultations,
  GeneralReturnInt,
  //  Patient,
  RejectedPayload,
  //UserType,
} from "@/lib/types";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
//import { useSelector } from "react-redux";
//import { RootState } from "@/redux/strore";
import DataTable, {
  TableProps,
} from "@/shared/components/templates/dash.template";
import { useConsultationColumns } from "../columnsdef/get-consultation.columndef.patient";
import { Link, Outlet, useLocation } from "react-router-dom";
import { EllipsisVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu";
import { Row } from "@tanstack/react-table";
import Edit from "../components/modals/edit.modal.component";
//import { AuthState } from "@/redux/Auth/authSlice";
import { FaPlus } from "react-icons/fa";
import { getAllConsultations } from "@/config/service/patient.service";
import MainPageHeader from "@/shared/components/main-page-header.component.shared";
function OldAppointment() {
  const ConsultationColumns = useConsultationColumns();
  const [openConsultModal, setOpenConsultModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [openEdit, setOpenEdit] = useState<{
    data: Row<Consultation> | null;
    toggle: boolean;
  } | null>(null);
  const { pathname } = useLocation();
  const { data, isPending, isSuccess } = useQuery<
    GeneralReturnInt<Consultations>,
    RejectedPayload
  >({
    queryFn: async () => await getAllConsultations(currentPage),
    queryKey: ["consultations", currentPage],
    //enabled: !!user?.user?._id,
    placeholderData: keepPreviousData,
  });
  const isChildRoute = pathname === "/patient/dashboard/consultations";
  const handleOpenChange = useCallback((open: boolean) => {
    setOpenConsultModal(open);
  }, []);
  const handleOpen = useCallback(() => {
    setOpenConsultModal(true);
  }, []);
  useEffect(() => {
    if (isSuccess && data?.data?.meta?.lastPage) {
      setTotalPages(data.data.meta.lastPage);
    }
  }, [isSuccess, data?.data.meta.lastPage]);
  const tableProps: TableProps<Consultation, string | number> = {
    tableTitle: "Consultations",
    columns: [
      ...ConsultationColumns,
      {
        header: "Actions",
        cell: ({ row }) => {
          // const navigate = useNavigate();
          const startDate = new Date(row.original.session_start_date).getTime();
          const endDate = new Date(row.original.session_end_date).getTime();
          const check = endDate > startDate;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger>
                <EllipsisVertical />
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem
                  // onClick={() => navigate(row.original?._id as string)}
                  asChild
                >
                  <Link to={`${row.original._id}`}>View</Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={!check}
                  className={`${!check && "cursor-not-allowed"}`}
                  onClick={() =>
                    setOpenEdit({
                      toggle: true,
                      data: row,
                    })
                  }
                >
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem className=" text-red-500">
                  delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    data: data?.data.consultation,
    noData: <div>no Consultations</div>,
    isLoading: isPending,
    totalPages,
    currentPage,
    setCurrentPage,
  };

  return (
    <div className="p-2">
      <Outlet />
      {isChildRoute && (
        <>
          <MainPageHeader
            heading="Consult a Doctor Now!"
            noBtn={true}
            btnTitle={
              <span className=" flex items-center gap-2">
                <FaPlus />
                <span>Consult</span>
              </span>
            }
            handleBtnOnclick={handleOpen}
          />
          <ConsultationFormModal
            open={openConsultModal}
            onOpenChange={handleOpenChange}
          />
          <Edit
            open={openEdit?.toggle}
            rowData={openEdit?.data}
            onOpenChange={() =>
              setOpenEdit({
                toggle: false,
                data: null,
              })
            }
          />
          <DataTable {...tableProps} />
        </>
      )}
    </div>
  );
}

export default OldAppointment;
