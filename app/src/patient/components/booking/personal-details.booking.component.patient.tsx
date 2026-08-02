import { useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { getPatientProfileReq } from "@/config/service/patient.service";
import { motion, Variants } from "framer-motion";
import { useFormContext, Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { BookingFormData } from "@/patient/lib/schemas";
import PillInput from "./pill-input";
import {
  COMMON_MEDICAL_CONDITIONS,
  COMMON_ALLERGIES,
} from "./pill-input.constants";

interface PersonalDetailsProps {
  onNext: () => void;
  isReschedule?: boolean;
}

const days = Array.from({ length: 31 }, (_, i) => String(i + 1));
const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const years = Array.from({ length: 100 }, (_, i) => String(2026 - i));

const MotionButton = motion.create(Button);

const PersonalDetails = ({ onNext, isReschedule }: PersonalDetailsProps) => {
  const {
    register,
    control,
    reset,
    getValues,
    formState: { errors },
  } = useFormContext<BookingFormData>();

  const { data: profileResp } = useQuery({
    queryKey: ["patientProfile"],
    queryFn: getPatientProfileReq,
    enabled: !isReschedule,
  });

  const profile = profileResp?.data;
  const hasPopulatedRef = useRef<boolean>(false);

  if (profile && !hasPopulatedRef.current) {
    hasPopulatedRef.current = true;
    const currentValues = getValues();
    const updatedValues = { ...currentValues };
    let hasChanges = false;

    const setIfEmpty = <K extends keyof BookingFormData>(
      key: K,
      value: BookingFormData[K] | undefined | null | string,
    ) => {
      if (!currentValues[key] && value) {
        updatedValues[key] = value as BookingFormData[K];
        hasChanges = true;
      }
    };

    setIfEmpty("firstName", profile.first_name);
    setIfEmpty("lastName", profile.last_name);

    if (profile.date_of_birth) {
      const d = new Date(profile.date_of_birth);
      if (!isNaN(d.getTime())) {
        setIfEmpty("dobDay", String(d.getDate()));
        setIfEmpty("dobMonth", months[d.getMonth()]);
        setIfEmpty("dobYear", String(d.getFullYear()));
      }
    }

    setIfEmpty("gender", profile.gender?.toLowerCase());
    setIfEmpty("maritalStatus", profile.marital_status?.toLowerCase());
    setIfEmpty("occupation", profile.occupation);

    if (hasChanges) {
      reset(updatedValues);
    }
  }

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="relative space-y-5"
    >
      {isReschedule && (
        <div className="absolute inset-x-0 top-0 bottom-[80px] z-[100] cursor-not-allowed bg-background/40 rounded-md backdrop-blur-[0.2px]" />
      )}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <div className="space-y-1">
          <Label className="text-sm font-medium text-foreground">
            First Name
          </Label>
          <Input
            {...register("firstName")}
            placeholder="Edwin"
            className=" border-border transition-colors focus-visible:ring-primary/50 hover:border-border/80"
          />
          {errors.firstName && (
            <p className="text-xs text-destructive mt-1">
              {errors.firstName.message}
            </p>
          )}
        </div>
        <div className="space-y-1">
          <Label className="text-sm font-medium text-foreground">
            Last Name
          </Label>
          <Input
            {...register("lastName")}
            placeholder="Anthony"
            className="border-border transition-colors focus-visible:ring-primary/50 hover:border-border/80"
          />
          {errors.lastName && (
            <p className="text-xs text-destructive mt-1">
              {errors.lastName.message}
            </p>
          )}
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="space-y-1">
        <Label className="text-sm font-medium text-foreground">
          Date of birth
        </Label>
        <div className="grid grid-cols-3 gap-2 md:gap-3">
          <div>
            <Controller
              name="dobDay"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="border-border transition-colors focus:ring-primary/50 hover:bg-muted/50">
                    <SelectValue placeholder="Day" />
                  </SelectTrigger>
                  <SelectContent>
                    {days.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.dobDay && (
              <p className="text-xs text-destructive mt-1">
                {errors.dobDay.message}
              </p>
            )}
          </div>
          <div>
            <Controller
              name="dobMonth"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="border-border transition-colors focus:ring-primary/50 hover:bg-muted/50">
                    <SelectValue placeholder="Month" />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.dobMonth && (
              <p className="text-xs text-destructive mt-1">
                {errors.dobMonth.message}
              </p>
            )}
          </div>
          <div>
            <Controller
              name="dobYear"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="border-border transition-colors focus:ring-primary/50 hover:bg-muted/50">
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((y) => (
                      <SelectItem key={y} value={y}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.dobYear && (
              <p className="text-xs text-destructive mt-1">
                {errors.dobYear.message}
              </p>
            )}
          </div>
        </div>
      </motion.div>

      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <div className="space-y-1">
          <Label className="text-sm font-medium text-foreground">Gender</Label>
          <Controller
            name="gender"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="border-border transition-colors focus:ring-primary/50 hover:bg-muted/50">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {errors.gender && (
            <p className="text-xs text-destructive mt-1">
              {errors.gender.message}
            </p>
          )}
        </div>
        <div className="space-y-1">
          <Label className="text-sm font-medium text-foreground">
            Marital Status
          </Label>
          <Controller
            name="maritalStatus"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="border-border transition-colors focus:ring-primary/50 hover:bg-muted/50">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Single</SelectItem>
                  <SelectItem value="married">Married</SelectItem>
                  <SelectItem value="divorced">Divorced</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {errors.maritalStatus && (
            <p className="text-xs text-destructive mt-1">
              {errors.maritalStatus.message}
            </p>
          )}
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="space-y-1">
        <Label className="text-sm font-medium text-foreground">
          Occupation
        </Label>
        <Input
          {...register("occupation")}
          placeholder="e.g. Software Developer"
          className="border-border transition-colors focus-visible:ring-primary/50 hover:border-border/80"
        />
        {errors.occupation && (
          <p className="text-xs text-destructive mt-1">
            {errors.occupation.message}
          </p>
        )}
      </motion.div>

      <motion.div variants={itemVariants} className="space-y-1">
        <Label className="text-sm font-medium text-foreground">
          Present Complaint
        </Label>
        <Input
          {...register("complaint")}
          placeholder="e.g. Persistent headache, Chest pain"
          className="border-border transition-colors focus-visible:ring-primary/50 hover:border-border/80"
        />
        {errors.complaint && (
          <p className="text-xs text-destructive mt-1">
            {errors.complaint.message}
          </p>
        )}
      </motion.div>

      <motion.div variants={itemVariants} className="space-y-1">
        <Label className="text-sm font-medium text-foreground">
          Complaint Brief
        </Label>
        <Textarea
          {...register("complaintBrief")}
          placeholder="Please describe your symptoms in detail — how long you've had them, severity, and any other relevant information"
          className="border-border min-h-[100px] resize-none transition-colors focus-visible:ring-primary/50 hover:border-border/80"
        />
      </motion.div>

      <motion.div variants={itemVariants} className="space-y-1">
        <Label className="text-sm font-medium text-foreground">
          Medical Conditions
        </Label>
        <Controller
          name="medicalConditions"
          control={control}
          render={({ field }) => (
            <PillInput
              value={field.value ?? []}
              onChange={field.onChange}
              suggestions={COMMON_MEDICAL_CONDITIONS}
              placeholder="Type a condition or select from list..."
            />
          )}
        />
      </motion.div>

      <motion.div variants={itemVariants} className="space-y-1">
        <Label className="text-sm font-medium text-foreground">Allergies</Label>
        <Controller
          name="allergies"
          control={control}
          render={({ field }) => (
            <PillInput
              value={field.value ?? []}
              onChange={field.onChange}
              suggestions={COMMON_ALLERGIES}
              placeholder="Type an allergy or select from list..."
            />
          )}
        />
      </motion.div>

      <motion.div
        variants={itemVariants}
        className="mt-6 border-t border-border pt-5"
      >
        <MotionButton className="h-10 w-full" onClick={onNext} type="button">
          Continue
        </MotionButton>
      </motion.div>
    </motion.div>
  );
};

export default PersonalDetails;
