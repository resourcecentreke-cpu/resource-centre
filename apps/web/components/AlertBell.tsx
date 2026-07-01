'use client';
import { useEffect, useState } from 'react';

/**
 * One-click price alert from any product card.
 * Saves to the same localStorage store the product page / alerts page use
 * (`rc_alerts`), targeting the current best price — no separate page needed.
 */
export default function AlertBell({ slug, price }: { slug: string; price: number }) {
  const [set, setSet] = useState(false);

  useEffect(() => {
    try {
      const alerts: { slug: string }[] = JSON.parse(localStorage.getItem('rc_alerts') || '[]');
      setSet(alerts.some((a) => a.slug === slug));
    } catch { /* ignore */ }
  }, [slug]);

  const toggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const alerts: { slug: string; target: number }[] = JSON.parse(
        localStorage.getItem('rc_alerts') || '[]',
      );
      const next = set
        ? alerts.filter((a) => a.slug !== slug)
        : [...alerts, { slug, target: price }];
      localStorage.setItem('rc_alerts', JSON.stringify(next));
      setSet(!set);
    } catch { /* ignore */ }
  };

  return (
    <button
      onClick={toggle}
      aria-label={set ? 'Remove price alert' : 'Alert me when the price drops'}
      title={set ? 'Alert set — tap to remove' : 'Alert me on price drop'}
      className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm transition duration-fast ease-out active:scale-95 ${
        set
          ? 'bg-accent text-white'
          : 'bg-bg2 text-muted ring-1 ring-line hover:text-text hover:ring-line-strong'
      }`}
    >
      {set ? '✓' : '🔔'}
    </button>
  );
}
