import { useSearchParams } from "react-router-dom";
import type { URLSearchParamsInit } from "react-router-dom";
import type { NavigateOptions } from "react-router-dom";

const useUrlSearchParams = (params?: URLSearchParamsInit) => {
  const [searchParams, setSearchParams] = useSearchParams(params);

  const setParams = (param: URLSearchParamsInit, options?: NavigateOptions) => {
    if (!param || param === "") return;
    setSearchParams(param, options);
  };

  const updateParam = (
    key: string,
    value: string,
    options?: NavigateOptions,
  ) => {
    if (!key || key === "") return;
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set(key, value);
    setSearchParams(nextParams, options);
  };

  const updateParams = (
    paramsMap: Record<string, string>,
    options?: NavigateOptions,
  ) => {
    const entries = Object.entries(paramsMap);
    if (entries.length === 0) return;

    const nextParams = new URLSearchParams(searchParams);
    entries.forEach(([key, value]) => {
      if (!key || key === "") return;
      nextParams.set(key, value);
    });

    setSearchParams(nextParams, options);
  };

  const deleteParam = (key: string, options?: NavigateOptions) => {
    if (!key || key === "" || !searchParams.has(key)) return;
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete(key);
    setSearchParams(nextParams, options);
  };

  const deleteParams = (keys: string[], options?: NavigateOptions) => {
    if (!keys?.length) return;

    const nextParams = new URLSearchParams(searchParams);
    let changed = false;

    keys.forEach((key) => {
      if (!key || key === "") return;
      if (nextParams.has(key)) {
        nextParams.delete(key);
        changed = true;
      }
    });

    if (changed) setSearchParams(nextParams, options);
  };

  const checkParam = (key: string): boolean => {
    return searchParams.has(key);
  };

  const getParam = (key: string): string | null => {
    if (!key || key === "") return null;
    return searchParams.get(key);
  };

  const getAllParams = (): Record<string, string> => {
    return Object.fromEntries(searchParams.entries());
  };

  const clearParams = () => {
    setSearchParams({});
  };

  return {
    searchParams,
    setSearchParams,
    setParams,
    updateParam,
    updateParams,
    deleteParam,
    deleteParams,
    checkParam,
    getParam,
    getAllParams,
    clearParams,
  };
};

export default useUrlSearchParams;
