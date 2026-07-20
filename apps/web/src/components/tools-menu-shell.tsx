"use client";

import { ReactNode, useCallback, useEffect, useRef, useState } from "react";

interface ToolsMenuShellProps {
  readonly children: ReactNode;
  readonly className?: string;
}

export function ToolsMenuShell({ children, className }: ToolsMenuShellProps) {
  const menuRef = useRef<HTMLDetailsElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [open, setOpen] = useState(false);

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const closeMenu = useCallback(() => {
    clearCloseTimer();
    setOpen(false);
  }, [clearCloseTimer]);

  const scheduleClose = useCallback(() => {
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => setOpen(false), 260);
  }, [clearCloseTimer]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMenu();
    };

    const onPointerDown = (event: PointerEvent) => {
      const menu = menuRef.current;
      const target = event.target;
      if (!open || !menu || !(target instanceof Node)) return;
      if (!menu.contains(target)) closeMenu();
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);

    return () => {
      clearCloseTimer();
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [clearCloseTimer, closeMenu, open]);

  return (
    <details
      className={className}
      onClick={(event) => {
        const target = event.target;
        if (target instanceof Element && target.closest("summary")) {
          event.preventDefault();
          clearCloseTimer();
          setOpen((current) => !current);
        }
      }}
      onFocusCapture={() => {
        clearCloseTimer();
        setOpen(true);
      }}
      onPointerEnter={() => {
        clearCloseTimer();
        setOpen(true);
      }}
      onPointerLeave={scheduleClose}
      open={open}
      ref={menuRef}
    >
      {children}
    </details>
  );
}
