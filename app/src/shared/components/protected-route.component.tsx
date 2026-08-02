import { Storages } from "@/lib/helpers";
import { StorageKeysEnum, UserRole } from "@/lib/types";
import { RootState } from "@/config/stores/store";
import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Navigate } from "react-router-dom";
import { refreshTokenReq } from "@/config/service/auth.service";
import {
  setToken,
  setRefreshToken,
  logout,
} from "@/config/stores/slices/auth.slice";
import Spinner from "@/shared/components/spinner.component";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const dispatch = useDispatch();
  const { token, role } = useSelector((state: RootState) => state.auth);

  const getRole = Storages.getStorage("local", StorageKeysEnum.role) as string;
  const getRefreshToken = Storages.getStorage(
    "local",
    StorageKeysEnum.refresh_token,
  ) as string;

  const currentToken = token;
  const currentRole = role || getRole;

  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!currentToken && getRefreshToken && currentRole) {
      setIsRefreshing(true);
      refreshTokenReq({
        refreshToken: getRefreshToken,
        role: currentRole as UserRole,
      })
        .then((res) => {
          if (res?.data) {
            dispatch(setToken(res.data.accessToken));
            if (res.data.refreshToken) {
              dispatch(setRefreshToken(res.data.refreshToken));
            }
          }
        })
        .catch(() => {
          dispatch(logout());
        })
        .finally(() => {
          setIsRefreshing(false);
        });
    }
  }, [currentToken, getRefreshToken, currentRole, dispatch]);

  if (isRefreshing) {
    return <Spinner className="h-svh w-full" />;
  }

  if (!currentToken && !getRefreshToken) {
    let loginRoute = "/patient/login";

    if (currentRole === "admin") {
      loginRoute = "/admin/login";
    } else if (currentRole === "doctor") {
      loginRoute = "/doctor/login";
    } else if (currentRole === "patient") {
      loginRoute = "/patient/login";
    }

    return <Navigate to={loginRoute} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
