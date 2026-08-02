import { Storages } from "@/lib/helpers";
import { StorageKeysEnum, UserRole } from "@/lib/types";
import { Navigate } from "react-router-dom";

function AppEntry() {
  const getRefreshToken =
    Storages.getStorage("local", StorageKeysEnum.refresh_token) ?? "";

  if (!getRefreshToken) {
    return <Navigate to="/patient/login" />;
  }

  const role = Storages.getStorage("local", StorageKeysEnum.role) as UserRole;
  switch (role) {
    case "admin":
      return <Navigate to="/admin/dashboard" />;

    case "doctor":
      return <Navigate to="/doctor/dashboard" />;
    case "patient":
      return <Navigate to="/patient/dashboard" />;
    default:
      return <Navigate to="/patient/login" />;
  }
}

export default AppEntry;
