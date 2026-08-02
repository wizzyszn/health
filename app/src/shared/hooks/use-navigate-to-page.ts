import { useCallback, DependencyList } from "react";
import { useNavigate, To, NavigateOptions } from "react-router-dom";

interface NavigateToPageArgs {
  path: To | number;
  options?: NavigateOptions;
  dependencies?: DependencyList;
}

const useNavigateToPage = ({
  path,
  options,
  dependencies = [],
}: NavigateToPageArgs) => {
  const navigate = useNavigate();

  return useCallback(() => {
    if (typeof path === "number") {
      navigate(path);
    } else {
      navigate(path, options);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...dependencies, path, options, navigate]);
};

export default useNavigateToPage;
