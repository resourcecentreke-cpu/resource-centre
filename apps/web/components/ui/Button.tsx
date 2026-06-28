import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';

/**
 * Button — a quiet, tactile primitive.
 *
 * Taste notes:
 *  • Three intents, no more. Restraint reads as polish.
 *  • Press feedback is a subtle scale (active:scale), not a colour flash.
 *  • Motion is fast + eased-out; the focus ring is inherited from globals.
 *  • Renders as <a> when `href` is set, otherwise <button>.
 */
type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

const base =
  'inline-flex select-none items-center justify-center gap-2 whitespace-nowrap ' +
  'rounded-xl font-medium transition duration-fast ease-out ' +
  'active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50';

const variants: Record<Variant, string> = {
  primary: 'bg-accent text-accent-fg shadow-xs hover:opacity-90',
  secondary: 'border border-line-strong bg-surface text-text hover:bg-bg2',
  ghost: 'text-muted hover:bg-bg2 hover:text-text',
};

const sizes: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
};

type CommonProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
};

export function buttonClass({
  variant = 'primary',
  size = 'md',
  className = '',
}: {
  variant?: Variant;
  size?: Size;
  className?: string;
} = {}) {
  return `${base} ${variants[variant]} ${sizes[size]} ${className}`.trim();
}

type ButtonProps = CommonProps &
  Omit<ComponentProps<'button'>, 'className' | 'children'> & { href?: undefined };
type AnchorProps = CommonProps &
  Omit<ComponentProps<typeof Link>, 'className' | 'children' | 'href'> & { href: string };

export default function Button(props: ButtonProps | AnchorProps) {
  const { variant, size, className, children, ...rest } = props;
  const cls = buttonClass({ variant, size, className });

  if ('href' in props && props.href) {
    const { href, ...anchorRest } = rest as AnchorProps;
    return (
      <Link href={href} className={cls} {...anchorRest}>
        {children}
      </Link>
    );
  }
  return (
    <button className={cls} {...(rest as ComponentProps<'button'>)}>
      {children}
    </button>
  );
}
