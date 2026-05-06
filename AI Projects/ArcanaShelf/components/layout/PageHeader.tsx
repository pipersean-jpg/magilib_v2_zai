interface PageHeaderProps {
  title: string
  children?: React.ReactNode
}

export function PageHeader({ title, children }: PageHeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-stone-50/95 backdrop-blur-sm border-b border-stone-200 px-4 py-3 flex items-center justify-between min-h-[52px]">
      <h1 className="text-lg font-bold text-stone-900 tracking-tight">{title}</h1>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </header>
  )
}
