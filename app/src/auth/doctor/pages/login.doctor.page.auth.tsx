import AuthLayout from "@/shared/components/layouts/auth.layout.component";
import AuthFormLayout from "@/shared/components/layouts/auth.form.layout.component";
import LoginForm from "../components/login-form.component.doctor";

const DoctorSignIn = () => {
  return (
    <>
      <AuthLayout
        children={
          <AuthFormLayout
            heading="Welcome back, Doctor!"
            form={<LoginForm />}
          />
        }
      />
    </>
  );
};

export default DoctorSignIn;
