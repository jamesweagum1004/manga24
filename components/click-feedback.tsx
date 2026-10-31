"use client";

import { useEffect } from "react";

export function ClickFeedback() {
  useEffect(() => {
    const timers = new WeakMap<HTMLElement, number>();
    const markClicked = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      const control = event.target.closest<HTMLElement>("a, button, [role='button'], input[type='submit']");
      if (!control || control.hasAttribute("disabled") || control.getAttribute("aria-disabled") === "true") return;

      control.dataset.clickFeedback = "active";
      const previous = timers.get(control);
      if (previous) window.clearTimeout(previous);
      timers.set(control, window.setTimeout(() => {
        delete control.dataset.clickFeedback;
        timers.delete(control);
      }, 500));
    };

    document.addEventListener("click", markClicked, true);
    return () => document.removeEventListener("click", markClicked, true);
  }, []);

  return null;
}
