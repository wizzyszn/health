import React, { useEffect, useState } from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarIcon, ChevronRight, ChevronLeft, X } from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  consultationFormSchema,
  type ConsultationFormValues,
} from "@/lib/validation-schemas";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  Consultation,
  ConsultationReqBody,
  GeneralReturnInt,
  Patient,
  RejectedPayload,
} from "@/lib/types";
import { toast } from "sonner";
import BtnSpinner from "@/shared/components/btn-spinner.component";
import { useSelector } from "react-redux";
import { RootState } from "@/config/stores/store";
import { AuthState } from "@/config/stores/slices/auth.slice";
import { consultADoctor } from "@/config/service/patient.service";
import QuillEditor from "@/shared/components/quill-editor.component";

interface ConsultationFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ConsultationFormModalBase({
  open,
  onOpenChange,
}: ConsultationFormModalProps) {
  const { user } = useSelector(
    (state: RootState) => state.auth,
  ) as AuthState<Patient>;
  const [step, setStep] = useState(1);
  const totalSteps = 3;
  const queryClient = useQueryClient();

  const form = useForm<ConsultationFormValues>({
    resolver: zodResolver(consultationFormSchema),
    defaultValues: {
      type: undefined,
      consoltation_for: undefined,
      title: "",
      details: "",
      session_start_date: "",
      session_end_date: "",
      patient_last_name: user?.user?.last_name ?? "",
      patient_first_name: user?.user?.first_name ?? "",
      patient_middle_name: user?.user?.middle_name ?? "",
      patient_age: 0,
      patient_dob: "",
      patient_address: "",
      patient_marital_status: "",
      patient_gender: "",
      patient_occupation: "",
      treatment_plan: "",
    },
  });
  useEffect(() => {
    if (user?.user) {
      form.reset({
        type: undefined,
        consoltation_for: undefined,
        title: "",
        details: "",
        session_start_date: "",
        session_end_date: "",
        patient_last_name: user?.user?.last_name ?? "",
        patient_first_name: user?.user?.first_name ?? "",
        patient_middle_name: user?.user?.middle_name ?? "",
        patient_age: 0,
        patient_dob: "",
        patient_address: "",
        patient_marital_status: "",
        patient_gender: "",
        patient_occupation: "",
        treatment_plan: "",
      });
    }
  }, [form, user?.user]);

  const handleClose = () => {
    onOpenChange(false);
  };

  const { isPending, mutate } = useMutation<
    GeneralReturnInt<Consultation>,
    RejectedPayload,
    ConsultationReqBody
  >({
    mutationFn: (variables) => consultADoctor(variables),
    onSuccess: (response) => {
      toast.success(response.response_description);
      queryClient.invalidateQueries({ queryKey: ["consultations"] });
      handleClose();
    },
    onError: (response) => {
      toast.error(response.message);
      console.error(response.message);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["consultations"] });
    },
  });

  function onSubmit(data: ConsultationFormValues) {
    mutate(data);
  }

  const nextStep = () => {
    if (step === 1) {
      form
        .trigger([
          "type",
          "consoltation_for",
          "title",
          "details",
          "session_start_date",
          "session_end_date",
        ])
        .then((isValid) => {
          if (isValid) setStep(step + 1);
        });
    } else if (step === 2) {
      form
        .trigger([
          "patient_last_name",
          "patient_first_name",
          "patient_age",
          "patient_dob",
          "patient_address",
          "patient_marital_status",
          "patient_gender",
          "patient_occupation",
        ])
        .then((isValid) => {
          if (isValid) setStep(step + 1);
        });
    }
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto min-w-[80%]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>New Consultation Request</span>
            <div className="text-sm font-normal text-muted-foreground">
              Step {step} of {totalSteps}
            </div>
          </DialogTitle>
          <DialogDescription>
            Fill out the form to create a new consultation request.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {step === 1 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">
                  Consultation Information
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Consultation Type*</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="CHAT">
                              Chat Consultation
                            </SelectItem>
                            <SelectItem value="AUDIO">
                              Audio Consultation
                            </SelectItem>
                            <SelectItem value="VIDEO">
                              Video Consultation
                            </SelectItem>
                            <SelectItem value="MEETADOCTOR">
                              In-Person Doctor Visit
                            </SelectItem>
                            <SelectItem value="HOMESERVICE">
                              Home Visit Consultation
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="consoltation_for"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Consultation For*</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value);
                            // Handle name field population based on selection
                            if (value === "SELF" && user?.user) {
                              form.setValue(
                                "patient_last_name",
                                user.user.last_name ?? "",
                              );
                              form.setValue(
                                "patient_first_name",
                                user.user.first_name ?? "",
                              );
                              form.setValue(
                                "patient_middle_name",
                                user.user.middle_name ?? "",
                              );
                            } else if (value === "OTHERS") {
                              form.setValue("patient_last_name", "");
                              form.setValue("patient_first_name", "");
                              form.setValue("patient_middle_name", "");
                            }
                          }}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Who is this consultation for?" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="SELF">For Myself</SelectItem>
                            <SelectItem value="OTHERS">
                              For Someone Else
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Complaint*</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Brief title for the consultation"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="details"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Details of your Complaint*</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe symptoms, concerns, or reason for consultation"
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="session_start_date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Preferred Start Date & Time*</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={`w-full pl-3 text-left font-normal ${!field.value ? "text-muted-foreground" : ""}`}
                              >
                                {field.value ? (
                                  format(new Date(field.value), "PPP HH:mm")
                                ) : (
                                  <span>Pick a date and time</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <div className="flex flex-col">
                              <Calendar
                                mode="single"
                                selected={
                                  field.value
                                    ? new Date(field.value)
                                    : undefined
                                }
                                onSelect={(date) => {
                                  const newDate = date || new Date();
                                  // Set time to 6:00 AM (earliest available time)
                                  newDate.setHours(6, 0, 0, 0);
                                  field.onChange(newDate.toISOString());
                                  // Automatically set end date to 15 minutes later (06:15)
                                  const endDate = new Date(newDate);
                                  endDate.setMinutes(15);
                                  form.setValue(
                                    "session_end_date",
                                    endDate.toISOString(),
                                  );
                                  form.trigger("session_end_date");
                                  form.trigger("session_start_date");
                                }}
                                disabled={(date) =>
                                  date <
                                  new Date(new Date().setHours(0, 0, 0, 0))
                                }
                                initialFocus
                              />
                              <div className="p-3 border-t">
                                <div className="flex gap-2">
                                  <select
                                    className="w-[100px] rounded-md border p-2"
                                    value={
                                      field.value
                                        ? new Date(field.value)
                                            .getHours()
                                            .toString()
                                            .padStart(2, "0")
                                        : "06"
                                    }
                                    onChange={(e) => {
                                      const newDate = field.value
                                        ? new Date(field.value)
                                        : new Date();
                                      newDate.setHours(
                                        parseInt(e.target.value),
                                      );
                                      field.onChange(newDate.toISOString());
                                      // Automatically set end date to 15 minutes later
                                      const endDate = new Date(newDate);
                                      endDate.setMinutes(
                                        newDate.getMinutes() + 15,
                                      );
                                      form.setValue(
                                        "session_end_date",
                                        endDate.toISOString(),
                                      );
                                      form.trigger("session_end_date");
                                      form.trigger("session_start_date");
                                    }}
                                  >
                                    {Array.from({ length: 24 }, (_, i) => {
                                      if (i < 6 || i > 21) return null;
                                      return (
                                        <option
                                          key={i}
                                          value={i.toString().padStart(2, "0")}
                                        >
                                          {i.toString() +
                                            `${i < 12 ? "am" : "pm"}`}
                                        </option>
                                      );
                                    })}
                                  </select>
                                  <span className="self-center">:</span>
                                  <select
                                    className="w-[100px] rounded-md border p-2"
                                    value={
                                      field.value
                                        ? new Date(field.value)
                                            .getMinutes()
                                            .toString()
                                            .padStart(2, "0")
                                        : "00"
                                    }
                                    onChange={(e) => {
                                      const newDate = field.value
                                        ? new Date(field.value)
                                        : new Date();
                                      newDate.setMinutes(
                                        parseInt(e.target.value),
                                      );
                                      field.onChange(newDate.toISOString());
                                      // Automatically set end date to 15 minutes later
                                      const endDate = new Date(newDate);
                                      endDate.setMinutes(
                                        newDate.getMinutes() + 15,
                                      );
                                      form.setValue(
                                        "session_end_date",
                                        endDate.toISOString(),
                                      );
                                      form.trigger("session_end_date");
                                      form.trigger("session_start_date");
                                    }}
                                  >
                                    {[0, 15, 30, 45].map((i) => (
                                      <option
                                        key={i}
                                        value={i.toString().padStart(2, "0")}
                                      >
                                        {i.toString().padStart(2, "0")}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="session_end_date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Preferred End Date & Time*</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={`w-full pl-3 text-left font-normal ${!field.value ? "text-muted-foreground" : ""}`}
                              >
                                {field.value ? (
                                  format(new Date(field.value), "PPP HH:mm")
                                ) : (
                                  <span>Pick a date and time</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <div className="flex flex-col">
                              <Calendar
                                mode="single"
                                selected={
                                  field.value
                                    ? new Date(field.value)
                                    : undefined
                                }
                                onSelect={(date) => {
                                  const currentValue = field.value
                                    ? new Date(field.value)
                                    : new Date();
                                  const newDate = date || new Date();
                                  newDate.setHours(currentValue.getHours());
                                  newDate.setMinutes(currentValue.getMinutes());
                                  field.onChange(newDate.toISOString());
                                  form.trigger("session_start_date");
                                }}
                                disabled={(date) => {
                                  const startDateStr =
                                    form.getValues("session_start_date");
                                  const startDate = new Date(startDateStr);
                                  return (
                                    date.toDateString() !==
                                    startDate.toDateString()
                                  );
                                }}
                                initialFocus
                              />
                              <div className="p-3 border-t">
                                <div className="flex gap-2">
                                  <select
                                    className="w-[100px] rounded-md border p-2"
                                    value={
                                      field.value
                                        ? new Date(field.value)
                                            .getHours()
                                            .toString()
                                            .padStart(2, "0")
                                        : "00"
                                    }
                                    onChange={(e) => {
                                      const newDate = field.value
                                        ? new Date(field.value)
                                        : new Date();
                                      newDate.setHours(
                                        parseInt(e.target.value),
                                      );
                                      field.onChange(newDate.toISOString());
                                      form.trigger("session_start_date");
                                    }}
                                  >
                                    {Array.from({ length: 24 }, (_, i) => {
                                      if (i < 6 || i > 22) return null;
                                      return (
                                        <option
                                          key={i}
                                          value={i.toString().padStart(2, "0")}
                                        >
                                          {i.toString() +
                                            `${i < 12 ? "am" : "pm"}`}
                                        </option>
                                      );
                                    })}
                                  </select>
                                  <span className="self-center">:</span>
                                  <select
                                    className="w-[100px] rounded-md border p-2"
                                    value={
                                      field.value
                                        ? new Date(field.value)
                                            .getMinutes()
                                            .toString()
                                            .padStart(2, "0")
                                        : "00"
                                    }
                                    onChange={(e) => {
                                      const newDate = field.value
                                        ? new Date(field.value)
                                        : new Date();
                                      newDate.setMinutes(
                                        parseInt(e.target.value),
                                      );
                                      field.onChange(newDate.toISOString());
                                      form.trigger("session_start_date");
                                    }}
                                  >
                                    {[0, 15, 30, 45].map((i) => (
                                      <option
                                        key={i}
                                        value={i.toString().padStart(2, "0")}
                                      >
                                        {i.toString().padStart(2, "0")}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  {(() => {
                    const start = form.watch("session_start_date");
                    const end = form.watch("session_end_date");
                    if (!start || !end) return "Duration: Not set";

                    const startDate = new Date(start);
                    const endDate = new Date(end);
                    const diffMs = endDate.getTime() - startDate.getTime();

                    if (diffMs < 0)
                      return "Duration: End time must be after start time";

                    const hours = Math.floor(diffMs / (1000 * 60 * 60));
                    const minutes = Math.floor(
                      (diffMs % (1000 * 60 * 60)) / (1000 * 60),
                    );

                    let duration = "Duration: ";
                    if (hours > 0) {
                      duration += `${hours} hour${hours !== 1 ? "s" : ""}`;
                    }
                    if (minutes > 0) {
                      if (hours > 0) duration += " ";
                      duration += `${minutes} minute${minutes !== 1 ? "s" : ""}`;
                    }
                    if (hours === 0 && minutes === 0) {
                      duration += "0 minutes";
                    }

                    return duration;
                  })()}
                </div>
                <SessionDetatils form={form} />
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Patient Information</h3>

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="patient_last_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name*</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Last name"
                            disabled={form.watch("consoltation_for") === "SELF"}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="patient_first_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name*</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="First name"
                            disabled={form.watch("consoltation_for") === "SELF"}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="patient_middle_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Middle Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Middle name"
                            disabled={form.watch("consoltation_for") === "SELF"}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="patient_dob"
                    render={({ field }) => (
                      <FormItem className="flex flex-col justify-end">
                        <FormLabel>Date of Birth*</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={`w-full pl-3 text-left font-normal ${!field.value ? "text-muted-foreground" : ""}`}
                              >
                                {field.value ? (
                                  format(new Date(field.value), "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={
                                field.value ? new Date(field.value) : undefined
                              }
                              onSelect={(date) => {
                                field.onChange(date ? date.toISOString() : "");
                                if (date) {
                                  const today = new Date();
                                  let age =
                                    today.getFullYear() - date.getFullYear();
                                  const m = today.getMonth() - date.getMonth();
                                  if (
                                    m < 0 ||
                                    (m === 0 &&
                                      today.getDate() < date.getDate())
                                  ) {
                                    age--;
                                  }
                                  form.setValue("patient_age", age);
                                }
                              }}
                              disabled={(date) => date > new Date()}
                              initialFocus
                              fromYear={1900}
                              toYear={new Date().getFullYear()}
                              captionLayout="dropdown"
                              fromMonth={new Date(1900, 0)}
                              toMonth={new Date()}
                              classNames={{
                                caption: "",
                                dropdown:
                                  "bg-white border border-gray-300 rounded px-2 py-1 text-sm",
                                caption_label: " hidden",
                              }}
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="patient_age"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Age*</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Age"
                            disabled={true}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="patient_address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address*</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Full address"
                          className="min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="patient_gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gender*</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                            <SelectItem value="prefer_not_to_say">
                              Prefer not to say
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="patient_marital_status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Marital Status</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="single">Single</SelectItem>
                            <SelectItem value="married">Married</SelectItem>
                            <SelectItem value="divorced">Divorced</SelectItem>
                            <SelectItem value="widowed">Widowed</SelectItem>
                            <SelectItem value="separated">Separated</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="patient_occupation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Occupation</FormLabel>
                      <FormControl>
                        <Input placeholder="Current occupation" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Medical History</h3>

                <FormField
                  control={form.control}
                  name="treatment_plan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel></FormLabel>
                      <FormControl>
                        {/* <Textarea
                          placeholder="Describe the proposed treatment plan (if known)"
                          className="min-h-[150px]"
                          {...field}
                        />*/}
                        <QuillEditor
                          value={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <DialogFooter className="flex justify-between">
              {step > 1 ? (
                <Button type="button" variant="outline" onClick={prevStep}>
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Previous
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
              )}

              {step < totalSteps ? (
                <Button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    nextStep();
                  }}
                >
                  Next
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button type="submit" disabled={isPending}>
                  {isPending ? <BtnSpinner /> : "Submit Consultation"}
                </Button>
              )}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

const ConsultationFormModal = React.memo(
  ConsultationFormModalBase,
  (prevProps, nextProps) => {
    return (
      prevProps.onOpenChange === nextProps.onOpenChange &&
      prevProps.open === nextProps.open
    );
  },
);

export default ConsultationFormModal;

const SessionDetatils = ({
  form,
}: {
  form: UseFormReturn<ConsultationFormValues>;
}) => {
  const startTime = form.watch("session_start_date");
  const endTime = form.watch("session_end_date");
  const difference =
    new Date(endTime).getTime() - new Date(startTime).getTime();
  const number_of_session = Math.floor(difference / (1000 * 60) / 15);
  return (
    <div>
      <h3 className="font-medium">
        Please note that a session lasts 15 minutes.
      </h3>
      <p className="text-blue-600">
        {!isNaN(number_of_session) &&
          number_of_session > 0 &&
          `${number_of_session > 1 ? number_of_session + " sessions" : number_of_session + " session"}`}
      </p>
    </div>
  );
};
