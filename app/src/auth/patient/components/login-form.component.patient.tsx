import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useDispatch } from "react-redux";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import { useEffect } from "react";

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
  signInPatienReq,
  getPatientProfileReq,
} from "@/config/service/patient.service";
import useNavigateToPage from "@/shared/hooks/use-navigate-to-page";
import { GeneralReturnInt, Patient, RejectedPayload } from "@/lib/types";
import {
  setRole,
  setToken,
  setUser,
  setRefreshToken,
  setTimezone,
} from "@/config/stores/slices/auth.slice";
import { AppDispatch } from "@/config/stores/store";
import { loginSchema } from "@/auth/patient/lib/schemas";
import { routeBaseUrl } from "@/config/service/config";

// ─── Types ───────────────────────────────────────────────────────────────────

type LoginFormValues = z.infer<typeof loginSchema>;

// ─── Component ───────────────────────────────────────────────────────────────

function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isGoogleRedirecting, setIsGoogleRedirecting] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const dispatch = useDispatch<AppDispatch>();

  const navigateToDashboard = useNavigateToPage({ path: "/patient/dashboard" });
  const navigateToSignUp = useNavigateToPage({ path: "/patient/sign-up" });

  // ── Form ───────────────────────────────────────────────────────────────────

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // ── Mutation ───────────────────────────────────────────────────────────────

  const { mutate, isPending } = useMutation<
    GeneralReturnInt<Patient>,
    RejectedPayload,
    { email: string; password: string }
  >({
    mutationFn: (variables) => signInPatienReq(variables),
    onSuccess: async (response) => {
      toast.success(response.response_description);
      dispatch(setUser(response.data));
      dispatch(setToken(response.data.token as string));
      dispatch(setRole(response.data.role));
      dispatch(setRefreshToken(response.data.refresh_token));
      navigateToDashboard();
      try {
        const profileResponse = await getPatientProfileReq();
        if (profileResponse.data?.timezone) {
          dispatch(setTimezone(profileResponse.data.timezone));
        }
      } catch (e) {
        console.error("Failed to fetch profile timezone on login", e);
      }
    },
    onError: (response) => {
      toast.error(response.message);
      console.error(response.message);
    },
  });

  // ── Submit ─────────────────────────────────────────────────────────────────

  function onSubmit(data: LoginFormValues) {
    mutate({ email: data.email, password: data.password });
  }

  useEffect(() => {
    const authError = searchParams.get("error");
    if (!authError) return;

    toast.error(authError);
    navigate("/patient/login", { replace: true });
  }, [navigate, searchParams]);

  // ── Google auth ────────────────────────────────────────────────────────────

  function handleGoogleAuth() {
    setIsGoogleRedirecting(true);
    window.location.href = `${routeBaseUrl.auth}/google`;
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <Form {...form}>
      <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
        {/* Email */}
        <FormField
          control={form.control}
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

        {/* Password */}
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel className="text-sm font-medium text-foreground">
                Password
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
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Forgot password */}
        <div className="flex justify-end">
          <Link
            to="/patient/forgot-password"
            className="text-sm text-primary hover:underline"
          >
            Forgot Password?
          </Link>
        </div>

        {/* Submit */}
        <Button
          type="submit"
          disabled={isPending || isGoogleRedirecting}
          className="w-full h-12 text-base font-semibold mt-2"
        >
          {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Login"}
        </Button>

        {/* Divider */}
        <div className="relative flex items-center py-2">
          <div className="flex-1 border-t border-border" />
          <span className="px-4 text-sm text-muted-foreground">Or</span>
          <div className="flex-1 border-t border-border" />
        </div>

        {/* Google Sign In */}
        <Button
          type="button"
          variant="outline"
          className="w-full h-12 text-base bg-muted font-medium border-border hover:bg-background"
          disabled={isPending || isGoogleRedirecting}
          onClick={handleGoogleAuth}
        >
          {isGoogleRedirecting ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Redirecting to Google...
            </>
          ) : (
            <>
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Sign in with Google
            </>
          )}
        </Button>

        {/* Sign Up */}
        <div className="flex items-center justify-between pt-4">
          <span className="text-sm text-muted-foreground">
            Don't have an account?
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-border"
            onClick={() => navigateToSignUp()}
          >
            Sign Up
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default LoginForm;
