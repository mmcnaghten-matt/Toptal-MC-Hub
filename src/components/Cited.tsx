import ReactMarkdown from "react-markdown";
import type { SourceRef } from "@/data/industryData";

// Safely stringify values before passing to Markdown (Gemini may return objects)
export const toStr = (v: unknown): string => {
  if (typeof v === "string") return v;
  if (v == null) return "";
  if (typeof v === "object") return JSON.stringify(v, null, 2);
  return String(v);
};

// Citations like [3] render as small superscript links to the numbered Sources list (ids "source-3").
const citationize = (text: string) => text.replace(/\[(\d+)\]/g, "[\\[$1\\]](#source-$1)");
const CitationLink = ({ href, children, node: _node, ...rest }: React.ComponentProps<"a"> & { node?: unknown }) =>
  href?.startsWith("#source-") ? (
    <sup className="ml-px text-[9px] font-medium leading-none text-muted-foreground/80 hover:text-primary">
      <a href={href} className="no-underline text-inherit">{children}</a>
    </sup>
  ) : (
    <a href={href} {...rest}>{children}</a>
  );

// The Tailwind typography plugin is not enabled, so style the basic blocks explicitly.
const mdComponents = {
  a: CitationLink,
  p: ({ children }: { children?: React.ReactNode }) => <p className="mb-3 last:mb-0">{children}</p>,
  ul: ({ children }: { children?: React.ReactNode }) => <ul className="list-disc pl-5 space-y-1.5">{children}</ul>,
  ol: ({ children }: { children?: React.ReactNode }) => <ol className="list-decimal pl-5 space-y-1.5">{children}</ol>,
};

export const Markdown = ({ children, components, ...props }: React.ComponentProps<typeof ReactMarkdown> & { children: any }) => (
  <ReactMarkdown {...props} components={{ ...mdComponents, ...components }}>{citationize(toStr(children))}</ReactMarkdown>
);

// Inline version for single-line text (list items, pills, table cells): bold/italics and citations, no paragraph wrapper.
export const Rich = ({ children }: { children: any }) => (
  <Markdown components={{ p: ({ children: c }) => <>{c}</> }}>{children}</Markdown>
);

export type { SourceRef };

// Numbered list the [n] citations point to.
export function SourcesList({ sources, className = "" }: { sources?: SourceRef[]; className?: string }) {
  if (!sources || sources.length === 0) return null;
  return (
    <section className={`rounded-lg border border-border bg-card p-6 ${className}`}>
      <h3 className="mb-1 font-semibold text-card-foreground">Sources</h3>
      <p className="mb-4 text-xs text-muted-foreground">Numbers match the [n] citations in the text above.</p>
      <ol className="space-y-1.5">
        {sources.map((s) => (
          <li key={s.id} id={`source-${s.id}`} className="flex gap-3 text-sm scroll-mt-24">
            <span className="w-8 shrink-0 text-right font-medium text-muted-foreground">[{s.id}]</span>
            {s.url ? (
              <a href={s.url} target="_blank" rel="noopener noreferrer" className="min-w-0 truncate text-primary hover:underline" title={s.url}>
                {s.title}
              </a>
            ) : (
              <span className="min-w-0 truncate">{s.title}</span>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
