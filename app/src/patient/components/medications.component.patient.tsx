import { getMedicationsForConsultation } from "@/config/service/patient.service";
import { GeneralReturnInt, RejectedPayload } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
function Medications() {
  const { consultationId } = useParams();
  const { data } = useQuery<GeneralReturnInt<[]>, RejectedPayload>({
    queryKey: ["medications", consultationId],
    queryFn: () => getMedicationsForConsultation(consultationId ?? ""),
  });
  const medications = data?.data;
  if (Array.isArray(medications) && medications?.length < 1) {
    return (
      <div className="text-center">
        No medications prescribed yet for this consultation. Plese check again
        later.
      </div>
    );
  }
}

export default Medications;
