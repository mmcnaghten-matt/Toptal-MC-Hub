import ToptalLogo from "@/components/ToptalLogo";

interface Props {
  title: string;
  children: React.ReactNode;
}

export default function DiagnosticLayout({ title, children }: Props) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-primary sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <span className="font-semibold text-primary-foreground text-sm">{title}</span>
          <ToptalLogo className="h-7" />
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
