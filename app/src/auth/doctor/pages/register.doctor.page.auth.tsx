import AuthLayout from "@/shared/components/layouts/auth.layout.component";
import AuthFormLayout from "@/shared/components/layouts/auth.form.layout.component";
import RegisterDoctor from "../components/register.component.doctor";

export default function DoctorSignUp() {
  return <AuthLayout children={<AuthFormLayout form={<RegisterDoctor />} />} />;
}
