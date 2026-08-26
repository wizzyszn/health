import { getInvestigationForConsultation } from "@/config/service/doctor.service";
import { GeneralReturnInt, Investigation } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import React from "react";

type Props = {
  consultationId: string;
};

function Investigations({ consultationId }: Props) {
  const { data, isPending } = useQuery<
    GeneralReturnInt<{ data: Investigation[] }>
  >({
    queryKey: ["investigation_doc"],
    queryFn: () => getInvestigationForConsultation(consultationId),
  });
  const investigations = data?.data.data ?? [];
  if (isPending) return <div className="p-4">Loading......</div>;
  return (
    <table className="min-w-full bg-white border border-gray-200">
      <thead>
        <tr className="bg-gray-100">
          <th className="py-2 px-4 border text-left">Name</th>
          <th className="py-2 px-4     border text-left">Status</th>
          <th className="py-2 px-4 border text-left">Created</th>
        </tr>
      </thead>
      <tbody>
        {investigations.length < 1 ? (
          <div>No Diagnosis for this consultation</div>
        ) : (
          investigations.map((med, index) => (
            <tr
              key={index}
              className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}
            >
              <td className="py-2 px-4 border">{med.name}</td>
              <td className="py-2 px-4 border">{med.status}</td>
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

export default React.memo(Investigations);
