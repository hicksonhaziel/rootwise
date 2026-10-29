export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-bg-base animate-pulse">
      {/* Top nav skeleton */}
      <nav className="border-b border-bg-border bg-bg-base/80 h-14">
        <div className="max-w-6xl mx-auto px-6 h-full flex items-center justify-between">
          <div className="w-28 h-6 rounded bg-bg-elevated" />
          <div className="flex items-center gap-3">
            <div className="w-20 h-7 rounded-lg bg-bg-elevated" />
            <div className="w-32 h-6 rounded-md bg-bg-elevated hidden sm:block" />
          </div>
        </div>
      </nav>

      {/* Main content skeleton */}
      <main className="max-w-6xl mx-auto px-6 py-10 space-y-10">
        <div className="space-y-2">
          <div className="w-48 h-8 rounded bg-bg-elevated" />
          <div className="w-36 h-4 rounded bg-bg-elevated" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-24 h-4 rounded bg-bg-elevated" />
              <div className="w-20 h-5 rounded bg-bg-elevated" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="card h-[180px] bg-bg-surface/50 border border-bg-border rounded-xl" />
              <div className="card h-[180px] bg-bg-surface/50 border border-bg-border rounded-xl" />
            </div>
          </div>
          <div className="space-y-4">
            <div className="w-28 h-4 rounded bg-bg-elevated" />
            <div className="card h-24 bg-bg-surface/50 border border-bg-border rounded-xl" />
          </div>
        </div>
      </main>
    </div>
  );
}
