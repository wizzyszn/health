import { Check } from "lucide-react";
import { motion } from "framer-motion";

const STEPS = [
  "Personal Details",
  "Choose a time slot",
  "Find a Doctor",
  // "Choose Payment",
  "Confirm appointment",
];

interface StepSidebarProps {
  currentStep: number;
}

const StepSidebar = ({ currentStep }: StepSidebarProps) => {
  return (
    <nav aria-label="Booking steps" className="py-5 pr-2">
      <ol className="space-y-0">
        {STEPS.map((step, index) => {
          const isCompleted = index < currentStep;
          const isActive = index === currentStep;

          return (
            <li key={step} className="relative pb-3.5 last:pb-0">
              {index < STEPS.length - 1 && (
                <div
                  className={`absolute left-[22px] top-[22px] h-[calc(100%-10px)] w-px -translate-x-1/2 ${
                    isCompleted ? "bg-muted-foreground/40" : "bg-border"
                  }`}
                />
              )}
              <div className="relative z-10 flex h-9 items-center gap-2.5 rounded-lg px-2.5">
                {isActive && (
                  <motion.div
                    layoutId="active-step-bg"
                    className="absolute inset-0 -z-10 rounded-lg bg-primary/5"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <div
                  className={`flex size-5 shrink-0 items-center justify-center rounded-full ${
                    isCompleted
                      ? "bg-muted-foreground/70 text-primary-foreground"
                      : isActive
                        ? "border-2 border-primary bg-background"
                        : "border border-border bg-background"
                  }`}
                >
                  {isCompleted && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 25,
                      }}
                    >
                      <Check size={10} strokeWidth={3} />
                    </motion.div>
                  )}
                </div>
                <span
                  className={`text-[13px] leading-snug transition-colors duration-200 ${
                    isActive
                      ? "font-medium text-primary"
                      : isCompleted
                        ? "text-muted-foreground"
                        : "text-muted-foreground/70"
                  }`}
                >
                  {step}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default StepSidebar;
