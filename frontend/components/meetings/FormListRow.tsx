"use client";

import {
  ListContent,
  ListItem,
  ListPrefix,
  ListSuffix,
  ListTitle,
} from "@seed-design/react";
import type { ReactNode } from "react";

interface FormListRowProps {
  icon: string;
  label: string;
  value: string;
  onClick: () => void;
  expanded?: boolean;
  children?: ReactNode;
}

export function FormListRow({
  icon,
  label,
  value,
  onClick,
  expanded,
  children,
}: FormListRowProps) {
  return (
    <div>
      <ListItem onClick={onClick} aria-expanded={expanded}>
        <ListPrefix>
          <span
            aria-hidden
            style={{
              fontSize: "var(--seed-font-size-t5)",
              lineHeight: 1,
            }}
          >
            {icon}
          </span>
        </ListPrefix>
        <ListContent>
          <ListTitle>{label}</ListTitle>
        </ListContent>
        <ListSuffix>
          <span
            style={{
              fontSize: "var(--seed-font-size-t5)",
              lineHeight: "var(--seed-line-height-t5)",
              fontWeight: "var(--seed-font-weight-regular)",
              color: "var(--seed-color-fg-neutral-subtle)",
            }}
          >
            {value}
          </span>
        </ListSuffix>
      </ListItem>
      {expanded ? children : null}
    </div>
  );
}
