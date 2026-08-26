import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, MoveLeft, Loader2 } from "lucide-react";
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
import AuthFormLayout from "@/shared/components/layouts/auth.form.layout.component";
import SuccessDialog from "@/shared/components/dialogs/success.dialog.component";

import {
  emailSchema,
  otpSchema,
  forgotPasswordSchema,
} from "@/auth/doctor/lib/schemas";
import { getPasswordStrength } from "@/auth/patient/utils/helpers.utils";
import type { ForgotPasswordStep } from "@/auth/doctor/typings/index.typing";
import {
  initializeRestPassword,
  verifyOtpForForgotPassowrd,
  resetPassword,
} from "@/config/service/patient.service";
import { GeneralReturnInt, RejectedPayload } from "@/lib/types";

function ForgotPasswordForm() {
  const navigate = useNavigate();
  const [step, setStep] = useState<ForgotPasswordStep>("email");
  const [email, setEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // ── Timer Effect ───────────────────────────────────────────────────────────

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
    defaultValues: { email: "" },
  });

  const otpForm = useForm<z.infer<typeof otpSchema>>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: "" },
  });

  const passwordForm = useForm<z.infer<typeof forgotPasswordSchema>>({
    resolver: zodResolver(forgotPasswordSchema),
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
    if (step === "email") navigate("/doctor/login");
    else if (step === "otp") setStep("email");
    else if (step === "password") setStep("otp");
  };

  // ── Handlers & Mutations ───────────────────────────────────────────────────

  const initiateMutation = useMutation<
    GeneralReturnInt<unknown>,
    RejectedPayload,
    { email: string }
  >({
    mutationFn: initializeRestPassword,
    onSuccess: (response) => {
      toast.success(response.response_description || "OTP sent successfully");
      setStep("otp");
      setResendCooldown(60);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to initiate password reset");
    },
  });

  const verifyOTPMutation = useMutation<
    GeneralReturnInt<unknown>,
    RejectedPayload,
    { email: string; otp: string }
  >({
    mutationFn: verifyOtpForForgotPassowrd,
    onSuccess: (response) => {
      toast.success(
        response.response_description || "OTP verified successfully",
      );
      const resData = response.data as { reset_token?: string } | string;
      if (typeof resData === "object" && resData?.reset_token) {
        setResetToken(resData.reset_token);
      } else if (typeof resData === "string") {
        setResetToken(resData);
      }
      setStep("password");
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
    mutationFn: initializeRestPassword,
    onSuccess: (response) => {
      toast.success(response.response_description || "OTP resent successfully");
      setResendCooldown(60);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to resend OTP");
    },
  });

  const resetPasswordMutation = useMutation<
    GeneralReturnInt<unknown>,
    RejectedPayload,
    { reset_token: string; password: string; confirm_password: string }
  >({
    mutationFn: resetPassword,
    onSuccess: (response) => {
      toast.success(
        response.response_description || "Password reset successfully",
      );
      setShowSuccess(true);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to reset password");
    },
  });

  const handleEmailSubmit = (values: z.infer<typeof emailSchema>) => {
    setEmail(values.email);
    initiateMutation.mutate({ email: values.email });
  };

  const handleOtpSubmit = (values: z.infer<typeof otpSchema>) => {
    verifyOTPMutation.mutate({ email, otp: values.otp });
  };

  const handlePasswordSubmit = (
    values: z.infer<typeof forgotPasswordSchema>,
  ) => {
    resetPasswordMutation.mutate({
      reset_token: resetToken,
      password: values.password,
      confirm_password: values.confirmPassword,
    });
  };

  // ── Step renderer ──────────────────────────────────────────────────────────

  const renderStepContent = () => {
    switch (step) {
      // ─── Email ───────────────────────────────────────────────────────────
      case "email":
        return (
          <AuthFormLayout
            heading="Forgot Password"
            subHeading="Enter your email address and we'll send you a code to reset your password."
            form={
              <Form {...emailForm}>
                <form
                  className="space-y-5"
                  onSubmit={emailForm.handleSubmit(handleEmailSubmit)}
                >
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
                            placeholder="doctor@example.com"
                            {...field}
                            className="h-12 border-0 text-foreground placeholder:text-muted-foreground"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    className="w-full h-12 text-base font-semibold"
                    type="submit"
                    disabled={
                      emailForm.watch("email").length < 1 ||
                      initiateMutation.isPending
                    }
                  >
                    {initiateMutation.isPending ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      "Send Code"
                    )}
                  </Button>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-sm text-muted-foreground">
                      Remembered your password?
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-border"
                      type="button"
                      onClick={() => navigate("/doctor/login")}
                    >
                      Login
                    </Button>
                  </div>
                </form>
              </Form>
            }
          />
        );

      // ─── OTP ─────────────────────────────────────────────────────────────
      case "otp":
        return (
          <AuthFormLayout
            heading="We just sent you a code"
            form={
              <div className="space-y-5">
                <p className="text-muted-foreground text-sm leading-relaxed">
                  If an account exists with{" "}
                  <a
                    href={`mailto:${email}`}
                    className="text-primary hover:underline font-medium"
                  >
                    {email}
                  </a>
                  , you will receive a six digit confirmation code. Please enter
                  it below to reset your password.
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
                                    className="flex-1 h-14 text-lg sm:h-16 border border-r-0"
                                  />
                                  <InputOTPSlot
                                    index={1}
                                    className="flex-1 h-14 text-lg sm:h-16 border border-r-0"
                                  />
                                  <InputOTPSlot
                                    index={2}
                                    className="flex-1 h-14 text-lg sm:h-16 border"
                                  />
                                </InputOTPGroup>
                                <InputOTPSeparator />
                                <InputOTPGroup className="flex-1">
                                  <InputOTPSlot
                                    index={3}
                                    className="flex-1 h-14 text-lg sm:h-16 border border-r-0"
                                  />
                                  <InputOTPSlot
                                    index={4}
                                    className="flex-1 h-14 text-lg sm:h-16 border border-r-0"
                                  />
                                  <InputOTPSlot
                                    index={5}
                                    className="flex-1 h-14 text-lg sm:h-16 border"
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

      // ─── Reset password ───────────────────────────────────────────────────
      case "password":
        return (
          <AuthFormLayout
            heading="Create a new password"
            subHeading="Choose a strong password you haven't used before."
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
                      <FormItem className="space-y-2">
                        <FormLabel className="text-sm font-medium text-foreground">
                          New password
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
                          Confirm new password
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
                    disabled={resetPasswordMutation.isPending}
                  >
                    {resetPasswordMutation.isPending ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      "Reset Password"
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
    <>
      {!showSuccess && (
        <Button
          variant="ghost"
          onClick={navigateSteps}
          className="absolute top-6 right-6 md:top-12 md:right-12 size-10 rounded-full bg-[#F7F7F7] hover:bg-[#E2E2E2] z-10"
          size="icon"
        >
          <MoveLeft size={20} className="text-[#2B2B2B]" />
        </Button>
      )}

      {renderStepContent()}

      <SuccessDialog
        open={showSuccess}
        onOpenChange={setShowSuccess}
        title="Password Reset!"
        description="Your password has been updated. You can now log in with your new password."
        actionLabel="Back to Login"
        onAction={() => navigate("/doctor/login")}
      />
    </>
  );
}

export default ForgotPasswordForm;
