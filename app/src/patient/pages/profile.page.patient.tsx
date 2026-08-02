import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDispatch } from "react-redux";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import avatar from "@/assets/images/profile-image.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import MainPageHeader from "@/shared/components/main-page-header.component.shared";
import { profileSchema } from "@/auth/patient/lib/schemas";
import { cn } from "@/lib/utils";
import { Camera, Eye, EyeOff, LogOut, MoveLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  getPatientProfileReq,
  updatePatientProfileReq,
  updatePatientProfilePictureReq,
  updatePatientTimezoneReq,
} from "@/config/service/patient.service";
import { changePasswordReq } from "@/config/service/auth.service";
import { GeneralReturnInt, PatientProfileInterface } from "@/lib/types";
import TimezoneSelector from "@/shared/components/timezone-selector.component.shared";
import { logout, setTimezone } from "@/config/stores/slices/auth.slice";
import Spinner from "@/shared/components/spinner.component";

type ProfileFormValues = z.infer<typeof profileSchema>;

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Passwords do not match",
    path: ["confirmNewPassword"],
  });

type ChangePasswordValues = z.infer<typeof changePasswordSchema>;

const timezoneSchema = z.object({
  timezone: z.string().min(1, "Timezone is required"),
});

type TimezoneValues = z.infer<typeof timezoneSchema>;

function calculateAge(dob: string | null | undefined): string {
  if (!dob) return "";
  const birthDate = new Date(dob);
  if (isNaN(birthDate.getTime())) return "";

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return String(age);
}

