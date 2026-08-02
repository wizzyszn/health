"use client";

import AuthLayout from "@/shared/components/layouts/auth.layout.component";
import AuthFormLayout from "@/shared/components/layouts/auth.form.layout.component";
import LoginForm from "./components/login-form.admin.auth.tsx";

export default function AdminSignIn() {
  return (
    <AuthLayout>
      <AuthFormLayout
        heading="Welcome back, Admin!"
        subHeading="Sign in to your admin account"
        form={<LoginForm />}
      />
    </AuthLayout>
  );
}
