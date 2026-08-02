import {
  Diagnosis as DiagnosisInt,
  Doctor,
  GeneralReturnInt,
  RejectedPayload,
} from "@/lib/types";
import { AuthState } from "@/config/stores/slices/auth.slice";
import { RootState } from "@/config/stores/store";

import DataTable, {
  TableProps,
} from "@/shared/components/templates/dash.template";
import { useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import DiagnosisColumns from "../columndefs/diagnosis.columndef.doctor";
import { getAllDiagnosis } from "@/config/service/doctor.service";
import MainPageHeader from "@/shared/components/main-page-header.component.shared";

function Diagnosis() {
  const { user } = useSelector(
    (state: RootState) => state.auth,
  ) as AuthState<Doctor>;
  const { data, isPending } = useQuery<
    GeneralReturnInt<DiagnosisInt[]>,
    RejectedPayload
  >({
    queryKey: ["diagnosis"],
    enabled: !!user?.doctor?._id,
    queryFn: () => getAllDiagnosis(),
  });
  const dataTableProps: TableProps<DiagnosisInt, string | number> = {
    tableTitle: "Diagnosis",
    columns: DiagnosisColumns ?? [],
    data: data?.data,
    isLoading: isPending,
  };
  return (
    <div>
      <MainPageHeader heading="Conduct Diagnosis" />
      <DataTable {...dataTableProps} />
    </div>
  );
}

export default Diagnosis;
