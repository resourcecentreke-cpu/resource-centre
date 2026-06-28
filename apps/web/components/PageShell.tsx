import Link from 'next/link';

/** Simple centered shell for content/legal pages with a breadcrumb + title. */
export default function PageShell({
  title,
  intro,
  updated,
  children,
}: {
  title: string;
  intro?: string;
  updated?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-2xl animate-fade-up px-5 py-14">
      <nav className="mb-4 text-xs text-muted">
        <Link href="/" className="text-muted transition-colors duration-fast ease-out hover:text-text">Home</Link>
        <span className="mx-1.5 text-faint">/</span>
        {title}
      </nav>
      <h1 className="text-balance text-3xl font-semibold tracking-tight text-text md:text-4xl">{title}</h1>
      {updated && <p className="mt-2 text-xs font-medium text-faint">Last updated: {updated}</p>}
      {intro && <p className="mt-4 text-lg leading-relaxed text-muted">{intro}</p>}
      <div className="mt-8 space-y-6 text-base leading-relaxed text-text [&_a]:font-medium [&_a]:text-accent [&_a]:underline-offset-2 hover:[&_a]:underline [&_h2]:mb-2 [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-text [&_li]:text-muted [&_p]:text-muted [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5">
        {children}
      </div>
    </div>
  );
}
