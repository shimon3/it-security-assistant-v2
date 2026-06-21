interface PageHeaderProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export default function PageHeader({ icon, title, description }: PageHeaderProps) {
  return (
    <div className="px-8 py-7 border-b border-slate-800">
      <div className="flex items-center gap-3 mb-1">
        {icon}
        <h1 className="text-xl font-bold text-white">{title}</h1>
      </div>
      <p className="text-slate-400 text-sm">{description}</p>
    </div>
  );
}
