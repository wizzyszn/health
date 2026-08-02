import {
  Doctor,
  GeneralReturnInt,
  Investigation as InvestigationInt,
  Investigations,
  RejectedPayload,
} from "@/lib/types";

import DataTable, {
  TableProps,
} from "@/shared/components/templates/dash.template";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import investigationColumns from "../columndefs/investigation.columndef.doctor";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/config/stores/store";
import { AuthState } from "@/config/stores/slices/auth.slice";
import { getAllInvestigationsForDoc } from "@/config/service/doctor.service";
import MainPageHeader from "@/shared/components/main-page-header.component.shared";

function Investigation() {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const { user } = useSelector(
    (state: RootState) => state.auth,
  ) as AuthState<Doctor>;
  const { data, isPending, isSuccess } = useQuery<
    GeneralReturnInt<Investigations>,
    RejectedPayload
  >({
    queryKey: ["Investigations", currentPage],
    queryFn: () => getAllInvestigationsForDoc(currentPage),
    enabled: !!user?.doctor?._id,
    placeholderData: keepPreviousData,
  });

  const { investigation = [], meta = { lastPage: 0 } } = data?.data ?? {};
  useEffect(() => {
    if (isSuccess && meta.lastPage) {
      setTotalPages(meta.lastPage);
    }
  }, [isSuccess, meta.lastPage]);
  const tableProps: TableProps<InvestigationInt, string | number> = {
    data: investigation,
    columns: investigationColumns,
    tableTitle: "Investigations",
    isLoading: isPending,
    setCurrentPage,
    totalPages,
    currentPage,
    noData: <div>No Investigations</div>,
  };
  return (
    <div className=" p-2">
      <MainPageHeader heading="Investigations" />
      <DataTable {...tableProps} />
    </div>
  );
}

export default Investigation;
