import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, MoveLeft, Phone, Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";

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
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AuthFormLayout from "@/shared/components/layouts/auth.form.layout.component";
import SuccessDialog from "@/shared/components/dialogs/success.dialog.component";
import useUrlSearchParams from "@/shared/hooks/use-url-search-params";
import { Storages } from "@/lib/helpers";
import { StorageKeysEnum } from "@/lib/types";

import {
  emailSchema,
  otpSchema,
  bioSchema,
  passwordSchema,
} from "@/auth/patient/lib/schemas";
import {
  initiatePatientRegistration,
  verifyOTP,
  resendOTP,
  registration,
} from "@/config/service/patient.service";
import { GeneralReturnInt, RejectedPayload } from "@/lib/types";
import { COUNTRY_CODES } from "@/auth/patient/utils/constants.utils";
import { getPasswordStrength } from "@/auth/patient/utils/helpers.utils";
import type { RegisterStep } from "@/auth/patient/typings/index.typing";

// ─── Component ───────────────────────────────────────────────────────────────

interface RegisterSavedState {
  step?: RegisterStep;
  email?: string;
  registrationToken?: string;
  bioData?: {
    first_name: string;
    last_name: string;
    middle_name?: string;
    country_code: string;
    phone_no: string;
  };
}

function RegisterPatient() {
  const { getParam, updateParam, deleteParam } = useUrlSearchParams();
  const urlStep = getParam("step") as RegisterStep | null;

  const savedState = useMemo(() => {
    return (
      Storages.getStorage<RegisterSavedState>(
        "session",
        StorageKeysEnum.registerState,
      ) || {}
    );
  }, []);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [stepState, setStepState] = useState<RegisterStep>(
    urlStep || savedState.step || "email",
  );

  const [email, setEmail] = useState(savedState.email || "");
  const [registrationToken, setRegistrationToken] = useState(
    savedState.registrationToken || "",
  );

  const step = stepState;
  const setStep = (
    newStep: RegisterStep | null,
    updates?: {
      email?: string;
      registrationToken?: string;
      bioData?: RegisterSavedState["bioData"];
    },
  ) => {
    if (newStep) {
      updateParam("step", newStep);
      const newState: RegisterSavedState = {
        ...savedState,
        step: newStep,
        email: updates?.email ?? email,
        registrationToken: updates?.registrationToken ?? registrationToken,
        ...(updates?.bioData && { bioData: updates.bioData }),
      };
      Storages.setStorage("session", StorageKeysEnum.registerState, newState);
    } else {
      deleteParam("step");
    }
    setStepState(newStep as RegisterStep);
  };
  const [showSuccess, setShowSuccess] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // ── Forms ──────────────────────────────────────────────────────────────────

  const emailForm = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: savedState.email || "" },
  });

  const otpForm = useForm<z.infer<typeof otpSchema>>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: "" },
  });

  const bioForm = useForm<z.infer<typeof bioSchema>>({
    resolver: zodResolver(bioSchema),
    defaultValues: savedState.bioData || {
      first_name: "",
      last_name: "",
      middle_name: "",
      country_code: "+234",
      phone_no: "",
    },
  });

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  // ── Password strength ──────────────────────────────────────────────────────

  const watchedPassword = passwordForm.watch("password");
  const passwordStrength = useMemo(
    () => getPasswordStrength(watchedPassword),
    [watchedPassword],
  );

  // ── Navigation ──────────────────────────────────────────────────────────────

  const navigateSteps = () => {
    if (showSuccess) return;
    if (step === "email") navigate("/");
    else if (step === "otp") setStep("email");
    else if (step === "bio") setStep("otp");
    else if (step === "create-password") setStep("bio");
    else setStep(null);
  };

  // ── Handlers & Mutations ───────────────────────────────────────────────────

  const initiateMutation = useMutation<
    GeneralReturnInt<unknown>,
    RejectedPayload,
    { email: string }
  >({
    mutationFn: initiatePatientRegistration,
    onSuccess: (response, variables) => {
      toast.success(response.response_description || "OTP sent successfully");
      setStep("otp", { email: variables.email });
      setResendCooldown(60);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to initiate registration");
    },
  });

  const verifyOTPMutation = useMutation<
    GeneralReturnInt<unknown>,
    RejectedPayload,
    { email: string; otp: string }
  >({
    mutationFn: verifyOTP,
    onSuccess: (response) => {
      toast.success(
        response.response_description || "OTP verified successfully",
      );
      const resData = response.data as { registration_token?: string } | string;
      let token = registrationToken;
      if (typeof resData === "object" && resData?.registration_token) {
        token = resData.registration_token;
        setRegistrationToken(token);
      } else if (typeof resData === "string") {
        token = resData;
        setRegistrationToken(token);
      }
      setStep("bio", { registrationToken: token });
    },
    onError: (error) => {
      toast.error(error.message || "Invalid OTP");
    },
  });

  const resendOTPMutation = useMutation<
    GeneralReturnInt<unknown>,
    RejectedPayload,
    { email: string }
  >({
    mutationFn: resendOTP,
    onSuccess: (response) => {
      toast.success(response.response_description || "OTP resent successfully");
      setResendCooldown(60);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to resend OTP");
    },
  });

  const completeRegistrationMutation = useMutation<
    GeneralReturnInt<unknown>,
    RejectedPayload,
    {
      registration_token: string;
      first_name: string;
      last_name: string;
      middle_name: string;
      phone_number: string;
      password: string;
    }
  >({
    mutationFn: registration,
    onSuccess: (response) => {
      toast.success(
        response.response_description || "Registration completed successfully",
      );
      setShowSuccess(true);
      Storages.setStorage("session", StorageKeysEnum.registerState, null);
      deleteParam("step");
    },
    onError: (error) => {
      toast.error(error.message || "Registration failed");
    },
  });

  const handleEmailSubmit = (values: z.infer<typeof emailSchema>) => {
    setEmail(values.email);
    initiateMutation.mutate({ email: values.email });
  };

  const handleOtpSubmit = (values: z.infer<typeof otpSchema>) => {
    verifyOTPMutation.mutate({ email, otp: values.otp });
  };

  const handleBioSubmit = () => {
    const bioValues = bioForm.getValues();
    setStep("create-password", { bioData: bioValues });
  };

  const handlePasswordSubmit = (values: z.infer<typeof passwordSchema>) => {
    const bioValues = bioForm.getValues();
    const cleanPhone = bioValues.phone_no.replace(/^0+/, "");
    completeRegistrationMutation.mutate({
      registration_token: registrationToken,
      first_name: bioValues.first_name,
      last_name: bioValues.last_name,
      middle_name: bioValues.middle_name || "",
      phone_number: `${bioValues.country_code}${cleanPhone}`,
      password: values.password,
    });
  };

  // ── Step renderer ──────────────────────────────────────────────────────────

  const renderStepContent = () => {
    switch (step) {
      // ─── Email ───────────────────────────────────────────────────────────
      case "email":
        return (
          <AuthFormLayout
            key="email"
            heading="Let's get you started"
            subHeading="We'll create an account if you don't have one yet."
            form={
              <Form {...emailForm}>
                <form onSubmit={emailForm.handleSubmit(handleEmailSubmit)}>
                  <FormField
                    control={emailForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel className="text-sm font-medium text-foreground">
                          Email Address
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="user@example.com"
                            {...field}
                            className="h-12 border-0 text-foreground placeholder:text-muted-foreground"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full h-12 mt-6"
                    disabled={
                      emailForm.watch("email").length < 1 ||
                      initiateMutation.isPending
                    }
                  >
                    {initiateMutation.isPending ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      "Next"
                    )}
                  </Button>
                </form>
              </Form>
            }
          />
        );

      // ─── OTP ─────────────────────────────────────────────────────────────
      case "otp":
        return (
          <AuthFormLayout
            key="otp"
            heading="We just sent you a code"
            form={
              <div className="space-y-5">
                <p className="text-muted-foreground text-sm leading-relaxed">
                  If an account doesn't already exist with{" "}
                  <a
                    href={`mailto:${email}`}
                    className="text-primary hover:underline font-medium"
                  >
                    {email}
                  </a>
                  , you will receive a six digit confirmation code. Please enter
                  it below to complete your registration.
                </p>
                <Form {...otpForm}>
                  <form
                    onSubmit={otpForm.handleSubmit(handleOtpSubmit)}
                    className="space-y-6"
                  >
                    <FormField
                      control={otpForm.control}
                      name="otp"
                      render={({ field }) => (
                        <FormItem className="py-2">
                          <FormControl>
                            <div className="flex w-full">
                              <InputOTP
                                maxLength={6}
                                {...field}
                                onComplete={() =>
                                  otpForm.handleSubmit(handleOtpSubmit)()
                                }
                                containerClassName="w-full flex"
                                className="w-full"
                              >
                                <InputOTPGroup className="flex-1">
                                  <InputOTPSlot
                                    index={0}
                                    className="flex-1 h-14 text-lg sm:h-20 border border-r-0"
                                  />
                                  <InputOTPSlot
                                    index={1}
                                    className="flex-1 h-14 text-lg sm:h-20 border border-r-0"
                                  />
                                  <InputOTPSlot
                                    index={2}
                                    className="flex-1 h-14 text-lg sm:h-20 border"
                                  />
                                </InputOTPGroup>
                                <InputOTPSeparator />
                                <InputOTPGroup className="flex-1">
                                  <InputOTPSlot
                                    index={3}
                                    className="flex-1 h-14 text-lg sm:h-20 border border-r-0"
                                  />
                                  <InputOTPSlot
                                    index={4}
                                    className="flex-1 h-14 text-lg sm:h-20 border border-r-0"
                                  />
                                  <InputOTPSlot
                                    index={5}
                                    className="flex-1 h-14 text-lg sm:h-20 border"
                                  />
                                </InputOTPGroup>
                              </InputOTP>
                            </div>
                          </FormControl>
                          <FormMessage className="text-center" />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      disabled={verifyOTPMutation.isPending}
                      className="w-full h-12 text-base font-semibold"
                    >
                      {verifyOTPMutation.isPending ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        "Verify Code"
                      )}
                    </Button>
                  </form>
                </Form>
                <div className="text-sm text-muted-foreground text-center">
                  Didn't receive a code?{" "}
                  <button
                    type="button"
                    onClick={() => resendOTPMutation.mutate({ email })}
                    disabled={resendOTPMutation.isPending || resendCooldown > 0}
                    className="text-foreground font-semibold underline hover:no-underline disabled:opacity-50 disabled:no-underline transition-opacity"
                  >
                    {resendOTPMutation.isPending
                      ? "Resending..."
                      : resendCooldown > 0
                        ? `Resend in ${resendCooldown}s`
                        : "Resend It"}
                  </button>
                </div>
              </div>
            }
          />
        );

      // ─── Bio ─────────────────────────────────────────────────────────────
      case "bio":
        return (
          <AuthFormLayout
            key="bio"
            heading="Complete Your Bio"
            subHeading="Securely add your details to help us provide better service"
            form={
              <Form {...bioForm}>
                <form
                  onSubmit={bioForm.handleSubmit(handleBioSubmit)}
                  className="space-y-4 sm:space-y-5"
                >
                  {/* Name row */}
                  <div className="flex flex-col sm:flex-row gap-4 sm:gap-5">
                    <FormField
                      control={bioForm.control}
                      name="first_name"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel className="text-sm font-medium text-foreground">
                            First Name
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="text"
                              placeholder="Enter first name"
                              {...field}
                              className="h-12 border-0 text-foreground"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={bioForm.control}
                      name="last_name"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel className="text-sm font-medium text-foreground">
                            Last Name
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="text"
                              placeholder="Enter last name"
                              {...field}
                              className="h-12 border-0 text-foreground"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Middle Name row */}
                  <FormField
                    control={bioForm.control}
                    name="middle_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-foreground">
                          Middle Name (Optional)
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            placeholder="Enter middle name"
                            {...field}
                            className="h-12 border-0 text-foreground"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Phone number row */}
                  <div className="space-y-2">
                    <FormLabel className="text-sm font-medium text-foreground flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      Phone Number
                    </FormLabel>
                    <div className="flex gap-2">
                      {/* Country code selector */}
                      <FormField
                        control={bioForm.control}
                        name="country_code"
                        render={({ field }) => (
                          <FormItem className="w-[110px] sm:w-[140px] shrink-0">
                            <FormControl>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <SelectTrigger className="h-12 border-0">
                                  <SelectValue placeholder="Code" />
                                </SelectTrigger>
                                <SelectContent>
                                  {COUNTRY_CODES.map((c) => (
                                    <SelectItem key={c.code} value={c.code}>
                                      {c.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Phone number input */}
                      <FormField
                        control={bioForm.control}
                        name="phone_no"
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input
                                type="tel"
                                inputMode="numeric"
                                placeholder="8012345678"
                                {...field}
                                className="h-12 border-0 text-foreground"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <Button
                    className="w-full h-12 text-base font-semibold"
                    type="submit"
                  >
                    Continue
                  </Button>
                </form>
              </Form>
            }
          />
        );

      // ─── Create password ──────────────────────────────────────────────────
      case "create-password":
        return (
          <AuthFormLayout
            key="create-password"
            heading="Create a secure password"
            subHeading="Protect your account with a strong password. You'll use this to log in next time."
            form={
              <Form {...passwordForm}>
                <form
                  className="space-y-5"
                  onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)}
                >
                  <FormField
                    control={passwordForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-foreground">
                          Create password
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showPassword ? "text" : "password"}
                              placeholder="••••••"
                              {...field}
                              className="h-12 border-0 text-foreground pr-12"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            >
                              {showPassword ? (
                                <EyeOff className="w-5 h-5" />
                              ) : (
                                <Eye className="w-5 h-5" />
                              )}
                            </button>
                          </div>
                        </FormControl>
                        {/* Password strength meter */}
                        {watchedPassword.length > 0 && (
                          <div className="space-y-1 pt-1">
                            <div className="flex gap-1">
                              {[1, 2, 3, 4, 5].map((i) => (
                                <div
                                  key={i}
                                  className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                                    i <= passwordStrength.score
                                      ? passwordStrength.color
                                      : "bg-muted"
                                  }`}
                                />
                              ))}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Strength:{" "}
                              <span
                                className={`font-semibold ${
                                  passwordStrength.score <= 1
                                    ? "text-red-500"
                                    : passwordStrength.score <= 2
                                      ? "text-orange-400"
                                      : passwordStrength.score <= 3
                                        ? "text-yellow-500"
                                        : "text-green-600"
                                }`}
                              >
                                {passwordStrength.label}
                              </span>
                            </p>
                          </div>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={passwordForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel className="text-sm font-medium text-foreground">
                          Confirm password
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showConfirmPassword ? "text" : "password"}
                              placeholder="••••••"
                              {...field}
                              className="h-12 border-0 text-foreground pr-12"
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
                  <Button
                    className="w-full h-12 text-base font-semibold"
                    type="submit"
                    disabled={completeRegistrationMutation.isPending}
                  >
                    {completeRegistrationMutation.isPending ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      "Create Account"
                    )}
                  </Button>
                </form>
              </Form>
            }
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="">
      {!showSuccess && (
        <Button
          onClick={navigateSteps}
          className="absolute top-6 right-6 md:top-12 md:right-12 size-10 rounded-full bg-[#F7F7F7] hover:bg-[#E2E2E2] z-10"
          variant="ghost"
          size="icon"
        >
          <MoveLeft size={20} className="text-[#2B2B2B]" />
        </Button>
      )}

      {renderStepContent()}

      <SuccessDialog
        open={showSuccess}
        onOpenChange={setShowSuccess}
        title="You're all Set!"
        description="Your account has been created successfully."
        actionLabel="Proceed to Login"
        onAction={() => navigate("/patient/login")}
      />
    </div>
  );
}

export default RegisterPatient;
