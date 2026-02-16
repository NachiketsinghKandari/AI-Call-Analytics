export function AppLogo({ className }: { className?: string }) {
  return (
    <span className={`font-bold tracking-tight whitespace-nowrap ${className ?? ''}`}>
      AI Call Analytics
    </span>
  );
}
