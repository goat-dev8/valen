import { cn } from '@/lib/utils';

type PageHeaderProps = {
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
};

export function PageHeader({ title, description, children, className }: PageHeaderProps) {
  return (
    <div className={cn('app-page-header', className)}>
      <div>
        <h1 className="app-page-title">{title}</h1>
        {description && <p className="app-page-desc">{description}</p>}
      </div>
      {children && <div className="app-page-actions">{children}</div>}
    </div>
  );
}
