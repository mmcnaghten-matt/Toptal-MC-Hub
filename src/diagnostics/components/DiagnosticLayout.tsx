interface Props {
  title: string;
  children: React.ReactNode;
}

export default function DiagnosticLayout({ title, children }: Props) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-2 h-6 bg-primary rounded-full" />
          <span className="font-semibold text-foreground text-sm">{title}</span>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
