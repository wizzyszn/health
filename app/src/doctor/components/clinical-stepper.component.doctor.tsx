import { Check, CircleEllipsis } from "lucide-react";
import { cn } from "@/lib/utils";

export type StepStatus = "completed" | "in-progress" | "pending";

export interface Step {
  id: string;
  label: string;
  status: StepStatus;
}

interface ClinicalStepperProps {
  steps: Step[];
  currentEditingId: string | null;
  onStepEdit: (stepId: string) => void;
}

const ClinicalStepper = ({
  steps,
  currentEditingId,
  onStepEdit,
}: ClinicalStepperProps) => {
  return (
    <div className="w-full bg-white border-b border-[#E5E7EB] py-4 px-2 sm:px-6 overflow-x-auto shadow-sm">
      <div className="flex items-start justify-between min-w-[400px] md:min-w-0 md:max-w-4xl mx-auto relative px-4">
        {/* Background line */}
        <div className="absolute top-4 left-[8%] right-[8%] h-[2px] bg-gray-200" />

        {steps.map((step, index) => {
          const isEditing = currentEditingId === step.id;
          const isCompleted = step.status === "completed";
          const isInProgress = step.status === "in-progress";

          return (
            <div
              key={step.id}
              className="relative flex flex-col items-center group cursor-pointer w-20 sm:w-28 z-10"
              onClick={() => onStepEdit(step.id)}
            >
              {/* Circle */}
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center border-2 bg-white transition-all duration-300 mb-2",
                  isCompleted
                    ? "border-[#00825C] text-[#00825C]"
                    : isInProgress
                      ? "border-[#D97706] text-[#D97706] bg-[#FFFBEB]"
                      : "border-gray-300 text-gray-400 group-hover:border-gray-400",
                  isEditing &&
                    "ring-4 ring-[#5164E8]/20 border-[#5164E8] text-[#5164E8] scale-110",
                )}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4 text-[#00825C]" strokeWidth={3} />
                ) : isInProgress && isEditing ? (
                  <CircleEllipsis
                    className="w-4 h-4 text-[#5164E8]"
                    strokeWidth={2.5}
                  />
                ) : isInProgress ? (
                  <CircleEllipsis
                    className="w-4 h-4 text-[#D97706]"
                    strokeWidth={2.5}
                  />
                ) : isEditing ? (
                  <span className="text-xs font-semibold text-[#5164E8]">
                    {index + 1}
                  </span>
                ) : (
                  <span className="text-xs font-semibold">{index + 1}</span>
                )}
              </div>

              {/* Label */}
              <div className="text-center flex flex-col items-center gap-0.5">
                <span
                  className={cn(
                    "text-[10px] sm:text-xs leading-tight block whitespace-normal sm:whitespace-nowrap transition-colors",
                    isEditing
                      ? "text-[#111827] font-semibold"
                      : isCompleted
                        ? "text-[#4B5563] font-medium"
                        : "text-gray-400 font-medium",
                  )}
                >
                  {step.label}
                </span>
                <span
                  className={cn(
                    "text-[9px] uppercase tracking-wider font-bold transition-colors",
                    isEditing
                      ? "text-[#5164E8]"
                      : isCompleted
                        ? "text-[#00825C]"
                        : isInProgress
                          ? "text-[#D97706]"
                          : "hidden",
                  )}
                >
                  {isEditing ? "Editing" : step.status}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ClinicalStepper;
