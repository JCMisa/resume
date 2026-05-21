const SidebarFallback = () => {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <div style={{ width: "20rem", flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <div className="animate-pulse bg-neutral-200 dark:bg-neutral-800 h-8 w-32 rounded" />
        </header>
      </div>
    </div>
  );
};

export default SidebarFallback;
