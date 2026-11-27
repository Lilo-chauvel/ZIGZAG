import type { ReactNode } from "react";
import type { Dir } from "../../core/types";
import s from "./controls.module.css";

const ARROWS: Record<Dir, string> = { haut: "↑", bas: "↓", gauche: "←", droite: "→" };

export function Key({ children, dir, active, disabled }: { children?: ReactNode; dir?: Dir; active?: boolean; disabled?: boolean }) {
  return (
    <kbd className={[s.key, active ? s.keyActive : "", disabled ? s.keyDisabled : ""].join(" ")} aria-label={dir ? `Flèche ${dir}` : undefined}>
      {dir ? ARROWS[dir] : children}
    </kbd>
  );
}

/** Une touche et ce qu'elle fait, pour les aides en bas d'écran. Cliquable si `onClick` (mobile). */
export function Hint({ k, children, onClick }: { k: ReactNode; children: ReactNode; onClick?: () => void }) {
  const content = (
    <>
      <Key>{k}</Key>
      {children}
    </>
  );
  return onClick ? (
    <button type="button" className={[s.hint, s.hintButton].join(" ")} onClick={onClick}>
      {content}
    </button>
  ) : (
    <span className={s.hint}>{content}</span>
  );
}

/** Pavé fléché en T inversé : direction jouée en Active, directions immobiles grisées. */
export function ArrowPad({ available, last }: { available: Dir[]; last: Dir | null }) {
  const k = (d: Dir) => <Key dir={d} active={d === last} disabled={!available.includes(d)} />;
  return (
    <div className={s.pad} aria-hidden="true">
      <div className={s.padRow}>{k("haut")}</div>
      <div className={s.padRow}>
        {k("gauche")}
        {k("bas")}
        {k("droite")}
      </div>
    </div>
  );
}

export function Button({
  children,
  shortcut,
  variant = "primary",
  wide,
  onClick,
  autoFocus,
}: {
  children: ReactNode;
  shortcut?: string;
  variant?: "primary" | "secondary";
  wide?: boolean;
  onClick: () => void;
  autoFocus?: boolean;
}) {
  return (
    <button type="button" className={[s.button, s[variant], wide ? s.wide : ""].join(" ")} onClick={onClick} autoFocus={autoFocus}>
      {children}
      {shortcut && <span className={s.shortcut}>{shortcut}</span>}
    </button>
  );
}

export function Tabs<T extends string>({ items, value, onChange }: { items: { id: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className={s.tabs} role="tablist">
      {items.map((it) => (
        <button key={it.id} type="button" role="tab" aria-selected={it.id === value} className={[s.tab, it.id === value ? s.tabSelected : ""].join(" ")} onClick={() => onChange(it.id)}>
          {it.label}
        </button>
      ))}
    </div>
  );
}

export function Hud({ caption, value, tone = "ink" }: { caption: string; value?: string; tone?: "ink" | "muted" | "danger" | "success" }) {
  return (
    <div className={s.hud}>
      <span className={s.caption}>{caption}</span>
      {value && <span className={[s.counter, s[tone]].join(" ")}>{value}</span>}
    </div>
  );
}
