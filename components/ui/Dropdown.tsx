"use client";

import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { Icon, type IconName } from "@/components/ui/Icon";
import { cx } from "@/lib/format";

export interface DropdownOption<T extends string> {
  value: T;
  label: string;
  hint?: string;
  /** Number of matching items, shown on the right. */
  count?: number;
}

type Props<T extends string> = {
  label: string;
  icon?: IconName;
  options: DropdownOption<T>[];
  align?: "left" | "right";
  /** Always show the selected option's label (e.g. sort order) instead of the field label. */
  showValue?: boolean;
  /** Show a filter box above long lists (e.g. creators). */
  searchable?: { placeholder: string; empty: string };
} & (
  | { multiple?: false; value: T; onChange: (value: T) => void; defaultValue: T }
  | { multiple: true; value: T[]; onChange: (value: T[]) => void }
);

/**
 * Accessible listbox dropdown (single or multi-select).
 * Keyboard: Enter/Space/ArrowDown opens; arrows move; Enter/Space selects;
 * Home/End jump; Escape or Tab closes and focus returns to the button.
 */
export function Dropdown<T extends string>(props: Props<T>) {
  const { label, icon, options: allOptions, align = "left", showValue = false, searchable } = props;
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [filter, setFilter] = useState("");
  // Flip the panel to the other side when it would run off the screen (small viewports).
  const [flip, setFlip] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const needle = filter.trim().toLocaleLowerCase();
  const options = needle ? allOptions.filter((o) => o.label.toLocaleLowerCase().includes(needle)) : allOptions;

  const selected = (value: T) => (props.multiple ? props.value.includes(value) : props.value === value);

  const isActiveFilter = !showValue && (props.multiple ? props.value.length > 0 : props.value !== props.defaultValue);
  const summary = props.multiple
    ? props.value.length === 0
      ? label
      : props.value.length === 1
        ? (allOptions.find((o) => o.value === props.value[0])?.label ?? label)
        : `${label} (${props.value.length})`
    : props.value === props.defaultValue && !showValue
      ? label
      : (allOptions.find((o) => o.value === props.value)?.label ?? label);

  const close = useCallback((focusButton = true) => {
    setOpen(false);
    if (focusButton) buttonRef.current?.focus();
  }, []);

  const choose = (value: T) => {
    if (props.multiple) {
      const next = props.value.includes(value) ? props.value.filter((v) => v !== value) : [...props.value, value];
      props.onChange(next);
    } else {
      props.onChange(value);
      close();
    }
  };

  const openList = () => {
    setFilter("");
    setFlip(false);
    const firstSelected = allOptions.findIndex((o) => selected(o.value));
    setActive(firstSelected >= 0 ? firstSelected : 0);
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const rect = panelRef.current?.getBoundingClientRect();
    if (rect && (rect.right > window.innerWidth - 8 || rect.left < 8)) setFlip(true);
    (searchable ? inputRef.current : listRef.current)?.focus();
    const onPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [open, searchable]);

  useEffect(() => {
    if (!open) return;
    listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  const onListKey = (event: KeyboardEvent) => {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setActive((i) => Math.min(options.length - 1, i + 1));
        break;
      case "ArrowUp":
        event.preventDefault();
        setActive((i) => Math.max(0, i - 1));
        break;
      case "Home":
        event.preventDefault();
        setActive(0);
        break;
      case "End":
        event.preventDefault();
        setActive(options.length - 1);
        break;
      case "Enter":
      case " ": {
        if (event.key === " " && event.target === inputRef.current) break;
        event.preventDefault();
        const option = options[active];
        if (option) choose(option.value);
        break;
      }
      case "Escape":
        event.preventDefault();
        close();
        break;
      case "Tab":
        setOpen(false);
        break;
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="listbox"
        aria-label={showValue ? `${label}: ${allOptions.find((o) => !props.multiple && o.value === props.value)?.label ?? ""}` : undefined}
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={(event: KeyboardEvent) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            openList();
          }
        }}
        className={cx(
          "inline-flex h-9 items-center gap-2 rounded-full border px-3.5 text-sm whitespace-nowrap transition-colors duration-150",
          isActiveFilter
            ? "border-accent/60 bg-accent-soft text-fg"
            : "border-line text-muted hover:border-line-strong hover:text-fg",
          open && "border-line-strong text-fg",
        )}
      >
        {icon && <Icon name={icon} size={16} />}
        <span>{summary}</span>
        <Icon name="chevronDown" size={15} className={cx("transition-transform duration-200", open && "rotate-180")} />
      </button>
      {open && (
        <div
          ref={panelRef}
          className={cx(
            "ae-dropdown absolute top-[calc(100%+6px)] z-40 flex max-h-[min(22rem,70vh)] w-max max-w-[min(20rem,calc(100vw-2rem))] min-w-56 flex-col overflow-hidden rounded-control border border-line-strong bg-surface-2 shadow-panel",
            (align === "right") !== flip ? "right-0" : "left-0",
          )}
        >
          {searchable && (
            <div className="border-b border-line p-1.5">
              <input
                ref={inputRef}
                type="search"
                value={filter}
                onChange={(e) => {
                  setFilter(e.target.value);
                  setActive(0);
                }}
                onKeyDown={onListKey}
                placeholder={searchable.placeholder}
                aria-label={searchable.placeholder}
                aria-controls={listId}
                aria-activedescendant={options.length ? `${listId}-${active}` : undefined}
                className="h-9 w-full rounded-[0.6rem] border border-line bg-surface px-3 text-sm text-fg outline-none placeholder:text-subtle focus:border-accent"
              />
            </div>
          )}
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          tabIndex={-1}
          aria-label={label}
          aria-multiselectable={props.multiple || undefined}
          aria-activedescendant={options.length ? `${listId}-${active}` : undefined}
          onKeyDown={onListKey}
          className="min-h-0 flex-1 overflow-auto p-1.5 outline-none"
        >
          {options.length === 0 && searchable && <li className="px-3 py-2 text-sm text-subtle">{searchable.empty}</li>}
          {options.map((option, index) => {
            const isSelected = selected(option.value);
            return (
              <li
                key={option.value}
                id={`${listId}-${index}`}
                data-index={index}
                role="option"
                aria-selected={isSelected}
                onClick={() => choose(option.value)}
                onPointerMove={() => setActive(index)}
                className={cx(
                  "flex cursor-pointer items-center gap-3 rounded-[0.6rem] px-3 py-2 text-sm",
                  index === active ? "bg-surface-3 text-fg" : "text-muted",
                )}
              >
                <span
                  aria-hidden="true"
                  className={cx(
                    "grid size-4 shrink-0 place-items-center",
                    props.multiple && "rounded-[5px] border",
                    props.multiple && (isSelected ? "border-accent bg-accent text-accent-ink" : "border-line-strong"),
                    !props.multiple && "text-accent",
                  )}
                >
                  {isSelected && <Icon name="check" size={props.multiple ? 12 : 16} strokeWidth={props.multiple ? 3 : 2} />}
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className={cx("truncate", isSelected && "text-fg")}>{option.label}</span>
                  {option.hint && <span className="text-xs text-subtle">{option.hint}</span>}
                </span>
                {option.count !== undefined && <span className="ml-3 shrink-0 text-xs text-subtle tabular">{option.count}</span>}
              </li>
            );
          })}
        </ul>
        </div>
      )}
    </div>
  );
}
