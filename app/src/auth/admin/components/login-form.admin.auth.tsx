"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useDispatch } from "react-redux";
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
import {
  adminLoginSchema,
  type AdminLoginFormValues,
} from "@/lib/validation-schemas";
import { signInAdminWithCredReq } from "@/config/service/auth.service";
import {
  GeneralReturnInt,
  RejectedPayload,
  AdminLoginResponse,
  UserRole,
} from "@/lib/types";
import useNavigateToPage from "@/shared/hooks/use-navigate-to-page";
import { AppDispatch } from "@/config/stores/store";
import {
  setUser,
  setToken,
  setRefreshToken,
  setRole,
} from "@/config/stores/slices/auth.slice";

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigateToPage({ path: "/admin/dashboard" });
  const dispatch = useDispatch<AppDispatch>();

  const form = useForm<AdminLoginFormValues>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: { email: "", password: "" },
  });

  const { mutate, isPending } = useMutation<
    GeneralReturnInt<AdminLoginResponse>,
    RejectedPayload,
    { email: string; password: string }
  >({
    mutationFn: (variables) => signInAdminWithCredReq(variables),
    onSuccess: (response) => {
      toast.success(response.response_description);

      const d = response.data;
      // Handle all common token naming variations
      const accessToken = d.token || d.access_token || d.accessToken;
      const refreshToken = d.refresh_token || d.refreshToken;
      const role = d.role || d.admin?.role;
      const admin = d.admin || d;

      if (accessToken) dispatch(setToken(accessToken));
      if (refreshToken) dispatch(setRefreshToken(refreshToken));

      if (role) {
        const normalizedRole = role.toLowerCase();
        const mappedRole = normalizedRole.includes("admin")
          ? "admin"
          : normalizedRole;
        dispatch(setRole(mappedRole as UserRole));
      }

      if (admin) {
        dispatch(setUser(admin));
      }

      navigate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  function onSubmit(data: AdminLoginFormValues) {
    mutate(data);
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
                  placeholder="admin@example.com"
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
