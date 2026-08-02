import AuthFormLayout from "@/shared/components/layouts/auth.form.layout.component";
import AuthLayout from "@/shared/components/layouts/auth.layout.component";
import ForgotPasswordForm from "../components/forgot-password.component.doctor";

function DoctorForgotPassword() {
  return (
    <AuthLayout
      children={
        <AuthFormLayout
          form={
            <>
              <ForgotPasswordForm />
            </>
          }
        />
      }
    />
  );
}

export default DoctorForgotPassword;
