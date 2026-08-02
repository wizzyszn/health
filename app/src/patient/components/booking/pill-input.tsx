import { useState, useRef, useEffect, useCallback } from "react";
import { X } from "lucide-react";

// ─── PillInput Component ────────────────────────────────────────────────────
interface PillInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  suggestions: string[];
  placeholder?: string;
}

const PillInput = ({
  value = [],
  onChange,
  suggestions,
  placeholder = "Type to search or add...",
}: PillInputProps) => {
  const [inputValue, setInputValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = suggestions.filter(
    (s) =>
      s.toLowerCase().includes(inputValue.toLowerCase()) && !value.includes(s),
  );

  const addItem = useCallback(
    (item: string) => {
      const trimmed = item.trim();
      if (!trimmed) return;
      if (value.includes(trimmed)) return;
      onChange([...value, trimmed]);
      setInputValue("");
      setIsOpen(false);
      setHighlightedIndex(-1);
    },
    [value, onChange],
  );

  const removeItem = useCallback(
    (item: string) => {
      onChange(value.filter((v) => v !== item));
    },
    [value, onChange],
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < filtered.length) {
        addItem(filtered[highlightedIndex]);
      } else if (inputValue.trim()) {
        addItem(inputValue);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < filtered.length - 1 ? prev + 1 : 0,
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : filtered.length - 1,
      );
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setHighlightedIndex(-1);
    } else if (e.key === "Backspace" && inputValue === "" && value.length > 0) {
      removeItem(value[value.length - 1]);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Pills + Input area */}
      <div
        className="flex flex-wrap items-center gap-1.5 min-h-[40px] px-3 py-2 rounded-md border border-border bg-background transition-colors focus-within:ring-2 focus-within:ring-primary/50 focus-within:border-primary hover:border-border/80 cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((item) => (
          <span
            key={item}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20 animate-in fade-in-0 zoom-in-95 duration-200"
          >
            {item}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeItem(item);
              }}
              className="inline-flex items-center justify-center rounded-full size-4 hover:bg-primary/20 transition-colors"
              aria-label={`Remove ${item}`}
            >
              <X size={10} />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setIsOpen(true);
            setHighlightedIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={value.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[120px] text-sm bg-transparent outline-none placeholder:text-muted-foreground"
        />
      </div>

      {/* Suggestion dropdown */}
      {isOpen && inputValue && filtered.length > 0 && (
        <div className="absolute z-50 mt-1 w-full max-h-[200px] overflow-y-auto rounded-md border border-border bg-popover shadow-md animate-in fade-in-0 slide-in-from-top-2 duration-150">
          {filtered.map((suggestion, index) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => addItem(suggestion)}
              onMouseEnter={() => setHighlightedIndex(index)}
              className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                index === highlightedIndex
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-accent/50 text-foreground"
              }`}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {/* Hint text */}
      {inputValue && filtered.length === 0 && isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-md p-3">
          <p className="text-xs text-muted-foreground">
            Press{" "}
            <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono">
              Enter
            </kbd>{" "}
            to add "
            <span className="font-medium text-foreground">{inputValue}</span>"
          </p>
        </div>
      )}
    </div>
  );
};

export default PillInput;
