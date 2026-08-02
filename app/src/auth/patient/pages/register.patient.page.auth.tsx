import AuthLayout from "@/shared/components/layouts/auth.layout.component";
import AuthFormLayout from "@/shared/components/layouts/auth.form.layout.component";
import RegisterPatient from "../components/register.component.patient";

export default function PatientSignUp() {
  return (
    <AuthLayout children={<AuthFormLayout form={<RegisterPatient />} />} />
  );
}
