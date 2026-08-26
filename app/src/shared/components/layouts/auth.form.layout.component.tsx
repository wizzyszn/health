import React from "react";

interface AuthFormLayoutProps {
  heading?: string;
  subHeading?: string;
  form: React.ReactNode;
}

function AuthFormLayout({ heading, subHeading, form }: AuthFormLayoutProps) {
  return (
    <div className="w-full">
      <div className="mb-6 md:mb-8 flex flex-col gap-2">
        {heading && (
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-foreground">
            {heading}
          </h1>
        )}
        {subHeading && (
          <p className="text-sm sm:text-base text-muted-foreground font-normal">
            {subHeading}
          </p>
        )}
      </div>

      {<>{form}</>}
    </div>
  );
}

export default AuthFormLayout;
