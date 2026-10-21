"use client";


/**
 * Checks whether an element is an interactive editable form control or contenteditable node.
 * Editable elements MUST retain standard clipboard actions, selection, and context menus.
 */
export function isEditableElement(element: Element | null): boolean {
  if (!element) return false;

  const tag = element.tagName.toUpperCase();
  if (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    tag === "OPTION"
  ) {
    return true;
  }

  if ((element as HTMLElement).isContentEditable) {
    return true;
  }

  return Boolean(
    element.closest(
      "input, textarea, select, [contenteditable='true'], [contenteditable='']",
    ),
  );
}

/**
 * Native Browser Behavior Assurance Layer:
 * Native browser behaviors (right-click context menu, text selection, clipboard actions,
 * developer tools, and navigation shortcuts) are preserved across all surfaces in accordance
 * with web accessibility and usability standards.
 */
export function ContentProtection() {
  return null;
}
