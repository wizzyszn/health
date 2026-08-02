import axios, { AxiosRequestConfig } from "axios";
import { store } from "@/config/stores/store";

const getToken = () => store.getState().auth.token ?? "";

const baseUrl =
  import.meta.env.VITE_API_BASE_URL ??
  "https://health-app-backend-aiv0.onrender.com/api/v1";

const routeBaseUrl = {
  auth: `${baseUrl}/auth`,
  patients: `${baseUrl}/patients`,
  doctors: `${baseUrl}/doctors`,
  booking: `${baseUrl}/booking`,
  admin: `${baseUrl}/admin`,
};

const api = axios.create({ baseURL: baseUrl });

const BINARY_CONTENT_TYPES = [
  "text/csv; charset=UTF-8",
  "text/csv; charset=utf-8",
  "text/csv; charset=ISO-8859-1",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/png",
];

const options = <T>(
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  data?: T,
  token?: boolean,
  formData?: FormData,
): AxiosRequestConfig => {
  const headers: Record<string, string> = formData
    ? {}
    : { "Content-Type": "application/json" };

  if (token) headers.Authorization = `Bearer ${getToken()}`;

  switch (method) {
    case "GET":
      return { method, headers };
    case "POST":
      if (!data && !formData)
        throw new Error("Data must be provided for POST requests");
      return { method, headers, data: formData ?? data };
    case "PUT":
      if (!data && !formData)
        throw new Error("Data must be provided for PUT requests");
      return { method, headers, data: formData ?? data };
    case "PATCH":
      if (!data && !formData)
        throw new Error("Data must be provided for PATCH requests");
      return { method, headers, data: formData ?? data };
    case "DELETE":
      return { method, headers, data };
    default:
      throw new Error("Unsupported method");
  }
};

const requestHandler = async <T>(
  url: string,
  config: AxiosRequestConfig = {},
): Promise<T> => {
  try {
    const response = await api({ url, ...config, responseType: "json" });

    const contentType = response.headers["content-type"] as string;

    if (BINARY_CONTENT_TYPES.some((type) => contentType?.includes(type))) {
      const blobResponse = await api({
        url,
        ...config,
        responseType: "blob",
      });
      return blobResponse.data as T;
    }

    return response.data as T;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(
        `${error.response.data?.message ?? error.message}, status: ${error.response.status}`,
      );
    }
    throw error;
  }
};

const urlGenerator = (
  key: keyof typeof routeBaseUrl,
  path: string,
  isToken = true,
  param: string = "",
) => {
  let modParam = isToken ? `?token=${getToken()}` : "?";
  modParam = modParam + param;
  return `${routeBaseUrl[key]}/${path}${modParam.length === 1 ? "" : modParam}`;
};

export { urlGenerator, options, requestHandler, routeBaseUrl };