const Toggle = ({
  label,
  checked,
  onChange,
}: {
  label?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) => {
  return (
    <label className="group flex justify-between items-center gap-[7px] cursor-pointer select-none text-[14px]">
      <span className="ml-3 text-[#6C6C6C] font-semibold">{label}</span>
      <div className="relative">
        <Input
          type="checkbox"
          className="sr-only peer"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
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

function ProfileAvatar({
  first_name,
  last_name,
  img,
  _id,
  preview,
}: {
  first_name: string;
  last_name: string;
  img?: string | null;
  _id: string;
  preview?: string | null;
}) {
  const displayImage = preview || (img && img.trim() !== "" ? img : avatar);

  return (
    <div className="flex flex-col justify-center items-center gap-[9px]">
      <div className="relative w-auto inline-block">
        <Avatar className="w-[103px] h-[103px]">
          <AvatarImage src={displayImage} alt="Profile picture" />
          <AvatarFallback>
            {first_name?.[0]}
            {last_name?.[0]}
          </AvatarFallback>
        </Avatar>

        <div
          className="
            absolute -bottom-1 left-[55px] w-10 h-10
            bg-gray-50 rounded-full flex items-center justify-center
            border border-gray-300 shadow-sm
            transition-all hover:bg-gray-100 cursor-pointer
          "
        >
          <Camera className="text-gray-700" size={24} />
        </div>
      </div>

      <div className="flex flex-col gap-2 justify-center items-center">
        <span className="text-[12px]">
          {first_name} {last_name}
        </span>
        <div className="p-1 bg-[#F7F7F7] text-[10px] rounded-sm">
          <span>ID: </span>
          <span className="font-medium">{_id}</span>
        </div>
      </div>
    </div>
  );
}

export default function PatientProfile() {
  const [isEditing, setIsEditing] = useState(false);
  const [originalValues, setOriginalValues] =
    useState<ProfileFormValues | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null); // ✅ hold file until save

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["patient-profile"],
    queryFn: getPatientProfileReq,
  });

  useEffect(() => {
    if (isError) {
      toast.error("Failed to load profile");
    }
  }, [isError]);

  const changePasswordForm = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: changePasswordReq,
    onSuccess: () => {
      toast.success("Password changed successfully!");
      changePasswordForm.reset();
    },
    onError: (error) => {
      const err = error as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      const errorData =
        err.response?.data?.message ||
        err.message ||
        "Failed to change password";
      toast.error(errorData);
    },
  });

  const profile = data?.data;

  const timezoneForm = useForm<TimezoneValues>({
    resolver: zodResolver(timezoneSchema),
    defaultValues: {
      timezone: "",
    },
    values: profile ? { timezone: profile.timezone || "" } : undefined,
  });

  const timezoneMutation = useMutation({
    mutationFn: updatePatientTimezoneReq,
    onSuccess: (_, variables) => {
      dispatch(setTimezone(variables.timezone));
      toast.success("Timezone updated successfully!");
    },
    onError: (error) => {
      const err = error as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      toast.error(
        err.response?.data?.message ||
          err.message ||
          "Failed to update timezone",
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (values: ProfileFormValues) => {
      if (pendingFile) {
        return updatePatientProfilePictureReq({
          file: pendingFile,
          first_name: values.first_name,
          last_name: values.last_name,
          phone_number: values.phone_number,
          date_of_birth: values.date_of_birth,
          gender: values.gender,
          marital_status: values.marital_status,
          occupation: values.occupation,
          address: values.address,
        });
      }
      return updatePatientProfileReq({
        first_name: values.first_name,
        last_name: values.last_name,
        phone_number: values.phone_number,
        date_of_birth: values.date_of_birth,
        gender: values.gender,
        marital_status: values.marital_status,
        occupation: values.occupation,
        address: values.address,
        allergies: values.allergies
          ? values.allergies.split(",").map((a) => a.trim())
          : [],
        previous_medical_conditions: values.background_medical_condition
          ? values.background_medical_condition.split(",").map((c) => c.trim())
          : [],
      });
    },
    onSuccess: (response) => {
      toast.success("Profile updated successfully!");
      setIsEditing(false);
      setPendingFile(null);
      setPreviewImage(null);

      queryClient.setQueryData(["patient-profile"], (old: typeof data) => ({
        ...old,
        data: (response as GeneralReturnInt<PatientProfileInterface>).data,
      }));

      setOriginalValues(form.getValues());
    },
    onError: () => {
      toast.error("Failed to update profile");
    },
  });

  const removePhotoMutation = useMutation({
    mutationFn: () =>
      updatePatientProfileReq({
        profile_picture_url: "",
      }),
    onSuccess: () => {
      toast.success("Photo removed.");
      setPreviewImage(null);
      setPendingFile(null);

      queryClient.setQueryData(["patient-profile"], (old: typeof data) => ({
        ...old,
        data: { ...old?.data, profile_picture_url: "" },
      }));
    },
    onError: () => {
      toast.error("Failed to remove photo.");
    },
  });

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      phone_number: "",
      date_of_birth: "",
      gender: "",
      marital_status: "",
      occupation: "",
      address: "",
      allergies: "",
      background_medical_condition: "",
    },
  });

  useEffect(() => {
    if (!profile) return;

    const values: ProfileFormValues = {
      _id: profile._id || "",
      registration_no: profile.registration_no || "",
      first_name: profile.first_name || "",
      last_name: profile.last_name || "",
      email: profile.email || "",
      phone_number: profile.phone_number ?? "",
      date_of_birth: profile.date_of_birth
        ? profile.date_of_birth.split("T")[0]
        : "",
      age: calculateAge(profile.date_of_birth),
      gender: profile.gender || "",
      marital_status: profile.marital_status || "",
      occupation: profile.occupation ?? "",
      address: profile.address ?? "",
      allergies: Array.isArray(profile.allergies)
        ? profile.allergies.join(", ")
        : "",
      background_medical_condition:
        profile.previous_medical_conditions?.join(", ") ?? "",
    };

    form.reset(values);
    setOriginalValues(values);
  }, [profile, form]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image too large (max 5MB)");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage(reader.result as string);
    };
    reader.readAsDataURL(file);
    setPendingFile(file);
  };

  function onSubmit(values: ProfileFormValues) {
    updateMutation.mutate(values);
  }

  function handleCancel() {
    if (originalValues) form.reset(originalValues);
    setPreviewImage(null);
    setPendingFile(null);
    setIsEditing(false);
    toast.info("Changes discarded");
  }

  function handleLogout() {
    dispatch(logout());
    navigate("/patient/login");
  }

  // Whether there is currently a real photo (existing or newly selected)
  const hasPhoto = !!previewImage || !!profile?.profile_picture_url;

  if (isLoading) return <Spinner />;
  if (!profile) return null;

  return (
    <div className="space-y-8">
      <div>
        <div className="mb-4 flex items-center justify-between md:mb-5">
          <button
            onClick={() => navigate(-1)}
            className="flex w-fit items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground group"
          >
            <MoveLeft className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" />
            Back
          </button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleLogout}
            className="h-9 gap-2 px-3 md:hidden"
          >
            <LogOut className="size-4" />
            Logout
          </Button>
        </div>
        <MainPageHeader
          heading="Patient Profile"
          subHeading="Manage your personal information and medical history"
        />
      </div>

      <div className="bg-white">
        <div className="flex items-center justify-between border-b p-[18px]">
          <h2 className="text-[16px] font-semibold">Profile Information</h2>
          <Toggle
            label={"Edit Mode"}
            checked={isEditing}
            onChange={setIsEditing}
          />
        </div>

        <div className="px-6 py-4 space-y-8">
          <div className="flex gap-[24px] items-center">
            <ProfileAvatar
              first_name={profile.first_name}
              last_name={profile.last_name}
              img={profile.profile_picture_url}
              _id={profile.registration_no}
              preview={previewImage}
            />

            <Input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            <div className="flex flex-col sm:flex-row gap-4">
              {/* Change photo — disabled when not editing */}
              <Button
                type="button"
                className="w-full sm:w-[292.5px] min-w-[250px] bg-[#F7F7F7] hover:bg-[#F7F7F7]/80 text-black transition-colors"
                onClick={() => fileInputRef.current?.click()}
                disabled={!isEditing}
              >
                {pendingFile
                  ? "Photo selected — save to upload"
                  : "Change photo"}
              </Button>

              <Button
                type="button"
                variant="destructive"
                className="w-full sm:w-[292.5px] min-w-[250px] bg-[#FDE7E5] hover:bg-[#FDE7E5]/80 text-[#D92D20] transition-colors"
                onClick={() => {
                  if (pendingFile) {
                    setPreviewImage(null);
                    setPendingFile(null);
                    return;
                  }
                  removePhotoMutation.mutate();
                }}
                disabled={
                  !isEditing || !hasPhoto || removePhotoMutation.isPending
                }
              >
                {removePhotoMutation.isPending ? "Removing..." : "Remove photo"}
              </Button>
            </div>
          </div>
        </div>

        <div className="px-6 py-5 border-b text-[16px] font-semibold">
          <span className="">Biodata</span>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="px-6 py-4 flex flex-wrap justify-between gap-[16px]">
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem className="flex-1 min-w-[300px]">
                    <FormLabel className="text-[14px] font-medium">
                      First Name
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="w-full h-[48px]"
                        placeholder="First Name"
                        disabled={!isEditing}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem className="flex-1 min-w-[300px]">
                    <FormLabel className="text-[14px] font-medium">
                      Last Name
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="w-full h-[48px]"
                        placeholder="Last Name"
                        disabled={!isEditing}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="flex-1 min-w-[300px]">
                    <FormLabel className="text-[14px] font-medium">
                      Email
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        className="w-full h-[48px]"
                        placeholder="Email"
                        disabled={true}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone_number"
                render={({ field }) => (
                  <FormItem className="flex-1 min-w-[300px]">
                    <FormLabel className="text-[14px] font-medium">
                      Phone
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="w-full h-[48px]"
                        placeholder="Phone Number"
                        disabled={!isEditing}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="px-6 py-5 border-b text-[16px] font-semibold">
              <span className="">Personal Information</span>
            </div>

            <div className="px-6 flex flex-wrap justify-between gap-[16px]">
              <FormField
                control={form.control}
                name="age"
                render={({ field }) => (
                  <FormItem className="flex-1 min-w-[300px]">
                    <FormLabel className="text-[14px] font-medium">
                      Age
                    </FormLabel>
                    <Input
                      {...field}
                      className="w-full h-[48px] bg-muted cursor-not-allowed"
                      placeholder="Calculated from date of birth"
                      disabled={true}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date_of_birth"
                render={({ field }) => (
                  <FormItem className="flex-1 min-w-[300px]">
                    <FormLabel className="text-[14px] font-medium">
                      Date of Birth
                    </FormLabel>
                    <Input
                      {...field}
                      type="date"
                      className="w-full h-[48px]"
                      disabled={!isEditing}
                      onChange={(e) => {
                        field.onChange(e);
                        const calculated = calculateAge(e.target.value);
                        form.setValue("age", calculated);
                      }}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem className="flex-1 min-w-[300px]">
                    <FormLabel className="text-[14px] font-medium">
                      Gender
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={!isEditing}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full h-[48px]">
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="marital_status"
                render={({ field }) => (
                  <FormItem className="flex-1 min-w-[300px]">
                    <FormLabel className="text-[14px] font-medium">
                      Marital Status
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={!isEditing}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full h-[48px]">
                          <SelectValue placeholder="Select Marital Status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Single">Single</SelectItem>
                        <SelectItem value="Married">Married</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="occupation"
                render={({ field }) => (
                  <FormItem className="flex-1 min-w-[300px]">
                    <FormLabel className="text-[14px] font-medium">
                      Occupation
                    </FormLabel>
                    <Input
                      {...field}
                      className="w-full h-[48px]"
                      placeholder="Occupation"
                      disabled={!isEditing}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem className="flex-1 min-w-[300px]">
                    <FormLabel className="text-[14px] font-medium">
                      Address
                    </FormLabel>
                    <Input
                      {...field}
                      className="w-full h-[48px]"
                      placeholder="Address"
                      disabled={!isEditing}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="px-6 py-5 border-b text-[16px] font-semibold">
              <span className="">Medical Information</span>
            </div>

            <div className="px-6 py-4 flex flex-wrap justify-between gap-[16px]">
              <FormField
                control={form.control}
                name="allergies"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel className="text-[14px] font-medium">
                      Allergies
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="e.g. Penicillin, Peanuts, Shellfish"
                        className="min-h-[80px] resize-y"
                        disabled={!isEditing}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="background_medical_condition"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel className="text-[14px] font-medium">
                      Background Medical Condition
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="e.g. Asthma (childhood), Appendectomy (2019)"
                        className="min-h-[80px] resize-y"
                        disabled={!isEditing}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {isEditing && (
              <div className="w-full p-[18px] flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  className="min-w-[140px] w-[48%]"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="min-w-[140px] w-[48%]"
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            )}
          </form>
        </Form>
      </div>

      <div className="bg-white pb-[18px]">
        <div className="p-[18px] border-b text-[16px] font-semibold">
          <span className="">Timezone Settings</span>
        </div>
        <Form {...timezoneForm}>
          <form
            onSubmit={timezoneForm.handleSubmit((values) =>
              timezoneMutation.mutate(values),
            )}
            className="space-y-6"
          >
            <div className="p-[18px] flex flex-wrap justify-between gap-[16px]">
              <FormField
                control={timezoneForm.control}
                name="timezone"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel className="text-[14px] font-medium">
                      Your Timezone
                    </FormLabel>
                    <TimezoneSelector
                      value={field.value}
                      onChange={field.onChange}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="w-full px-[18px] flex">
              <Button
                type="submit"
                disabled={timezoneMutation.isPending}
                className="w-full sm:w-[200px]"
              >
                {timezoneMutation.isPending ? "Updating..." : "Update Timezone"}
              </Button>
            </div>
          </form>
        </Form>
      </div>

      <div className="bg-white pb-[18px]">
        <div className="p-[18px] border-b text-[16px] font-semibold">
          <span className="">Change Password</span>
        </div>
        <Form {...changePasswordForm}>
          <form
            onSubmit={changePasswordForm.handleSubmit((values) =>
              changePasswordMutation.mutate(values),
            )}
            className="space-y-6"
          >
            <div className="p-[18px] flex flex-wrap justify-between gap-[16px]">
              <FormField
                control={changePasswordForm.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel className="text-[14px] font-medium">
                      Current Password
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showCurrentPassword ? "text" : "password"}
                          placeholder="Current Password"
                          {...field}
                          className="h-[48px] pr-12"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowCurrentPassword(!showCurrentPassword)
                          }
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showCurrentPassword ? (
                            <EyeOff className="w-5 h-5" />
                          ) : (
                            <Eye className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={changePasswordForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem className="flex-1 min-w-[300px]">
                    <FormLabel className="text-[14px] font-medium">
                      New Password
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showNewPassword ? "text" : "password"}
                          placeholder="New Password"
                          {...field}
                          className="h-[48px] pr-12"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showNewPassword ? (
                            <EyeOff className="w-5 h-5" />
                          ) : (
                            <Eye className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={changePasswordForm.control}
                name="confirmNewPassword"
                render={({ field }) => (
                  <FormItem className="flex-1 min-w-[300px]">
                    <FormLabel className="text-[14px] font-medium">
                      Confirm New Password
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirm New Password"
                          {...field}
                          className="h-[48px] pr-12"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="w-5 h-5" />
                          ) : (
                            <Eye className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="w-full px-[18px] flex">
              <Button
                type="submit"
                disabled={changePasswordMutation.isPending}
                className="w-full sm:w-[200px]"
              >
                {changePasswordMutation.isPending
                  ? "Changing..."
                  : "Change Password"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
