"use client";

import { useId, useState } from "react";

interface HomeFaqAccordionProps {
  readonly items: readonly (readonly [string, string])[];
}

export function HomeFaqAccordion({ items }: HomeFaqAccordionProps) {
  const baseId = useId();
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div className="wd-faq-list">
      {items.map(([question, answer], index) => {
        const isOpen = openIndex === index;
        const buttonId = `${baseId}-button-${index}`;
        const panelId = `${baseId}-panel-${index}`;

        return (
          <article className="wd-faq-item" data-open={isOpen ? "true" : "false"} key={question}>
            <h3>
              <button
                aria-controls={panelId}
                aria-expanded={isOpen}
                id={buttonId}
                type="button"
                onClick={() => setOpenIndex(isOpen ? -1 : index)}
              >
                <span>{question}</span>
                <span aria-hidden="true" className="wd-faq-toggle">⌄</span>
              </button>
            </h3>
            <div aria-labelledby={buttonId} className="wd-faq-answer" id={panelId} role="region">
              <div><p>{answer}</p></div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
