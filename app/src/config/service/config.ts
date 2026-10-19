import axios, { AxiosRequestConfig } from "axios";
import { store } from "@/config/stores/store";
import { ApiError } from "@/lib/api-error";

const getToken = () => store.getState().auth.token ?? "";

const baseUrl =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000/api/v1";

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

/** Subset of the backend error envelope that requestHandler cares about. */
interface ApiErrorBody {
  message?: string;
  response_code?: string;
  response_description?: string;
}

/**
 * Type-guard extraction of the string fields from an unknown error body.
 * Anything that isn't a string is dropped (undefined), never trusted.
 */
function readErrorBody(body: unknown): ApiErrorBody {
  if (typeof body !== "object" || body === null) return {};
  const record = body as Record<string, unknown>;
  return {
    message: typeof record.message === "string" ? record.message : undefined,
    response_code:
      typeof record.response_code === "string"
        ? record.response_code
        : undefined,
    response_description:
      typeof record.response_description === "string"
        ? record.response_description
        : undefined,
  };
}

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
      const body = readErrorBody(error.response.data);
      // Server is the single source of truth for user-facing error copy.
      // Prefer response_description (authored, safe message), then message.
      const serverMessage =
        body.response_description ?? body.message ?? error.message;
      throw new ApiError({
        message: serverMessage,
        httpStatus: error.response.status,
        responseCode: body.response_code,
        description: serverMessage,
      });
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
