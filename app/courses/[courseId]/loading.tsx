export default function CourseLoading() {
  return (
    <div className="min-h-screen bg-bg-base animate-pulse">
      {/* Top nav skeleton */}
      <nav className="border-b border-bg-border bg-bg-base/80 h-14">
        <div className="max-w-6xl mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-md bg-bg-elevated" />
            <div className="w-6 h-6 rounded-md bg-bg-elevated" />
            <div className="w-32 h-5 rounded bg-bg-elevated" />
          </div>
          <div className="w-20 h-7 rounded-lg bg-bg-elevated" />
        </div>
      </nav>

      {/* Tab bar skeleton */}
      <div className="border-b border-bg-border bg-bg-surface/40">
        <div className="max-w-6xl mx-auto px-6 h-11 flex items-center gap-3">
          <div className="w-20 h-7 rounded-md bg-bg-elevated" />
          <div className="w-20 h-7 rounded-md bg-bg-elevated" />
          <div className="w-20 h-7 rounded-md bg-bg-elevated" />
          <div className="w-16 h-7 rounded-md bg-bg-elevated" />
        </div>
      </div>

      {/* Content skeleton */}
      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        <div className="space-y-2 max-w-sm">
          <div className="w-48 h-6 rounded bg-bg-elevated" />
          <div className="w-72 h-4 rounded bg-bg-elevated" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
          <div className="card h-32 bg-bg-surface/50 border border-bg-border rounded-xl" />
          <div className="card h-32 bg-bg-surface/50 border border-bg-border rounded-xl" />
        </div>
      </main>
    </div>
  );
}
