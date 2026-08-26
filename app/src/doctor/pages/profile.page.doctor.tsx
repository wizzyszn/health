import { useState, useRef } from "react";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import MainPageHeader from "@/shared/components/main-page-header.component.shared";
import { profileSchema } from "@/auth/doctor/lib/schemas";
import { cn } from "@/lib/utils";
import { Camera, Eye, EyeOff, LogOut, MoveLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import DoctorAvailabilityTab from "@/doctor/components/doctor-availability-tab.component.doctor";
import DoctorBlackouts from "@/doctor/components/doctor-blackouts.component.doctor";
import {
  getDoctorProfileReq,
  updateDoctorProfileReq,
  updateDoctorProfilePictureReq,
  updateDoctorTimezoneReq,
} from "@/config/service/doctor.service";

import TimezoneSelector from "@/shared/components/timezone-selector.component.shared";
import { changePasswordReq } from "@/config/service/auth.service";
import { logout, setTimezone } from "@/config/stores/slices/auth.slice";
import { GeneralReturnInt } from "@/lib/types";
import Spinner from "@/shared/components/spinner.component";
import SEO from "@/shared/components/seo.component";

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
          className="sr-only pWisdomeer"
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
          Dr. {first_name} {last_name}
        </span>
        <div className="p-1 bg-[#F7F7F7] text-[10px] rounded-sm">
          <span>ID:</span>
          <span className="font-medium">{_id}</span>
        </div>
      </div>
    </div>
  );
}

type DoctorProfile = {
  _id: string;
  doctor_no: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone_number: string;
  active: boolean;
  specializations: string[];
  license_no: string;
  createdAt: string;
  updatedAt: string;
  id: string;
  profile_picture_url?: string;
  timezone?: string;
};

