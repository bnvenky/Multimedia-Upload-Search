const PageHeader = ({ title, description, children }) => (
  <header className="mb-5 flex flex-wrap items-end justify-between gap-4">
    <div>
      <h1 className="text-[clamp(1.5rem,1.2rem+1vw,2rem)] leading-tight font-bold tracking-tight">{title}</h1>
      {description && (
        <p aria-live="polite" className="mt-1 text-muted">
          {description}
        </p>
      )}
    </div>
    {children}
  </header>
);

export default PageHeader;
