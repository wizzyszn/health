import useNavigateToPage from "@/shared/hooks/use-navigate-to-page";
import { Button } from "../../components/ui/button";
import { CornerUpLeft } from "lucide-react";
import React from "react";
type Props = {
  btnTitle?: React.ReactNode;
  noBtn?: boolean;
  heading?: string;
  subHeading?: string;
  className?: string;
  handleBtnOnclick?: () => void;
  backBtn?: boolean;
  userId?: React.ReactNode;
};

function MainPageHeader({
  className,
  heading,
  subHeading,
  btnTitle,
  noBtn = false,
  handleBtnOnclick,
  backBtn,
  userId = null,
}: Props) {
  const navigate = useNavigateToPage({
    path: -1,
  });
  return (
    <header className={`flex justify-between gap-4 ${className ?? ""}`}>
      {!backBtn ? (
        <>
          <span className="min-w-0">
            <h2 className="text-base font-semibold tracking-tight sm:text-xl">
              {heading}
            </h2>
            {userId ? userId : null}
            {subHeading && (
              <p className="mt-0.5 max-w-2xl text-wrap text-xs leading-relaxed text-muted-foreground">
                {subHeading}
              </p>
            )}
          </span>
          {noBtn && (
            <Button
              onClick={handleBtnOnclick}
              className="bg-[#2563eb] text-white px-6 py-7"
            >
              {btnTitle}
            </Button>
          )}
        </>
      ) : (
        <Button onClick={navigate} className="px-7 py-4">
          <CornerUpLeft />
          back
        </Button>
      )}
    </header>
  );
}

export default MainPageHeader;
