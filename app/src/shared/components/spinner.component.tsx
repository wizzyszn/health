import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  message?: string;
  messageClassName?: string;
};

function Spinner({ className, message, messageClassName }: Props) {
  return (
    <div
      className={cn(
        className,
        "flex h-full flex-col items-center justify-center gap-3",
      )}
    >
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      {message ? (
        <p className={cn("text-sm text-muted-foreground", messageClassName)}>
          {message}
        </p>
      ) : null}
    </div>
  );
}

export default Spinner;
