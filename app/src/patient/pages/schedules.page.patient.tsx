import { getAllSchedulesForPatient } from "@/config/service/patient.service";
import {
  FullCalendarData,
  GeneralReturnInt,
  RejectedPayload,
  Schedules as SchedulesInt,
} from "@/lib/types";
import ViewSchedules from "@/shared/components/view-schedules.component";
import { useQuery } from "@tanstack/react-query";

function Schedules() {
  const { data, isLoading } = useQuery<
    GeneralReturnInt<SchedulesInt[]>,
    RejectedPayload
  >({
    queryKey: ["schedules"],
    queryFn: () => getAllSchedulesForPatient(),
  });
  const refinedData: FullCalendarData = data?.data.map((schedule) => {
    return {
      start: schedule.session_start_date,
      end: schedule.session_end_date,
      endStr: schedule.session_end_date,
      startStr: schedule.session_start_date,
      date: schedule.session_start_date,
      _id: schedule._id,
      title: schedule.title,
      status: schedule.status,
    };
  });
  return (
    <ViewSchedules data={refinedData} loading={isLoading} user="patient" />
  );
}

export default Schedules;
