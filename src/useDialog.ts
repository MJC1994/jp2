import { useEffect, useRef, type RefObject } from "react";

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

function focusableIn(container: HTMLElement) {
  return [...container.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
    (element) =>
      !element.hasAttribute("disabled") &&
      element.getAttribute("aria-hidden") !== "true" &&
      !element.closest("[inert]") &&
      element.tabIndex !== -1,
  );
}

function focusElement(element: HTMLElement | null) {
  element?.focus({ preventScroll: true });
}

export function useDialog(
  open: boolean,
  onClose: () => void,
  containerRef: RefObject<HTMLElement | null>,
  enabled = true,
) {
  const restoreRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open || !enabled) {
      return;
    }

    restoreRef.current = document.activeElement as HTMLElement | null;
    const container = containerRef.current;
    const focusTimer = window.setTimeout(() => {
      if (!container) {
        return;
      }
      if (container.contains(document.activeElement)) {
        return;
      }
      const initial =
        container.querySelector<HTMLElement>("[data-dialog-initial-focus]") ??
        focusableIn(container)[0] ??
        container;
      focusElement(initial);
    }, 40);

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab" || !container) {
        return;
      }
      const nodes = focusableIn(container);
      if (nodes.length === 0) {
        event.preventDefault();
        focusElement(container);
        return;
      }
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === first || !container.contains(active))) {
        event.preventDefault();
        focusElement(last);
      } else if (
        !event.shiftKey &&
        (active === last || !container.contains(active))
      ) {
        event.preventDefault();
        focusElement(first);
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, enabled, containerRef]);

  useEffect(() => {
    if (open) {
      return;
    }
    const toRestore = restoreRef.current;
    restoreRef.current = null;
    focusElement(toRestore);
  }, [open]);
}
