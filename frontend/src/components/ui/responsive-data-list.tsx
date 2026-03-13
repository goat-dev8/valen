'use client';

type Column<T> = {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  mobileLabel?: string;
};

type ResponsiveDataListProps<T> = {
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string;
  rowHref?: (row: T) => string;
  emptyMessage?: string;
};

/** Table on desktop, cards on mobile (W1). */
export function ResponsiveDataList<T>({
  rows,
  columns,
  rowKey,
  rowHref,
  emptyMessage = 'No items',
}: ResponsiveDataListProps<T>) {
  if (!rows.length) {
    return <p className="text-sm text-[#8B98A5]">{emptyMessage}</p>;
  }

  return (
    <>
      <div className="space-y-3 md:hidden">
        {rows.map((row) => {
          const card = (
            <div key={rowKey(row)} className="rounded-2xl border border-[#E8ECF0] bg-white p-4">
              {columns.map((col) => (
                <div key={col.key} className="flex justify-between gap-3 border-b border-[#F4F6F8] py-2 last:border-0">
                  <span className="text-xs font-medium uppercase tracking-wide text-[#8B98A5]">
                    {col.mobileLabel ?? col.header}
                  </span>
                  <span className="text-sm text-[#1A2332]">{col.render(row)}</span>
                </div>
              ))}
            </div>
          );
          const href = rowHref?.(row);
          if (href) {
            return (
              <a key={rowKey(row)} href={href} className="block transition hover:opacity-90">
                {card}
              </a>
            );
          }
          return card;
        })}
      </div>
      <div className="app-table-wrap hidden md:block">
        <table className="app-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key}>{col.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={rowKey(row)}>
                {columns.map((col) => (
                  <td key={col.key}>{col.render(row)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
