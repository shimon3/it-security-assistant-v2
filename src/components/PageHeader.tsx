interface PageHeaderProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export default function PageHeader({ icon, title, description }: PageHeaderProps) {
  return (
    <header className="bg-surface border-b border-line">
      <div className="max-w-2xl mx-auto px-4 sm:px-8 py-6 sm:py-8">
        <div className="flex items-center gap-3">
          <span className="flex w-9 h-9 items-center justify-center rounded-lg bg-brand-soft [&>svg]:text-brand">{icon}</span>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">{title}</h1>
        </div>
        <p className="mt-2 text-[15px] text-ink-2 max-w-[60ch]">{description}</p>
      </div>
    </header>
  );
}
