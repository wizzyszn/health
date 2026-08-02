import { getDiagnosisForConsultation } from "@/config/service/doctor.service";
import {
  Diagnosis as DiagnosisInt,
  GeneralReturnInt,
  RejectedPayload,
} from "@/lib/types";

import { useQuery } from "@tanstack/react-query";
import React from "react";

type Props = {
  consultationId: string;
};

function Diagnosis({ consultationId }: Props) {
  const { isPending, data } = useQuery<
    GeneralReturnInt<DiagnosisInt[]>,
    RejectedPayload
  >({
    queryKey: ["diagnosis_doc", consultationId],
    queryFn: () => getDiagnosisForConsultation(consultationId),
  });
  const diagnosis = data?.data ?? [];
  if (isPending) return <div className="p-4">Loading........</div>;
  return (
    <table className="min-w-full bg-white border border-gray-200">
      <thead>
        <tr className="bg-gray-100">
          <th className="py-2 px-4 border text-left">Title</th>
          <th className="py-2 px-4 border text-left">Description</th>
          <th className="py-2 px-4 border text-left">Created</th>
        </tr>
      </thead>
      <tbody>
        {diagnosis.length < 1 ? (
          <div>No Diagnosis for this consultation</div>
        ) : (
          diagnosis.map((med, index) => (
            <tr
              key={index}
              className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}
            >
              <td className="py-2 px-4 border">{med.title}</td>
              <td className="py-2 px-4 border">{med.description}</td>
              <td className="py-2 px-4 border">
                {new Date(med.updatedAt).toLocaleDateString()}
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}

export default React.memo(Diagnosis);
