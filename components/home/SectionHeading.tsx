import type { ReactNode } from "react";

interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  align?: "left" | "center";
  label?: string;
}

export function SectionHeading({
  title,
  subtitle,
  action,
  align = "left",
  label = "Recipe Zen",
}: SectionHeadingProps) {
  const isCenter = align === "center";
  return (
    <div
      className={`editorial-heading ${
        isCenter ? "editorial-heading--center" : "editorial-heading--left"
      }`}
    >
      <div
        className={`editorial-eyebrow ${
          isCenter ? "editorial-eyebrow--center" : "editorial-eyebrow--left"
        }`}
      >
        <span className="editorial-eyebrow-line" />
        <span>{label}</span>
      </div>

      <div
        className={`flex w-full flex-col gap-4 ${
          isCenter ? "items-center" : "items-start"
        }`}
      >
        <div className={`${isCenter ? "text-center" : "text-left"}`}>
          <h2 className="editorial-title">{title}</h2>
          {subtitle && (
            <p className="editorial-subtitle mt-3">{subtitle}</p>
          )}
        </div>
        {action && <div className={isCenter ? "" : "self-end"}>{action}</div>}
      </div>
    </div>
  );
}
