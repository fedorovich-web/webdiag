"use client";

import type { CSSProperties } from "react";
import { useLayoutEffect, useId, useRef, useState } from "react";

interface HomeFaqAccordionProps {
  readonly items: readonly (readonly [string, string])[];
}

export function HomeFaqAccordion({ items }: HomeFaqAccordionProps) {
  const baseId = useId();
  const [openIndex, setOpenIndex] = useState(0);
  const [panelHeights, setPanelHeights] = useState<readonly number[]>(() => items.map(() => 0));
  const panelRefs = useRef<Array<HTMLDivElement | null>>([]);

  useLayoutEffect(() => {
    setPanelHeights(panelRefs.current.map((panel) => panel?.scrollHeight ?? 0));
  }, [items]);

  const reservedPanelHeight = Math.max(...panelHeights, 0);

  return (
    <div className="wd-faq-grid" style={{ "--wd-faq-panel-height": `${reservedPanelHeight}px` } as CSSProperties}>
      {items.map(([question, answer], index) => {
        const isOpen = openIndex === index;
        const buttonId = `${baseId}-button-${index}`;
        const panelId = `${baseId}-panel-${index}`;

        return (
          <article className={`wd-faq-item${isOpen ? " is-open" : ""}`} key={question}>
            <h3>
              <button
                aria-controls={panelId}
                aria-expanded={isOpen}
                id={buttonId}
                type="button"
                onClick={() => setOpenIndex(index)}
              >
                <span>{question}</span>
                <span aria-hidden="true" className="wd-faq-toggle" />
              </button>
            </h3>
            <div
              aria-labelledby={buttonId}
              className="wd-faq-panel"
              id={panelId}
              role="region"
              style={{ maxHeight: isOpen ? "var(--wd-faq-panel-height)" : "0px" }}
            >
              <div ref={(node) => { panelRefs.current[index] = node; }}>
                <p>{answer}</p>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
