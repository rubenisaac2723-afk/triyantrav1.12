"use client";

import React, {
  useState,
  useRef,
  useEffect,
  useId,
  useCallback,
  type KeyboardEvent,
} from "react";
import { AnimatedArrow } from "./animated-arrow";

export interface Option {
  value: string;
  label: string;
}

export interface CustomSelectProps {
  id?: string;
  name?: string;
  options: readonly Option[] | Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  ariaDescribedBy?: string;
  className?: string;
}

export function CustomSelect({
  id,
  name,
  options,
  value,
  onChange,
  placeholder = "Select an option",
  label,
  required = false,
  disabled = false,
  error,
  ariaDescribedBy,
  className = "",
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [placement, setPlacement] = useState<"bottom" | "top">("bottom");
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);
  const searchTimeoutRef = useRef<number | null>(null);
  const searchBufferRef = useRef<string>("");

  const autoId = useId();
  const selectId = id || autoId;
  const listboxId = `${selectId}-listbox`;

  const selectedIndex = options.findIndex((opt) => opt.value === value);
  const selectedOption = selectedIndex >= 0 ? options[selectedIndex] : null;

  // Viewport-aware collision calculation
  const updatePlacement = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    if (spaceBelow < 260 && spaceAbove > 260) {
      setPlacement("top");
    } else {
      setPlacement("bottom");
    }
  }, []);

  const openMenu = useCallback(() => {
    if (disabled) return;
    updatePlacement();
    setIsOpen(true);
    setFocusedIndex(selectedIndex >= 0 ? selectedIndex : 0);
  }, [disabled, selectedIndex, updatePlacement]);

  const closeMenu = useCallback(() => {
    setIsOpen(false);
    setFocusedIndex(-1);
    searchBufferRef.current = "";
  }, []);

  const handleSelect = useCallback(
    (optionValue: string) => {
      onChange(optionValue);
      closeMenu();
      triggerRef.current?.focus();
    },
    [onChange, closeMenu],
  );

  // Outside pointer click detection
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        closeMenu();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isOpen, closeMenu]);

  // Keep highlighted item visible on keyboard scroll
  useEffect(() => {
    if (isOpen && focusedIndex >= 0 && listboxRef.current) {
      const item = listboxRef.current.children[focusedIndex] as HTMLElement;
      if (item && typeof item.scrollIntoView === "function") {
        item.scrollIntoView({ block: "nearest" });
      }
    }
  }, [isOpen, focusedIndex]);

  // Keyboard navigation
  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (disabled) return;

    switch (event.key) {
      case "ArrowDown": {
        event.preventDefault();
        if (!isOpen) {
          openMenu();
        } else {
          setFocusedIndex((prev) =>
            prev < options.length - 1 ? prev + 1 : 0,
          );
        }
        break;
      }
      case "ArrowUp": {
        event.preventDefault();
        if (!isOpen) {
          openMenu();
        } else {
          setFocusedIndex((prev) =>
            prev > 0 ? prev - 1 : options.length - 1,
          );
        }
        break;
      }
      case "Home": {
        if (isOpen) {
          event.preventDefault();
          setFocusedIndex(0);
        }
        break;
      }
      case "End": {
        if (isOpen) {
          event.preventDefault();
          setFocusedIndex(options.length - 1);
        }
        break;
      }
      case "Enter": {
        event.preventDefault();
        if (!isOpen) {
          openMenu();
        } else if (focusedIndex >= 0 && focusedIndex < options.length) {
          handleSelect(options[focusedIndex].value);
        }
        break;
      }
      case " ": {
        // Space opens or selects
        event.preventDefault();
        if (!isOpen) {
          openMenu();
        } else if (focusedIndex >= 0 && focusedIndex < options.length) {
          handleSelect(options[focusedIndex].value);
        }
        break;
      }
      case "Escape": {
        if (isOpen) {
          event.preventDefault();
          closeMenu();
          triggerRef.current?.focus();
        }
        break;
      }
      case "Tab": {
        if (isOpen) {
          closeMenu();
        }
        break;
      }
      default: {
        // Basic typeahead support
        if (event.key.length === 1 && !event.ctrlKey && !event.altKey && !event.metaKey) {
          if (!isOpen) openMenu();
          if (searchTimeoutRef.current) {
            window.clearTimeout(searchTimeoutRef.current);
          }
          searchBufferRef.current += event.key.toLowerCase();
          searchTimeoutRef.current = window.setTimeout(() => {
            searchBufferRef.current = "";
          }, 600);

          const matchIdx = options.findIndex((opt) =>
            opt.label.toLowerCase().startsWith(searchBufferRef.current),
          );
          if (matchIdx >= 0) {
            setFocusedIndex(matchIdx);
          }
        }
        break;
      }
    }
  };

  const activeOptionId =
    isOpen && focusedIndex >= 0
      ? `${listboxId}-opt-${focusedIndex}`
      : undefined;

  return (
    <div
      ref={containerRef}
      className={`custom-select-container ${className} ${error ? "has-error" : ""}`}
      onKeyDown={handleKeyDown}
    >
      {/* Hidden input preserves standard FormData and form submission contracts */}
      {name && (
        <input
          type="hidden"
          name={name}
          value={value}
          id={`${selectId}-hidden`}
        />
      )}

      {/* Accessible trigger combobox */}
      <button
        ref={triggerRef}
        type="button"
        id={selectId}
        className="custom-select-trigger"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={isOpen ? listboxId : undefined}
        aria-activedescendant={activeOptionId}
        aria-invalid={!!error}
        aria-describedby={ariaDescribedBy}
        aria-required={required}
        aria-labelledby={`${selectId}-label`}
        aria-label={label}
        disabled={disabled}
        onClick={() => {
          if (isOpen) {
            closeMenu();
          } else {
            openMenu();
          }
        }}
      >
        <span
          className={`custom-select-value ${!selectedOption ? "placeholder" : ""}`}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <span
          className="custom-select-arrow"
          data-open={isOpen}
          aria-hidden="true"
        >
          <AnimatedArrow direction="down" size="xs" isOpen={isOpen} />
        </span>
      </button>

      {/* Floating listbox popup */}
      {isOpen && (
        <ul
          ref={listboxRef}
          id={listboxId}
          className="custom-select-listbox"
          role="listbox"
          tabIndex={-1}
          data-placement={placement}
          aria-labelledby={`${selectId}-label`}
          aria-label={label || placeholder}
        >
          {options.map((option, index) => {
            const isSelected = option.value === value;
            const isFocused = focusedIndex === index;
            const optionId = `${listboxId}-opt-${index}`;

            return (
              <li
                key={option.value}
                id={optionId}
                role="option"
                data-value={option.value}
                className={`custom-select-option ${isSelected ? "selected" : ""} ${isFocused ? "focused" : ""}`}
                aria-selected={isSelected}
                onClick={() => handleSelect(option.value)}
                onPointerEnter={() => setFocusedIndex(index)}
              >
                <span className="custom-select-option-label">
                  {option.label}
                </span>
                {isSelected && (
                  <span className="custom-select-check" aria-hidden="true">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 16 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M3.5 8.5L6.5 11.5L12.5 4.5"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
