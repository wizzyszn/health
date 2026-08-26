import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useDispatch } from "react-redux";
import { Link } from "react-router-dom";
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
  loginDoctor,
  getDoctorProfileReq,
} from "@/config/service/doctor.service";
import useNavigateToPage from "@/shared/hooks/use-navigate-to-page";
import { GeneralReturnInt, Doctor, RejectedPayload } from "@/lib/types";
import {
  setRole,
  setToken,
  setUser,
  setRefreshToken,
  setTimezone,
} from "@/config/stores/slices/auth.slice";
import { AppDispatch } from "@/config/stores/store";
import { loginSchema } from "@/auth/doctor/lib/schemas";

type LoginFormValues = z.infer<typeof loginSchema>;

function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);

  const dispatch = useDispatch<AppDispatch>();

  const navigate = useNavigateToPage({ path: "/doctor/dashboard" });

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const { mutate, isPending } = useMutation<
    GeneralReturnInt<Doctor>,
    RejectedPayload,
    { email: string; password: string }
  >({
    mutationFn: (variables) => loginDoctor(variables),
    onSuccess: async (response) => {
      toast.success(response.response_description);
      dispatch(setUser(response.data));
      dispatch(setToken(response.data.token as string));
      dispatch(setRole(response.data.role));
      if (response.data.refresh_token) {
        dispatch(setRefreshToken(response.data.refresh_token));
      }

      try {
        const profileResponse = await getDoctorProfileReq();
        if (profileResponse.data?.timezone) {
          dispatch(setTimezone(profileResponse.data.timezone));
        }
      } catch (e) {
        console.error("Failed to fetch profile timezone on login", e);
      }

      navigate();
    },
    onError: (response) => {
      toast.error(response.message);
      console.error(response.message);
    },
  });

  function onSubmit(data: LoginFormValues) {
    mutate({ email: data.email, password: data.password });
  }

  return (
    <Form {...form}>
      <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
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
                  placeholder="doctor@example.com"
                  {...field}
                  className="h-12 border-0 text-foreground placeholder:text-muted-foreground"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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

        <div className="flex justify-end">
          <Link
            to="/doctor/forgot-password"
            className="text-sm text-primary hover:underline"
          >
            Forgot Password?
          </Link>
        </div>

        <Button
          type="submit"
          disabled={isPending}
          className="w-full h-12 text-base font-semibold mt-2"
        >
          {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Login"}
        </Button>
      </form>
    </Form>
  );
}

export default LoginForm;
