import { useMemo, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { cn } from "@/lib/utils";
import Spinner from "@/shared/components/spinner.component";
import {
  getDoctorAvailabilitySlotReq,
  setDoctorAvailabilitySlotReq,
} from "@/config/service/doctor.service";
import { useSelector } from "react-redux";
import { RootState } from "@/config/stores/store";

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

const slotSchema = z
  .object({
    day_of_week: z.number().min(0).max(6),
    start_time: z.string().min(1, "Required"),
    end_time: z.string().min(1, "Required"),
    slot_duration_minutes: z.number(),
    is_active: z.boolean(),
  })
  .refine(
    (data) => {
      if (!data.is_active || !data.start_time || !data.end_time) return true;
      return data.end_time >= data.start_time;
    },
    {
      message: "End time must not be before start time",
      path: ["end_time"],
    },
  );

const availabilitySchema = z
  .object({
    timezone: z.string().min(1, "Timezone is required"),
    effective_from: z.string().min(1, "Required"),
    effective_to: z.string().min(1, "Required"),
    weekly_slots: z.array(slotSchema),
  })
  .refine(
    (data) => {
      if (!data.effective_from || !data.effective_to) return true;
      return data.effective_to >= data.effective_from;
    },
    {
      message: "Active Until date must not be before Active From date",
      path: ["effective_to"],
    },
  );

type AvailabilityFormValues = z.infer<typeof availabilitySchema>;

const DAYS_OF_WEEK = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const DEFAULT_SLOTS = DAYS_OF_WEEK.map((_, index) => ({
  day_of_week: index,
  start_time: "09:00",
  end_time: "10:00",
  slot_duration_minutes: 60,
  is_active: index !== 0 && index !== 6, // Mon-Fri active by default
}));

export default function DoctorAvailabilityTab() {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const userTimezone = useSelector((state: RootState) => state.auth.timezone);

  const { data, isLoading } = useQuery({
    queryKey: ["doctor-availability"],
    queryFn: getDoctorAvailabilitySlotReq,
  });

  const computedValues = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const effectiveTo = `${currentYear}-12-31`;
    const effectiveFrom = format(new Date(), "yyyy-MM-dd");

    const defaults = {
      timezone: userTimezone || "Africa/Lagos",
      effective_from: effectiveFrom,
      effective_to: effectiveTo,
      weekly_slots: DEFAULT_SLOTS,
    };

    if (data?.data) {
      const dbSlots = data.data.weekly_slots || [];
      const updatedSlots = DEFAULT_SLOTS.map((defSlot) => {
        const matching = dbSlots.find(
          (s) => s.day_of_week === defSlot.day_of_week,
        );
        return matching
          ? {
              day_of_week: matching.day_of_week,
              start_time: matching.start_time,
              end_time: matching.end_time,
              slot_duration_minutes: matching.slot_duration_minutes,
              is_active: matching.is_active,
            }
          : defSlot;
      });

      return {
        timezone: data.data.timezone || userTimezone || "Africa/Lagos",
        effective_from: effectiveFrom,
        effective_to: effectiveTo,
        weekly_slots: updatedSlots,
      };
    }
    return defaults;
  }, [data, userTimezone]);

  const form = useForm<AvailabilityFormValues>({
    resolver: zodResolver(availabilitySchema),
    values: computedValues,
  });

  const { fields } = useFieldArray({
    control: form.control,
    name: "weekly_slots",
  });

  const updateMutation = useMutation({
    mutationFn: setDoctorAvailabilitySlotReq,
    onSuccess: (response) => {
      toast.success("Availability updated successfully!");
      // Reset form on success to correctly reset the `isDirty` state back to false
      form.reset(form.getValues());
      queryClient.setQueryData(["doctor-availability"], response);
    },
    onError: (error: unknown) => {
      let errorMsg = "Failed to update availability";
      if (error instanceof Error) {
        errorMsg = error.message;
      }
      const err = error as {
        response?: { data?: { message?: string | string[] } };
      };

      const messageData = err?.response?.data?.message;
      if (Array.isArray(messageData)) {
        errorMsg = messageData[0];
      } else if (typeof messageData === "string") {
        errorMsg = messageData;
      }
      toast.error(errorMsg);
    },
  });

  const onSubmit = (values: AvailabilityFormValues) => {
    updateMutation.mutate(values);
  };

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center w-full">
        <Spinner />
      </div>
    );
  }

  const { isDirty } = form.formState;

  return (
    <div className="bg-white pb-[18px] rounded-b-xl border-t-0">
      <div className="p-[18px] border-b text-[16px] font-semibold flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <span>Availability Calendar Settings</span>
          <p className="text-sm text-gray-500 font-normal mt-1">
            Define when patients can book appointments with you.
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
            {updateMutation.isPending ? "Saving..." : "Save Availability"}
          </Button>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="p-[18px] flex flex-wrap gap-[16px]">
            <FormField
              control={form.control}
              name="timezone"
              render={({ field }) => (
                <FormItem className="flex-1 min-w-full sm:min-w-[250px]">
                  <FormLabel className="text-[14px] font-medium">
                    Timezone
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className="w-full h-[48px]"
                      placeholder="e.g. Africa/Lagos"
                      disabled={!isEditing}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="effective_from"
              render={({ field }) => (
                <FormItem className="flex-1 min-w-full sm:min-w-[250px]">
                  <FormLabel className="text-[14px] font-medium">
                    Active From
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="date"
                      className="w-full h-[48px]"
                      disabled={!isEditing}
                      onChange={(e) => {
                        field.onChange(e);
                        const newFrom = e.target.value;
                        const curTo = form.getValues("effective_to");
                        if (curTo && newFrom > curTo) {
                          form.setValue("effective_to", newFrom, {
                            shouldDirty: true,
                          });
                          toast.warning(
                            "Active Until date adjusted — it can't be before the Active From date",
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
              name="effective_to"
              render={({ field }) => (
                <FormItem className="flex-1 min-w-full sm:min-w-[250px]">
                  <FormLabel className="text-[14px] font-medium">
                    Active Until
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="date"
                      className="w-full h-[48px]"
                      disabled={!isEditing}
                      onChange={(e) => {
                        const newTo = e.target.value;
                        const curFrom = form.getValues("effective_from");
                        if (curFrom && newTo < curFrom) {
                          form.setValue("effective_to", curFrom, {
                            shouldDirty: true,
                          });
                          toast.warning(
                            "Active Until date can't be before the Active From date",
                          );
                          return;
                        }
                        field.onChange(e);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="px-[18px]">
            <h3 className="font-semibold text-[15px] mb-4">Weekly Schedule</h3>
            <div className="border rounded-lg shadow-sm overflow-hidden overflow-x-auto">
              <div className="min-w-[700px]">
                <div className="bg-gray-50 border-b px-4 py-3 text-sm font-medium text-gray-600 flex gap-4 w-full">
                  <div className="w-[120px] shrink-0">Day</div>
                  <div className="w-[150px] shrink-0">Start Time</div>
                  <div className="w-[150px] shrink-0">End Time</div>
                  <div className="flex-1 text-right shrink-0">Active</div>
                </div>

                <div className="divide-y">
                  {fields.map((field, index) => {
                    const isActive = form.watch(
                      `weekly_slots.${index}.is_active`,
                    );

                    return (
                      <div
                        key={field.id}
                        className="flex items-center px-4 py-4 gap-4 transition-colors hover:bg-gray-50/50 w-full"
                      >
                        <div className="w-[120px] font-medium text-sm shrink-0">
                          {DAYS_OF_WEEK[index]}
                        </div>

                        <FormField
                          control={form.control}
                          name={`weekly_slots.${index}.start_time`}
                          render={({ field: startField }) => (
                            <FormItem className="w-[150px] space-y-1 shrink-0 m-0">
                              <FormControl>
                                <Input
                                  {...startField}
                                  type="time"
                                  step="900"
                                  className="h-[40px] w-full"
                                  disabled={!isEditing || !isActive}
                                  onChange={(e) => {
                                    startField.onChange(e);
                                    const newStartTime = e.target.value;
                                    const curEndTime = form.getValues(
                                      `weekly_slots.${index}.end_time`,
                                    );
                                    if (
                                      curEndTime &&
                                      newStartTime > curEndTime
                                    ) {
                                      form.setValue(
                                        `weekly_slots.${index}.end_time`,
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
                          name={`weekly_slots.${index}.end_time`}
                          render={({ field: endField }) => (
                            <FormItem className="w-[150px] space-y-1 shrink-0 m-0">
                              <FormControl>
                                <Input
                                  {...endField}
                                  type="time"
                                  step="900"
                                  className="h-[40px] w-full"
                                  disabled={!isEditing || !isActive}
                                  onChange={(e) => {
                                    const newEndTime = e.target.value;
                                    const curStartTime = form.getValues(
                                      `weekly_slots.${index}.start_time`,
                                    );
                                    if (
                                      curStartTime &&
                                      newEndTime < curStartTime
                                    ) {
                                      form.setValue(
                                        `weekly_slots.${index}.end_time`,
                                        curStartTime,
                                        { shouldDirty: true },
                                      );
                                      toast.warning(
                                        "End time can't be before the start time",
                                      );
                                      return;
                                    }
                                    endField.onChange(e);
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="flex-1 flex justify-end shrink-0 pointer-events-auto">
                          <FormField
                            control={form.control}
                            name={`weekly_slots.${index}.is_active`}
                            render={({ field: activeField }) => (
                              <FormItem className="m-0 flex items-center">
                                <FormControl>
                                  <Toggle
                                    checked={activeField.value}
                                    onChange={activeField.onChange}
                                    disabled={!isEditing}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="w-full px-[18px] flex sm:hidden">
            <Button
              type="submit"
              disabled={!isEditing || !isDirty || updateMutation.isPending}
              className="w-full"
            >
              {updateMutation.isPending ? "Saving..." : "Save Availability"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
