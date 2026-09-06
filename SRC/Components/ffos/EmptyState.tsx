import type { ReactNode } from "react";

export function EmptyState({
  title,
  description,
  action,
  illustration,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  illustration?: "movimientos" | "presupuesto" | "meta";
}) {
  return (
    <div className="flex flex-col items-center px-8 py-12 text-center">
      <Illustration kind={illustration ?? "movimientos"} />
      <h2 className="mt-5 text-base font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

function Illustration({ kind }: { kind: "movimientos" | "presupuesto" | "meta" }) {
  const stroke = "var(--subtle)";
  const common = {
    width: 96,
    height: 96,
    viewBox: "0 0 96 96",
    fill: "none",
    stroke,
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  if (kind === "presupuesto")
    return (
      <svg {...common}>
        <rect x="14" y="22" width="68" height="52" rx="8" />
        <path d="M14 38h68" />
        <path d="M26 52h20M26 62h34" />
        <circle cx="66" cy="55" r="9" />
      </svg>
    );

  if (kind === "meta")
    return (
      <svg {...common}>
        <circle cx="48" cy="48" r="26" />
        <circle cx="48" cy="48" r="14" />
        <circle cx="48" cy="48" r="3" />
        <path d="M70 26l8-8M74 22h6v6" />
      </svg>
    );

  return (
    <svg {...common}>
      <rect x="16" y="26" width="64" height="44" rx="8" />
      <path d="M16 40h64" />
      <path d="M60 55h10" />
      <path d="M30 18l10 8M66 18l-10 8" />
    </svg>
  );
}
