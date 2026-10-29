"use client";

import { forwardRef, type InputHTMLAttributes } from "react";
import { useI18n } from "@/components/settings/useI18n";
import { Icon } from "@/components/ui/Icon";
import { cx } from "@/lib/format";

interface SearchFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "value" | "size"> {
  value: string;
  onValueChange: (value: string) => void;
  onClear?: () => void;
  size?: "lg" | "md";
  label: string;
  busy?: boolean;
}

/** Search input with leading icon and a clear button. Used by home and both libraries. */
export const SearchField = forwardRef<HTMLInputElement, SearchFieldProps>(function SearchField(
  { value, onValueChange, onClear, size = "md", label, busy = false, className, ...rest },
  ref,
) {
  const { t } = useI18n();
  return (
    <div className={cx("group/search relative", className)}>
      <label className="sr-only" htmlFor={rest.id}>
        {label}
      </label>
      <Icon
        name="search"
        size={size === "lg" ? 22 : 19}
        className={cx(
          "pointer-events-none absolute top-1/2 -translate-y-1/2 text-subtle transition-[color,transform] duration-300 ease-spring group-focus-within/search:scale-110 group-focus-within/search:text-accent",
          size === "lg" ? "left-5" : "left-4",
        )}
      />
      <input
        ref={ref}
        type="search"
        autoComplete="off"
        spellCheck={false}
        enterKeyHint="search"
        maxLength={120}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        aria-busy={busy || undefined}
        className={cx(
          "w-full rounded-full border border-line-strong bg-surface text-fg placeholder:text-subtle",
          "ae-search-input transition-[border-color,box-shadow,background-color] duration-300 ease-soft outline-none",
          "hover:border-accent/40 focus:border-accent focus:bg-surface-2 focus:shadow-[0_0_0_3px_var(--ae-accent-soft)]",
          size === "lg" ? "h-[3.75rem] pr-14 pl-14 text-[17px]" : "h-12 pr-12 pl-11 text-[15px]",
        )}
        {...rest}
      />
      {value && (
        <button
          type="button"
          onClick={() => {
            onValueChange("");
            onClear?.();
          }}
          className={cx(
            "ae-pop-in absolute top-1/2 grid -translate-y-1/2 place-items-center rounded-full text-muted transition-[background-color,color,transform] duration-200 hover:rotate-90 hover:bg-surface-3 hover:text-fg",
            size === "lg" ? "right-3 size-10" : "right-2 size-8",
          )}
        >
          <Icon name="close" size={size === "lg" ? 18 : 16} />
          <span className="sr-only">{t("search.clear")}</span>
        </button>
      )}
    </div>
  );
});
