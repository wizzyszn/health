import {
  Activity,
  Pill,
  FileText,
  Stethoscope,
  ChevronRight,
} from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ConsultationActionCenterProps {
  medicationCount: number;
  investigationCount: number;
  pendingInvestigationCount: number;
  referralCount: number;
  isLoading?: boolean;

  onOpenMedication: () => void;
  onOpenInvestigation: () => void;
  onOpenReferral: () => void;
}

type ActionStatus = "idle" | "pending" | "complete";

const STATUS_STYLES: Record<
  ActionStatus,
  { container: string; icon: string; iconColor: string; title: string }
> = {
  idle: {
    container: "cursor-not-allowed border-border/60 bg-[#F3F4F6] opacity-60",
    icon: "bg-[#E5E7EB] border border-border/40",
    iconColor: "text-muted-foreground",
    title: "text-muted-foreground",
  },
  pending: {
    container:
      "cursor-pointer bg-amber-50 hover:bg-amber-100/80 border-amber-200",
    icon: "bg-amber-100 border border-amber-200",
    iconColor: "text-amber-600",
    title: "text-foreground",
  },
  complete: {
    container:
      "cursor-pointer bg-green-50 hover:bg-green-100/80 border-green-200",
    icon: "bg-green-100 border border-green-200",
    iconColor: "text-green-600",
    title: "text-foreground",
  },
};

type ActionItemProps = {
  status: ActionStatus;
  onClick: () => void;
  icon: ReactNode;
  title: string;
  description: string;
};

function ActionItem({
  status,
  onClick,
  icon,
  title,
  description,
}: ActionItemProps) {
  const styles = STATUS_STYLES[status];
  const isInteractive = status !== "idle";

  return (
    <button
      type="button"
      onClick={isInteractive ? onClick : undefined}
      disabled={!isInteractive}
      aria-disabled={!isInteractive}
      className={cn(
        "w-full text-left flex items-start gap-3 p-3 rounded-lg border transition-colors",
        styles.container,
      )}
    >
      <div className={cn("p-2 rounded-full shrink-0", styles.icon)}>{icon}</div>
      <div className="flex-1 min-w-0">
        <h4 className={cn("text-sm font-medium", styles.title)}>{title}</h4>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      {isInteractive && (
        <ChevronRight className="w-4 h-4 text-muted-foreground self-center shrink-0" />
      )}
    </button>
  );
}

export function ConsultationActionCenter({
  medicationCount,
  investigationCount,
  pendingInvestigationCount,
  referralCount,
  isLoading = false,
  onOpenMedication,
  onOpenInvestigation,
  onOpenReferral,
}: ConsultationActionCenterProps) {
  const hasMedications = medicationCount > 0;
  const hasInvestigations = investigationCount > 0;
  const hasReferrals = referralCount > 0;
  const hasAnyActions = hasMedications || hasInvestigations || hasReferrals;

  const medicationStatus: ActionStatus = hasMedications ? "complete" : "idle";
  const investigationStatus: ActionStatus = !hasInvestigations
    ? "idle"
    : pendingInvestigationCount > 0
      ? "pending"
      : "complete";
  const referralStatus: ActionStatus = hasReferrals ? "complete" : "idle";

  return (
    <div
      className={cn(
        "bg-card rounded-xl border p-4 md:p-5 lg:sticky top-6 transition-opacity",
        !isLoading && !hasAnyActions
          ? "border-border/60 bg-[#F9FAFB] opacity-70"
          : "border-border",
      )}
    >
      <h3
        className={cn(
          "text-sm font-semibold flex items-center gap-2 mb-4 md:mb-5",
          !isLoading && !hasAnyActions
            ? "text-muted-foreground"
            : "text-foreground",
        )}
      >
        <Activity
          className={cn(
            "w-4 h-4",
            !isLoading && !hasAnyActions
              ? "text-muted-foreground"
              : "text-primary",
          )}
        />
        Action Center
      </h3>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-[72px] rounded-lg bg-[#F3F4F6] animate-pulse"
            />
          ))}
        </div>
      ) : (
        <>
          {!hasAnyActions && (
            <p className="text-xs text-muted-foreground mb-4">
              No actions available yet. Your doctor has not assigned
              medications, investigations, or referrals for this consultation.
            </p>
          )}

          <div className="space-y-4">
            <ActionItem
              status={medicationStatus}
              onClick={onOpenMedication}
              icon={
                <Pill
                  className={cn(
                    "w-4 h-4",
                    STATUS_STYLES[medicationStatus].iconColor,
                  )}
                />
              }
              title="Review medications"
              description={
                hasMedications
                  ? `${medicationCount} prescription${medicationCount > 1 ? "s" : ""} available`
                  : "No prescription from your doctor yet"
              }
            />

            <ActionItem
              status={investigationStatus}
              onClick={onOpenInvestigation}
              icon={
                <FileText
                  className={cn(
                    "w-4 h-4",
                    STATUS_STYLES[investigationStatus].iconColor,
                  )}
                />
              }
              title="Upload Lab Results"
              description={
                !hasInvestigations
                  ? "No investigation request from your doctor yet"
                  : pendingInvestigationCount > 0
                    ? `${pendingInvestigationCount} investigation result${pendingInvestigationCount > 1 ? "s are" : " is"} pending upload`
                    : "All investigation results uploaded"
              }
            />

            <ActionItem
              status={referralStatus}
              onClick={onOpenReferral}
              icon={
                <Stethoscope
                  className={cn(
                    "w-4 h-4",
                    STATUS_STYLES[referralStatus].iconColor,
                  )}
                />
              }
              title="View my referral"
              description={
                hasReferrals
                  ? `${referralCount} referral${referralCount > 1 ? "s" : ""} linked to this consultation`
                  : "No referral from your doctor yet"
              }
            />
          </div>
        </>
      )}
    </div>
  );
}
