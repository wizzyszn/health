import AuthFormLayout from "@/shared/components/layouts/auth.form.layout.component";
import AuthLayout from "@/shared/components/layouts/auth.layout.component";
import ForgotPasswordForm from "../components/forgot-password.component.patient";

function ForgotPassword() {
  return (
    <div>
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
    </div>
  );
}

export default ForgotPassword;
