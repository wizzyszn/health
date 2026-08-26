/**
 * Controlled tag/chip input for string-array medical fields (allergies,
 * conditions, flags). Each chip is exactly one array element — which maps
 * 1:1 onto how the API stores these lists and makes the "commas are never
 * split" rule impossible to violate by accident (spec §semantics).
 *
 * Keyboard: Enter/Tab/comma commits the draft; Backspace on an empty draft
 * pops the last chip; × on a chip removes it. Paste splits on commas and
 * newlines (pasting implies list intent).
 */
import { useState, type KeyboardEvent } from "react";
import { X } from "lucide-react";

export interface TagChipInputProps {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  ariaLabel: string;
  /** Visual density for narrow contexts. Defaults to page form styling. */
  invalid?: boolean;
}

function commitDraft(
  current: string[],
  draft: string,
): { next: string[]; consumed: boolean } {
  const parts = draft
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length === 0) return { next: current, consumed: false };

  const next = [...current];
  for (const part of parts) {
    const duplicate = next.some(
      (existing) => existing.toLowerCase() === part.toLowerCase(),
    );
    if (!duplicate) next.push(part);
  }
  return { next, consumed: true };
}

export function TagChipInput({
  value,
  onChange,
  placeholder,
  disabled = false,
  ariaLabel,
  invalid = false,
}: TagChipInputProps) {
  const [draft, setDraft] = useState("");

  const commit = () => {
    const { next, consumed } = commitDraft(value, draft);
    if (consumed) {
      onChange(next);
      setDraft("");
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault(); // keep form-submit semantics out of chip entry
      commit();
      return;
    }
    if (event.key === ",") {
      event.preventDefault();
      commit();
      return;
    }
    if (event.key === "Backspace" && draft === "" && value.length > 0) {
      event.preventDefault();
      onChange(value.slice(0, -1));
    }
  };

  const removeChip = (index: number) => {
    onChange(value.filter((_, position) => position !== index));
  };

  return (
    <div
      className={`flex min-h-[42px] w-full flex-wrap items-center gap-1.5 rounded-md border bg-transparent px-2.5 py-2 text-sm shadow-xs transition-colors ${
        invalid
          ? "border-destructive"
          : "border-input focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/30"
      } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
      onClick={() => {
        if (!disabled) {
          // Focus the inline input wherever the user clicks the container.
          document.getElementById(inputIdFor(ariaLabel))?.focus();
        }
      }}
    >
      {value.map((chip, index) => (
        <span
          key={`${chip}-${index}`}
          className="inline-flex max-w-full items-center gap-1 rounded-full bg-primary/10 py-0.5 pl-2.5 pr-1 text-xs font-medium text-primary"
        >
          <span className="truncate">{chip}</span>
          {!disabled && (
            <button
              type="button"
              aria-label={`Remove ${chip}`}
              onClick={(event) => {
                event.stopPropagation();
                removeChip(index);
              }}
              className="rounded-full p-0.5 transition-colors hover:bg-primary/20"
            >
              <X className="size-3" />
            </button>
          )}
        </span>
      ))}

      <input
        id={inputIdFor(ariaLabel)}
        value={draft}
        disabled={disabled}
        aria-label={ariaLabel}
        placeholder={value.length === 0 ? placeholder : undefined}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={commit}
        onPaste={(event) => {
          // Pasted lists split deliberately on commas/newlines.
          const text = event.clipboardData.getData("text");
          if (!/[,\\n]/.test(text)) return;
          event.preventDefault();
          const { next } = commitDraft(value, `${draft}${text}`);
          onChange(next);
          setDraft("");
        }}
        className="min-w-[8rem] flex-1 border-0 bg-transparent p-0 text-sm outline-none placeholder:text-muted-foreground/70 disabled:cursor-not-allowed"
      />
    </div>
  );
}

/** Stable DOM id derived from the label so container clicks can refocus. */
function inputIdFor(ariaLabel: string): string {
  return `tag-chip-input-${ariaLabel.replace(/[^a-zA-Z0-9-]/g, "-").toLowerCase()}`;
}
