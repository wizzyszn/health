import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface SuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  title?: string;
  description?: string;
  actionLabel?: string;
  onAction: () => void;
}

function SuccessDialog({
  open,
  onOpenChange,
  title = "You're all Set!",
  description,
  actionLabel = "Continue",
  onAction,
}: SuccessDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md text-center">
        <div className="flex flex-col items-center gap-4 py-6">
          {/* Success icon with confetti-like decoration */}
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
              <div className="w-14 h-14 rounded-full bg-green-500 flex items-center justify-center">
                <Check className="w-8 h-8 text-white" strokeWidth={3} />
              </div>
            </div>
            {/* Confetti dots */}
            <div className="absolute -top-2 -right-2 w-3 h-3 rounded-full bg-orange-400" />
            <div className="absolute -top-1 left-0 w-2 h-2 rounded-full bg-primary" />
            <div className="absolute -bottom-1 -left-3 text-primary text-lg">
              〰
            </div>
            <div className="absolute -bottom-2 -right-4 text-green-500 text-lg">
              〰
            </div>
            <div className="absolute top-0 -right-5 text-purple-500 text-sm">
              ✧
            </div>
            <div className="absolute -top-3 left-4 text-green-400 text-sm">
              ✦
            </div>
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-bold text-foreground">{title}</h2>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>

          <Button
            className="w-full h-12 text-base font-semibold"
            onClick={onAction}
          >
            {actionLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default SuccessDialog;