export default function DoctorProfile() {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const dispatch = useDispatch();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["doctor-profile"],
    queryFn: getDoctorProfileReq,
  });

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

  const profile = data?.data as DoctorProfile | undefined;

  const timezoneForm = useForm<TimezoneValues>({
    resolver: zodResolver(timezoneSchema),
    defaultValues: {
      timezone: "",
    },
    values: profile ? { timezone: profile.timezone || "" } : undefined,
  });

  const timezoneMutation = useMutation({
    mutationFn: updateDoctorTimezoneReq,
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

  // If there's a pending file, send multipart; otherwise send JSON
  const updateMutation = useMutation({
    mutationFn: async (values: ProfileFormValues) => {
      if (pendingFile) {
        return updateDoctorProfilePictureReq({
          file: pendingFile,
          first_name: values.first_name,
          last_name: values.last_name,
          phone_number: values.phone_number,
        });
      }
      return updateDoctorProfileReq({
        first_name: values.first_name,
        last_name: values.last_name,
        phone_number: values.phone_number,
      });
    },
    onSuccess: (response) => {
      toast.success("Profile updated successfully!");
      setIsEditing(false);
      setPendingFile(null);
      setPreviewImage(null);

      queryClient.setQueryData(["doctor-profile"], (old: unknown) => {
        const oldData = old as { data: DoctorProfile } | undefined;
        const returned = (response as GeneralReturnInt<DoctorProfile>).data;
        return {
          ...oldData,
          data: {
            ...oldData?.data,
            ...returned,
          },
        };
      });
    },
    onError: () => {
      toast.error("Failed to update profile");
    },
  });

  // Remove photo — sends profile_picture_url as "" to clear it on the server
  const removePhotoMutation = useMutation({
    mutationFn: () =>
      updateDoctorProfileReq({
        first_name: profile?.first_name,
        last_name: profile?.last_name,
        phone_number: profile?.phone_number,
        profile_picture_url: "",
      }),
    onSuccess: () => {
      toast.success("Photo removed.");
      setPreviewImage(null);
      setPendingFile(null);

      queryClient.setQueryData(["doctor-profile"], (old: unknown) => {
        const oldData = old as { data: DoctorProfile } | undefined;
        return {
          ...oldData,
          data: { ...oldData?.data, profile_picture_url: "" },
        };
      });
    },
    onError: () => {
      toast.error("Failed to remove photo.");
    },
  });

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      doctor_no: "",
      first_name: "",
      last_name: "",
      email: "",
      phone_number: "",
    },
    values: profile
      ? {
          _id: profile._id || "",
          doctor_no: profile.doctor_no || "",
          first_name: profile.first_name || "",
          last_name: profile.last_name || "",
          email: profile.email || "",
          phone_number: profile.phone_number ?? "",
        }
      : undefined,
  });

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

    // Preview locally — upload happens on Save Changes
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
    form.reset();
    setPreviewImage(null);
    setPendingFile(null);
    setIsEditing(false);
    toast.info("Changes discarded");
  }

  function handleLogout() {
    dispatch(logout());
    navigate("/doctor/login");
  }

  // Whether there is currently a real photo (existing or newly selected)
  const hasPhoto = !!previewImage || !!profile?.profile_picture_url;

  if (isLoading) return <Spinner />;
  if (isError)
    return (
      <div className="p-8 text-center text-red-500 font-medium">
        Failed to load profile
      </div>
    );
  if (!profile) return null;

  return (
    <>
      <SEO
        title="Doctor Profile"
        description="View and edit your doctor profile, specializations, and personal details on Carelexa."
        canonicalPath="/doctor/dashboard/profile"
      />
      <div className="space-y-4 sm:space-y-8">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group"
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
          heading="Doctor Profile"
          subHeading="Manage your professional and personal information"
        />

        <div className="w-full rounded-xl bg-white shadow-sm border border-border">
          <Tabs defaultValue="profile">
            <div className="flex items-center justify-between px-4 border-b overflow-x-auto w-full no-scrollbar">
              <TabsList className="h-auto gap-0 rounded-none bg-transparent p-0 w-full flex justify-start min-w-max">
                <TabsTrigger
                  value="profile"
                  className="rounded-none border-b-[3px] border-transparent px-4 py-3 text-[14px] sm:text-[15px] font-semibold text-gray-500 shadow-none data-[state=active]:text-primary data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                >
                  Profile Details
                </TabsTrigger>
                <TabsTrigger
                  value="availability"
                  className="rounded-none border-b-[3px] border-transparent px-4 py-3 text-[14px] sm:text-[15px] font-semibold text-gray-500 shadow-none data-[state=active]:text-primary data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                >
                  Availability Slots
                </TabsTrigger>
                <TabsTrigger
                  value="blackouts"
                  className="rounded-none border-b-[3px] border-transparent px-4 py-3 text-[14px] sm:text-[15px] font-semibold text-gray-500 shadow-none data-[state=active]:text-primary data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                >
                  Blackout Periods
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="profile" className="mt-0">
              <div className="bg-white rounded-b-xl">
                <div className="flex items-center justify-between border-b p-[18px]">
                  <h2 className="text-[16px] font-semibold">
                    Personal Information
                  </h2>
                  <Toggle
                    label={"Edit Mode"}
                    checked={isEditing}
                    onChange={setIsEditing}
                  />
                </div>

                <div className="p-[18px] space-y-8">
                  <div className="flex flex-col sm:flex-row gap-[24px] items-center sm:items-start">
                    <ProfileAvatar
                      first_name={profile.first_name || ""}
                      last_name={profile.last_name || ""}
                      img={profile.profile_picture_url}
                      _id={profile.doctor_no || ""}
                      preview={previewImage}
                    />

                    <Input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange}
                    />

                    <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                      {/* Change photo — disabled when not editing */}
                      <Button
                        type="button"
                        className="w-full sm:w-auto min-w-[250px] bg-[#F7F7F7] hover:bg-[#F7F7F7]/80 text-black transition-colors"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={!isEditing}
                      >
                        {pendingFile
                          ? "Photo selected — save to upload"
                          : "Change photo"}
                      </Button>

                      {/* Remove photo — disabled when not editing OR when there's no photo to remove */}
                      <Button
                        type="button"
                        variant="destructive"
                        className="w-full sm:w-auto min-w-[250px] bg-[#FDE7E5] hover:bg-[#FDE7E5]/80 text-[#D92D20] transition-colors"
                        onClick={() => {
                          // If there's a pending file not yet uploaded, just clear the preview locally
                          if (pendingFile) {
                            setPreviewImage(null);
                            setPendingFile(null);
                            return;
                          }
                          // Otherwise call the API to clear the server-side image
                          removePhotoMutation.mutate();
                        }}
                        disabled={
                          !isEditing ||
                          !hasPhoto ||
                          removePhotoMutation.isPending
                        }
                      >
                        {removePhotoMutation.isPending
                          ? "Removing..."
                          : "Remove photo"}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="p-[18px] border-b text-[16px] font-semibold">
                  <span className="">Biodata</span>
                </div>

                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-6"
                  >
                    <div className="p-[18px] flex flex-wrap justify-between gap-[16px]">
                      <FormField
                        control={form.control}
                        name="doctor_no"
                        render={({ field }) => (
                          <FormItem className="flex-1 min-w-full sm:min-w-[300px]">
                            <FormLabel className="text-[14px] font-medium">
                              Doctor ID (Number)
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                className="w-full h-[48px]"
                                placeholder="Doctor No"
                                disabled={true}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="first_name"
                        render={({ field }) => (
                          <FormItem className="flex-1 min-w-full sm:min-w-[300px]">
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
                          <FormItem className="flex-1 min-w-full sm:min-w-[300px]">
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
                          <FormItem className="flex-1 min-w-full sm:min-w-[300px]">
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
                          <FormItem className="flex-1 min-w-full sm:min-w-[300px]">
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

                    <div className="p-[18px] border-b text-[16px] font-semibold">
                      <span className="">Professional Information</span>
                    </div>

                    <div className="p-[18px] flex flex-wrap justify-between gap-[16px]">
                      <div className="flex-1 min-w-[300px] space-y-2">
                        <label className="text-[14px] font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          Specializations
                        </label>
                        <div className="flex flex-wrap gap-2 pt-1">
                          {profile.specializations?.map((spec, index) => (
                            <span
                              key={index}
                              className="px-[14px] py-[6px] bg-primary/10 text-primary text-[12px] font-medium rounded-full"
                            >
                              {spec}
                            </span>
                          ))}
                          {(!profile.specializations ||
                            profile.specializations.length === 0) && (
                            <span className="text-sm text-gray-400">
                              No specializations listed.
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex-1 min-w-[300px] space-y-2">
                        <label className="text-[14px] font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          License Number
                        </label>
                        <Input
                          value={profile.license_no || ""}
                          className="w-full h-[48px]"
                          placeholder="MD-XYZ-12345"
                          disabled={true}
                          readOnly
                        />
                      </div>
                    </div>

                    {isEditing && (
                      <div className="w-full p-[18px] flex flex-col sm:flex-row gap-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleCancel}
                          className="w-full sm:min-w-[140px] sm:w-auto"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          className="w-full sm:min-w-[140px] sm:w-auto"
                          disabled={updateMutation.isPending}
                        >
                          {updateMutation.isPending
                            ? "Saving..."
                            : "Save Changes"}
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
                        {timezoneMutation.isPending
                          ? "Updating..."
                          : "Update Timezone"}
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
                                  type={
                                    showCurrentPassword ? "text" : "password"
                                  }
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
                          <FormItem className="flex-1 min-w-full sm:min-w-[300px]">
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
                                  onClick={() =>
                                    setShowNewPassword(!showNewPassword)
                                  }
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
                          <FormItem className="flex-1 min-w-full sm:min-w-[300px]">
                            <FormLabel className="text-[14px] font-medium">
                              Confirm New Password
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  type={
                                    showConfirmPassword ? "text" : "password"
                                  }
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
            </TabsContent>

            <TabsContent value="availability" className="mt-0">
              <DoctorAvailabilityTab />
            </TabsContent>

            <TabsContent value="blackouts" className="mt-0">
              <DoctorBlackouts />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}
