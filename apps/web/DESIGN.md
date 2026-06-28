# Resource Centre — Design System

A refined, restrained design language for the storefront. The goal is calm,
confident UI where the **products are the colour** and the interface stays
quiet. Inspired by the design principles of Emil Kowalski (Sonner, Vaul,
*Animations on the Web*) — distilled into our own tokens, not copied.

> **The one rule:** when in doubt, remove. Restraint reads as polish.

---

## 1. Principles

1. **One accent, used sparingly.** A single indigo (`accent`). Everything else
   is a neutral grey. Never introduce a second brand colour to "spice up" a
   screen — earn attention through hierarchy and spacing instead.
2. **Layered surfaces over heavy shadows.** Depth comes from `page → surface →
   raised` and hairline borders (`line`), not from drop shadows. Shadows are
   barely-there (`shadow-xs`, `shadow-soft`).
3. **Generous, consistent whitespace.** Whitespace is a feature. Prefer more
   breathing room than feels necessary; align to the spacing rhythm.
4. **Quiet typography with intent.** One typeface (Inter). Hierarchy comes from
   size, weight (400–600, rarely 700), and tracking — not from colour or many
   weights. Big headings get negative letter-spacing; body stays readable.
5. **Motion is fast, eased-out, and transform-only.** 120–320ms,
   `ease-out` (`cubic-bezier(0.16,1,0.3,1)`). Animate `transform`/`opacity`,
   never layout. Every interactive element has a subtle press state.
6. **Respect the user.** `prefers-reduced-motion` is honoured globally. One
   consistent focus ring on everything keyboard-reachable.

---

## 2. Tokens

All tokens live in `tailwind.config.ts` (scale) and `app/globals.css` (values,
light + dark via CSS variables). **Prefer the semantic tokens** below; the
legacy keys (`coral`, `ink`, `mut`, `bg`, `bg2`, `amber`, `mint`) still work and
now resolve to refined values, but new code should use the semantic names.

### Colour (semantic)

| Token            | Use                                   |
| ---------------- | ------------------------------------- |
| `page`           | App background                        |
| `surface`        | Cards, inputs                         |
| `raised`         | Popovers, menus, dropdowns            |
| `line`           | Hairline borders (default)            |
| `line-strong`    | Stronger borders, input borders       |
| `text`           | Primary text                          |
| `muted`          | Secondary text                        |
| `faint`          | Tertiary text, eyebrow labels         |
| `accent`         | The single brand accent (indigo)      |
| `accent-fg`      | Text/icon on top of `accent`          |
| `accent-soft`    | Tinted accent surface (subtle fills)  |

Dark mode: add `class="dark"` to `<html>`. Every token flips automatically — no
per-component dark: variants needed for colour.

### Typography

- **Family:** Inter everywhere (`font-sans`). `font-display` is also Inter,
  just used at large sizes with tight tracking.
- **Scale:** use the Tailwind size classes (`text-sm` … `text-5xl`). Line-height
  and letter-spacing are baked into each step — don't override them ad-hoc.
- **Weights:** body `400`, emphasis `500`, headings `600`. Avoid `700+` except
  rare display moments.
- **Prices & numbers:** add `tnum` (or `data-price`) for tabular figures so
  columns don't jitter.

### Motion

| Class                       | Value                              |
| --------------------------- | ---------------------------------- |
| `ease-out`                  | `cubic-bezier(0.16, 1, 0.3, 1)`    |
| `ease-spring`               | `cubic-bezier(0.34, 1.56, 0.64, 1)`|
| `duration-fast`             | 120ms                              |
| `duration` (default)        | 180ms                              |
| `duration-slow`             | 320ms                              |
| `animate-fade-in`           | opacity in                         |
| `animate-fade-up`           | opacity + 8px rise (page/section)  |
| `animate-scale-in`          | popover/menu entrance              |

### Radius & shadow

- Radius: `rounded-xl` (controls), `rounded-2xl` (cards), `rounded-full` (pills,
  search). Keep it consistent within a component.
- Shadow: `shadow-xs` resting, `shadow-soft` on hover, `shadow-raised` for
  floating layers (menus, dialogs). Nothing heavier.

---

## 3. Reusable classes

Defined in `globals.css` (`@layer components`):

- **Buttons:** `.btn-primary`, `.btn-secondary`, `.btn-ghost` — or import the
  `<Button>` primitive (`components/ui/Button.tsx`) which also renders as a link
  when given `href`.
- **Cards:** `.card` (static), `.card-interactive` (hover lift + border).
- **Inputs:** `.input`.
- **Labels:** `.eyebrow` (tiny uppercase tertiary label).
- **Badges:** `.badge` (pill; pair with a tint like `bg-mint/15 text-mint`).
- **Loading:** `.skeleton` (shimmer).

---

## 4. Do / Don't

**Do**
- Reach for `muted`/`faint` to create hierarchy before reaching for colour.
- Give every clickable thing a hover **and** an active (press) state.
- Use `text-balance` on display headings.
- Keep badges monochrome-tinted and lowercase-cased ("New", not "NEW!!").

**Don't**
- Add a second accent colour, gradients-as-decoration, or emoji in nav/labels.
- Use bold drop shadows or `hover:scale` jumps larger than ~1.03.
- Hard-code hex values in components — use tokens.
- Animate `width`/`height`/`top`/`left`. Use `transform`.

---

## 5. Where things live

```
apps/web/
├─ tailwind.config.ts     # scale: colours, type, easing, keyframes, dark mode
├─ app/globals.css        # token values (light/dark) + component/utility layers
├─ app/layout.tsx         # Inter font load, shell, footer
└─ components/
   ├─ ui/Button.tsx       # button/link primitive
   ├─ Header.tsx          # refined nav + search
   ├─ ProductCard.tsx     # canonical card pattern
   └─ PageShell.tsx       # editorial content pages
```

Use `ProductCard` and `PageShell` as reference implementations when building new
surfaces — match their spacing rhythm, type, and motion.
