import Link from 'next/link';

/**
 * Gentle "tip us" prompt the visitor can act on. Display-only — links to /tip
 * where the M-Pesa Till/Paybill is shown. Drop it on any page.
 */
export default function TipPrompt() {
  return (
    <Link
      href="/tip"
      className="group flex items-center gap-4 rounded-2xl border border-coral/25 bg-gradient-to-r from-[#EEF1FB] to-[#F4F6FD] p-4 shadow-sm hover:border-coral transition"
    >
      <span className="text-2xl shrink-0">💛</span>
      <span className="flex-1">
        <span className="block font-bold text-sm">Found a better price with us?</span>
        <span className="block text-xs text-mut mt-0.5">
          Send us a small M-Pesa token to keep the tracker running — totally optional.
        </span>
      </span>
      <span className="shrink-0 rounded-full bg-coral text-white text-xs font-bold px-4 py-2 group-hover:scale-105 transition">
        Tip us
      </span>
    </Link>
  );
}
