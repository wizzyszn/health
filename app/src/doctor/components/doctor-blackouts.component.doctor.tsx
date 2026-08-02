import { useMemo, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { toZonedTime } from "date-fns-tz";
import { format, parse } from "date-fns";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { cn, formatLocalDateTime, getBrowserTimeZone } from "@/lib/utils";
import Spinner from "@/shared/components/spinner.component";
import {
  deleteDoctorBlackoutsReq,
  getDoctorBlackoutsReq,
  setDoctorBlackoutSlotReq,
} from "@/config/service/doctor.service";
import { useSelector } from "react-redux";
import { RootState } from "@/config/stores/store";

/* -------------------------------------------------------------------------- */
/*                                Custom Toggle                               */
/* -------------------------------------------------------------------------- */
const Toggle = ({
  label,
  checked,
  onChange,
  disabled,
}: {
  label?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) => {
  return (
    <label
      className={cn(
        "group flex justify-between items-center gap-[7px] cursor-pointer select-none text-[14px]",
        disabled && "opacity-50 cursor-not-allowed",
      )}
    >
      {label && (
        <span className="ml-3 text-[#6C6C6C] font-semibold">{label}</span>
      )}
      <div className="relative">
        <Input
          type="checkbox"
          className="sr-only peer"
          checked={checked}
          onChange={(e) => !disabled && onChange(e.target.checked)}
          disabled={disabled}
        />
        <div
          className={cn(
            "w-10 h-5 bg-muted rounded-full border border-input transition-colors duration-200 ease-in-out",
            "peer-checked:bg-primary peer-checked:border-primary",
            "peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2",
            "group-hover:opacity-90",
          )}
        />
        <div
          className={cn(
            "absolute top-[2px] left-[2px] h-4 w-4 rounded-full bg-background shadow-sm transition-all duration-200 ease-in-out",
            "peer-checked:translate-x-5 peer-checked:bg-white",
          )}
        />
      </div>
    </label>
  );
};

/* -------------------------------------------------------------------------- */
/*                               Schemas & Types                              */
/* -------------------------------------------------------------------------- */
const blackoutSlotSchema = z
  .object({
    _id: z.string().optional(),
    start_date: z.string().min(1, "Required"),
    start_time: z.string().min(1, "Required"),
    end_date: z.string().min(1, "Required"),
    end_time: z.string().min(1, "Required"),
    reason: z.string().min(1, "Required"),
    reccuring: z.boolean(),
  })
  .refine(
    (data) => {
      if (!data.start_date || !data.end_date) return true;
      if (data.end_date > data.start_date) return true;
      if (data.end_date < data.start_date) return false;
      // Same date — compare times
      if (!data.start_time || !data.end_time) return true;
      return data.end_time >= data.start_time;
    },
    {
      message: "End date/time must not be before start date/time",
      path: ["end_date"],
    },
  );

const blackoutsFormSchema = z.object({
  blackouts: z.array(blackoutSlotSchema),
});

type BlackoutsFormValues = z.infer<typeof blackoutsFormSchema>;

/* -------------------------------------------------------------------------- */
/*                                  Component                                 */
/* -------------------------------------------------------------------------- */
export default function DoctorBlackouts() {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const userTimezone = useSelector((state: RootState) => state.auth.timezone);

  // Fetch blackouts utilizing the empty getDoctorSchedules query
  const { data, isLoading } = useQuery({
    queryKey: ["doctor-blackouts"],
    queryFn: () => getDoctorBlackoutsReq(),
  });

  const computedValues = useMemo(() => {
    const blackoutsList = data?.data || [];

    if (blackoutsList.length > 0) {
      const formattedBlackouts = blackoutsList.map((b) => {
        const timeZone = userTimezone || b.timezone || getBrowserTimeZone();
        const zonedStart = toZonedTime(new Date(b.start_at_utc), timeZone);
        const zonedEnd = toZonedTime(new Date(b.end_at_utc), timeZone);

        const start_date = format(zonedStart, "yyyy-MM-dd");
        const start_time = format(zonedStart, "HH:mm");
        const end_date = format(zonedEnd, "yyyy-MM-dd");
        const end_time = format(zonedEnd, "HH:mm");

        return {
          _id: b._id,
          start_date,
          start_time,
          end_date,
          end_time,
          reason: b.reason || "Unavailable",
          reccuring: Boolean(b.reccuring),
        };
      });

      return { blackouts: formattedBlackouts };
    }
    return { blackouts: [] };
  }, [data, userTimezone]);

  const form = useForm<BlackoutsFormValues>({
    resolver: zodResolver(blackoutsFormSchema),
    values: computedValues,
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "blackouts",
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDoctorBlackoutsReq,
    onSuccess: () => {
      toast.success("Blackout deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["doctor-blackouts"] });
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
    },
    onError: (error: unknown) => {
      let errorMsg = "Failed to delete blackout";
      const err = error as {
        response?: { data?: { message?: string | string[] } };
      };
      const messageData = err?.response?.data?.message;
      if (Array.isArray(messageData)) {
        errorMsg = messageData[0];
      } else if (typeof messageData === "string") {
        errorMsg = messageData;
      } else if (error instanceof Error) {
        errorMsg = error.message;
      }
      toast.error(errorMsg);
    },
  });

  const updateMutation = useMutation({
    mutationFn: setDoctorBlackoutSlotReq,
    onSuccess: () => {
      toast.success("Blackouts updated successfully!");
      // Force form to be clean by resetting to the watched values
      form.reset(form.getValues());
      queryClient.setQueryData(["doctor-blackouts"], (oldData: unknown) => {
        // Optimistically set the data locally if needed or just invalidate
        return oldData;
      });
      queryClient.invalidateQueries({ queryKey: ["doctor-blackouts"] });
      // Invalidate full schedules too
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
    },
    onError: (error: unknown) => {
      let errorMsg = "Failed to update blackouts";
      const err = error as {
        response?: { data?: { message?: string | string[] } };
      };
      const messageData = err?.response?.data?.message;
      if (Array.isArray(messageData)) {
        errorMsg = messageData[0];
      } else if (typeof messageData === "string") {
        errorMsg = messageData;
      } else if (error instanceof Error) {
        errorMsg = error.message;
      }
      toast.error(errorMsg);
    },
  });

  const onSubmit = (values: BlackoutsFormValues) => {
    const newBlackouts = values.blackouts.filter((b) => !b._id);

    if (newBlackouts.length === 0) {
      toast.info("No new blackouts to save");
      setIsEditing(false);
      return;
    }

    const payload = newBlackouts.map((b) => {
      const timeZone = userTimezone || getBrowserTimeZone();
      const naiveStart = parse(
        `${b.start_date} ${b.start_time}`,
        "yyyy-MM-dd HH:mm",
        new Date(),
      );
      const naiveEnd = parse(
        `${b.end_date} ${b.end_time}`,
        "yyyy-MM-dd HH:mm",
        new Date(),
      );

      return {
        start_local: formatLocalDateTime(naiveStart),
        end_local: formatLocalDateTime(naiveEnd),
        timezone: timeZone,
        reason: b.reason,
        reccuring: b.reccuring,
      };
    });

    updateMutation.mutate({ blackouts: payload });
  };

  const { isDirty } = form.formState;

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center w-full">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="bg-white pb-[18px] rounded-b-xl border-t-0">
      <div className="p-[18px] border-b text-[16px] font-semibold flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <span>Blackout Periods</span>
          <p className="text-sm text-gray-500 font-normal mt-1">
            Set specific dates and times you will be unavailable.
          </p>
        </div>
        <div className="flex items-center gap-6">
          <Toggle
            label="Edit Mode"
            checked={isEditing}
            onChange={setIsEditing}
          />
          <Button
            type="button"
            disabled={!isEditing || !isDirty || updateMutation.isPending}
            onClick={form.handleSubmit(onSubmit)}
            className="hidden sm:inline-flex sm:w-[200px]"
          >
            {updateMutation.isPending ? "Saving..." : "Save Blackouts"}
          </Button>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="px-[18px] mt-6">
            <div className="border rounded-lg shadow-sm overflow-hidden overflow-x-auto">
              <div className="min-w-[800px]">
                <div className="bg-gray-50 border-b px-4 py-3 text-sm font-medium text-gray-600 flex gap-4 w-full">
                  <div className="w-[150px] shrink-0">Start Date</div>
                  <div className="w-[110px] shrink-0">Start Time</div>
                  <div className="w-[150px] shrink-0">End Date</div>
                  <div className="w-[110px] shrink-0">End Time</div>
                  <div className="w-[150px] shrink-0">Reason</div>
                  <div className="w-[80px] text-center shrink-0">Recur</div>
                  <div className="flex-1 text-right shrink-0 pr-2">Action</div>
                </div>

                <div className="divide-y relative">
                  {fields.map((field, index) => {
                    return (
                      <div
                        key={field.id}
                        className="flex items-center px-4 py-3 gap-4 transition-colors hover:bg-gray-50/50 w-full"
                      >
                        <FormField
                          control={form.control}
                          name={`blackouts.${index}.start_date`}
                          render={({ field: dField }) => (
                            <FormItem className="w-[150px] space-y-1 shrink-0 m-0">
                              <FormControl>
                                <Input
                                  {...dField}
                                  type="date"
                                  className="h-[40px] w-full"
                                  disabled={!isEditing || !!field._id}
                                  onChange={(e) => {
                                    dField.onChange(e);
                                    const newStartDate = e.target.value;
                                    const curEndDate = form.getValues(
                                      `blackouts.${index}.end_date`,
                                    );
                                    const curStartTime = form.getValues(
                                      `blackouts.${index}.start_time`,
                                    );
                                    const curEndTime = form.getValues(
                                      `blackouts.${index}.end_time`,
                                    );
                                    // If end date is now before start date, bump it
                                    if (
                                      curEndDate &&
                                      newStartDate > curEndDate
                                    ) {
                                      form.setValue(
                                        `blackouts.${index}.end_date`,
                                        newStartDate,
                                        { shouldDirty: true },
                                      );
                                      toast.warning(
                                        "End date adjusted — it can't be before the start date",
                                      );
                                      // Also fix time if now on same date
                                      if (
                                        curStartTime &&
                                        curEndTime &&
                                        curEndTime < curStartTime
                                      ) {
                                        form.setValue(
                                          `blackouts.${index}.end_time`,
                                          curStartTime,
                                          { shouldDirty: true },
                                        );
                                      }
                                    }
                                    // Same date — fix time if needed
                                    if (
                                      curEndDate &&
                                      newStartDate === curEndDate &&
                                      curStartTime &&
                                      curEndTime &&
                                      curEndTime < curStartTime
                                    ) {
                                      form.setValue(
                                        `blackouts.${index}.end_time`,
                                        curStartTime,
                                        { shouldDirty: true },
                                      );
                                      toast.warning(
                                        "End time adjusted — it can't be before the start time",
                                      );
                                    }
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`blackouts.${index}.start_time`}
                          render={({ field: tField }) => (
                            <FormItem className="w-[110px] space-y-1 shrink-0 m-0">
                              <FormControl>
                                <Input
                                  {...tField}
                                  type="time"
                                  className="h-[40px] w-full"
                                  disabled={!isEditing || !!field._id}
                                  onChange={(e) => {
                                    tField.onChange(e);
                                    const newStartTime = e.target.value;
                                    const curStartDate = form.getValues(
                                      `blackouts.${index}.start_date`,
                                    );
                                    const curEndDate = form.getValues(
                                      `blackouts.${index}.end_date`,
                                    );
                                    const curEndTime = form.getValues(
                                      `blackouts.${index}.end_time`,
                                    );
                                    // Only enforce when dates are the same
                                    if (
                                      curStartDate &&
                                      curEndDate &&
                                      curStartDate === curEndDate &&
                                      curEndTime &&
                                      newStartTime > curEndTime
                                    ) {
                                      form.setValue(
                                        `blackouts.${index}.end_time`,
                                        newStartTime,
                                        { shouldDirty: true },
                                      );
                                      toast.warning(
                                        "End time adjusted — it can't be before the start time",
                                      );
                                    }
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`blackouts.${index}.end_date`}
                          render={({ field: dField }) => (
                            <FormItem className="w-[150px] space-y-1 shrink-0 m-0">
                              <FormControl>
                                <Input
                                  {...dField}
                                  type="date"
                                  className="h-[40px] w-full"
                                  disabled={!isEditing || !!field._id}
                                  onChange={(e) => {
                                    const newEndDate = e.target.value;
                                    const curStartDate = form.getValues(
                                      `blackouts.${index}.start_date`,
                                    );
                                    // Don't allow end date before start date
                                    if (
                                      curStartDate &&
                                      newEndDate < curStartDate
                                    ) {
                                      form.setValue(
                                        `blackouts.${index}.end_date`,
                                        curStartDate,
                                        { shouldDirty: true },
                                      );
                                      toast.warning(
                                        "End date can't be before the start date",
                                      );
                                      return;
                                    }
                                    dField.onChange(e);
                                    // If now same date, fix time if needed
                                    const curStartTime = form.getValues(
                                      `blackouts.${index}.start_time`,
                                    );
                                    const curEndTime = form.getValues(
                                      `blackouts.${index}.end_time`,
                                    );
                                    if (
                                      curStartDate &&
                                      newEndDate === curStartDate &&
                                      curStartTime &&
                                      curEndTime &&
                                      curEndTime < curStartTime
                                    ) {
                                      form.setValue(
                                        `blackouts.${index}.end_time`,
                                        curStartTime,
                                        { shouldDirty: true },
                                      );
                                      toast.warning(
                                        "End time adjusted — it can't be before the start time",
                                      );
                                    }
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`blackouts.${index}.end_time`}
                          render={({ field: tField }) => (
                            <FormItem className="w-[110px] space-y-1 shrink-0 m-0">
                              <FormControl>
                                <Input
                                  {...tField}
                                  type="time"
                                  className="h-[40px] w-full"
                                  disabled={!isEditing || !!field._id}
                                  onChange={(e) => {
                                    const newEndTime = e.target.value;
                                    const curStartDate = form.getValues(
                                      `blackouts.${index}.start_date`,
                                    );
                                    const curEndDate = form.getValues(
                                      `blackouts.${index}.end_date`,
                                    );
                                    const curStartTime = form.getValues(
                                      `blackouts.${index}.start_time`,
                                    );
                                    // If same date and end time is before start time, snap to start time
                                    if (
                                      curStartDate &&
                                      curEndDate &&
                                      curStartDate === curEndDate &&
                                      curStartTime &&
                                      newEndTime < curStartTime
                                    ) {
                                      form.setValue(
                                        `blackouts.${index}.end_time`,
                                        curStartTime,
                                        { shouldDirty: true },
                                      );
                                      toast.warning(
                                        "End time can't be before the start time",
                                      );
                                      return;
                                    }
                                    tField.onChange(e);
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`blackouts.${index}.reason`}
                          render={({ field: rField }) => (
                            <FormItem className="w-[150px] space-y-1 shrink-0 m-0">
                              <FormControl>
                                <Input
                                  {...rField}
                                  type="text"
                                  placeholder="E.g. Vacation"
                                  className="h-[40px] w-full bg-white"
                                  disabled={!isEditing || !!field._id}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="w-[80px] flex justify-center items-center shrink-0">
                          <FormField
                            control={form.control}
                            name={`blackouts.${index}.reccuring`}
                            render={({ field: recField }) => (
                              <FormItem className="m-0 flex items-center justify-center pt-2">
                                <FormControl>
                                  <Toggle
                                    checked={recField.value}
                                    onChange={recField.onChange}
                                    disabled={!isEditing || !!field._id}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="flex-1 flex justify-end shrink-0 pt-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (!isEditing) return;
                              const blackoutId = field._id;
                              if (blackoutId) {
                                deleteMutation.mutate(blackoutId);
                              }
                              remove(index);
                            }}
                            disabled={!isEditing || deleteMutation.isPending}
                            className="text-red-500 hover:text-red-600 hover:bg-red-50 disabled:opacity-50"
                          >
                            <Trash2 size={18} />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {fields.length === 0 && (
                <div className="py-8 text-center text-gray-500 text-sm">
                  No blackout periods configured.
                </div>
              )}
            </div>

            {isEditing && (
              <Button
                type="button"
                variant="outline"
                className="mt-4 border-dashed bg-gray-50/50 hover:bg-gray-100"
                onClick={() =>
                  append({
                    start_date: new Date().toLocaleDateString("en-CA"),
                    start_time: "09:00",
                    end_date: new Date().toLocaleDateString("en-CA"),
                    end_time: "17:00",
                    reason: "Unavailable",
                    reccuring: false,
                  })
                }
              >
                <Plus size={16} className="mr-2" />
                Add Blackout Period
              </Button>
            )}
          </div>

          <div className="w-full px-[18px] flex sm:hidden">
            <Button
              type="submit"
              disabled={!isEditing || !isDirty || updateMutation.isPending}
              className="w-full"
            >
              {updateMutation.isPending ? "Saving..." : "Save Blackouts"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
