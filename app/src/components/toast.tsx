import { Toaster as SonnerToaster } from "sonner";

export function ToastProvider() {
  return (
    <SonnerToaster
      position="top-center"
      toastOptions={{
        classNames: {
          toast: "bg-white text-[#333] border border-[#e2e8f0]",
          success: "!bg-[#7CFC00] border-l-4 border-l-[#3784a6] ",
          error: "!bg-[#FF0000] border-l-4 border-l-[#e11d48] !text-white",
          info: "!bg-[#FEBE10] border-l-4 border-l-[#0ea5e9]",
          warning: "!bg-[#FEBE10] border-l-4 border-l-[#f59e0b]",
        },
        duration: 4000,
        className: "rounded-md shadow-lg",
      }}
    />
  );
}
