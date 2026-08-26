import { type FormEvent, useState } from "react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type FeedbackRating = "very-poor" | "poor" | "neutral" | "good" | "excellent";

interface FeedbackModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  doctorName?: string;
}

const FEEDBACK_OPTIONS: Array<{
  value: FeedbackRating;
  label: string;
  emoji: string;
}> = [
  { value: "very-poor", label: "Very Poor", emoji: "😰" },
  { value: "poor", label: "Poor", emoji: "😔" },
  { value: "neutral", label: "Neutral", emoji: "😐" },
  { value: "good", label: "Good", emoji: "😌" },
  { value: "excellent", label: "Excellent", emoji: "🥰" },
];

const DEFAULT_FEEDBACK =
  "Finally, a healthcare app that just works! The interface is super intuitive, and booking an appointment took less than two minutes. It really takes the stress out of managing my health. Highly recommend!";

export default function FeedbackModal({
  open,
  onOpenChange,
  doctorName,
}: FeedbackModalProps) {
  const [selectedRating, setSelectedRating] = useState<FeedbackRating>("good");
  const [feedback, setFeedback] = useState(DEFAULT_FEEDBACK);

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);

    if (!nextOpen) {
      setSelectedRating("good");
      setFeedback(DEFAULT_FEEDBACK);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!feedback.trim()) {
      toast.error("Please enter your feedback before submitting.");
      return;
    }

    toast.success(
      doctorName
        ? `Thanks for sharing feedback about ${doctorName}.`
        : "Feedback submitted successfully.",
    );
    handleOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[500px] gap-0 overflow-hidden rounded-[20px] border border-[#F0F0F0] bg-white p-0 shadow-[0px_24px_56px_16px_rgba(194,196,211,0.16)] [&>button]:right-8 [&>button]:top-6 [&>button]:h-10 [&>button]:w-10 [&>button]:rounded-full [&>button]:bg-[#F7F7F7] [&>button]:p-0 [&>button_svg]:h-5 [&>button_svg]:w-5 [&>button_svg]:text-black">
        <DialogHeader className="space-y-0 border-b border-[#F0F0F0] px-8 py-6 text-left">
          <DialogTitle className="text-base font-semibold text-[#2B2B2B]">
            Feedback
          </DialogTitle>
          <DialogDescription className="sr-only">
            Share your consultation feedback.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="flex flex-col items-center gap-4 px-6 pb-5 pt-10 text-center sm:px-10">
            <div className="space-y-3">
              <h2 className="text-4xl font-semibold tracking-[-0.02em] text-[#2B2B2B] sm:text-[24px]">
                Give us a feedback!
              </h2>
              <p className="mx-auto max-w-[341px] text-sm text-[#6C6C6C]">
                Your input is important for us. We take customer feedback very
                seriously.
              </p>
            </div>

            <div className="flex w-full items-start justify-center gap-2 sm:gap-4">
              {FEEDBACK_OPTIONS.map((option) => {
                const isSelected = selectedRating === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-label={option.label}
                    aria-pressed={isSelected}
                    onClick={() => setSelectedRating(option.value)}
                    className="flex min-w-[60px] flex-col items-center gap-2"
                  >
                    <span
                      className={cn(
                        "flex h-[60px] w-[60px] items-center justify-center rounded-full bg-[#D9D9D9] text-[30px] transition-all duration-200",
                        isSelected &&
                          "h-20 w-20 bg-[radial-gradient(circle,_#FF8C8C_0%,_#FFBEA2_50%,_#FFEFB8_100%)] text-[38px] shadow-[0px_4px_36px_rgba(255,232,149,0.6)]",
                      )}
                    >
                      {option.emoji}
                    </span>
                    <span
                      className={cn(
                        "text-sm font-medium text-[#686868] transition-opacity",
                        isSelected ? "opacity-100" : "opacity-0",
                      )}
                    >
                      {option.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="px-[22px] py-6 sm:px-[50px]">
            <label htmlFor="consultation-feedback" className="sr-only">
              Write your feedback
            </label>
            <Textarea
              id="consultation-feedback"
              value={feedback}
              onChange={(event) => setFeedback(event.target.value)}
              className="min-h-[171px] resize-none rounded-lg border-0 bg-[#F7F7F7] p-4 text-xs leading-[1.35] text-[#2B2B2B] focus-visible:ring-2 focus-visible:ring-[#5164E8]"
            />
          </div>

          <div className="px-[22px] pb-8 sm:px-[50px]">
            <Button
              type="submit"
              className="h-12 w-full rounded-lg bg-[#5164E8] text-sm font-medium text-white hover:bg-[#4657D8]"
            >
              Submit Feedback
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
