import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  setRefreshToken,
  setRole,
  setToken,
  setUser,
} from "@/config/stores/slices/auth.slice";
import type { AppDispatch } from "@/config/stores/store";
import type { Patient, UserRole } from "@/lib/types";
import { getPatientProfileReq } from "@/config/service/patient.service";
import Spinner from "@/shared/components/spinner.component";

function GoogleOauth() {
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  useEffect(() => {
    const processGoogleCallback = async () => {
      const error = searchParams.get("error");
      if (error) {
        navigate(`/patient/login?error=${encodeURIComponent(error)}`, {
          replace: true,
        });
        return;
      }

      const token = searchParams.get("token");
      const refreshToken = searchParams.get("refresh_token");
      const role = searchParams.get("role");

      if (!token || !refreshToken || !role) {
        navigate("/patient/login?error=Missing+auth+response", {
          replace: true,
        });
        return;
      }

      if (role !== "patient") {
        navigate(
          "/patient/login?error=Google+sign-in+is+only+available+for+patients",
          { replace: true },
        );
        return;
      }

      dispatch(setToken(token));
      dispatch(setRefreshToken(refreshToken));
      dispatch(setRole(role as UserRole));

      try {
        const profileResponse = await getPatientProfileReq();
        const profile = profileResponse.data;

        dispatch(
          setUser({
            role: "patient",
            token,
            refresh_token: refreshToken,
            user: {
              _id: profile._id,
              first_name: profile.first_name,
              middle_name: profile.middle_name,
              last_name: profile.last_name,
              email: profile.email,
              phone_number: profile.phone_number,
              provider: "google",
              active: true,
              createdAt: "",
              updatedAt: "",
              refresk_token: refreshToken,
              verified: true,
              terms_accepted: true,
            },
          } as Patient),
        );
      } catch (profileError) {
        console.error(
          "Unable to hydrate patient profile after Google auth",
          profileError,
        );
      }

      navigate("/patient/dashboard", { replace: true });
    };

    processGoogleCallback();
  }, [dispatch, navigate, searchParams]);

  return (
    <div className=" h-svh flex flex-col items-center justify-center">
      <Spinner
        className="h-svh w-full"
        message="Signing you in with Google..."
      />
    </div>
  );
}

export default GoogleOauth;
