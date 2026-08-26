import AuthLayout from "@/shared/components/layouts/auth.layout.component";
import AuthFormLayout from "@/shared/components/layouts/auth.form.layout.component";
import LoginForm from "../components/login-form.component.patient";

const PatientSignIn = () => {
  return (
    <>
      <AuthLayout
        children={
          <>
            <AuthFormLayout heading="Welcome back!" form={<LoginForm />} />
          </>
        }
      />
    </>
  );
};

export default PatientSignIn;
