export default function DashboardLoading() {
  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-5">
      {/* Title */}
      <div className="h-8 w-28 bg-gray-200 rounded-lg animate-pulse" />

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex flex-col bg-gray-100 p-4 rounded-2xl gap-3 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="h-3.5 w-20 bg-gray-200 rounded" />
              <div className="h-4 w-4 bg-gray-200 rounded" />
            </div>
            <div className="h-5 w-16 bg-gray-200 rounded" />
          </div>
        ))}
      </div>

      {/* Recent Products header */}
      <div className="h-6 w-40 bg-gray-200 rounded-lg animate-pulse" />

      {/* Product cards horizontal row */}
      <div className="flex flex-row gap-4 overflow-hidden">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex-shrink-0 flex items-center gap-4 p-3 rounded-2xl border border-gray-100 bg-white w-72 animate-pulse">
            <div className="w-16 h-16 rounded-xl bg-gray-200 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded-lg w-3/5" />
              <div className="flex gap-2">
                <div className="h-5 w-10 bg-gray-200 rounded-full" />
                <div className="h-5 w-16 bg-gray-200 rounded-full" />
              </div>
            </div>
            <div className="w-8 h-8 rounded-xl bg-gray-200 flex-shrink-0" />
          </div>
        ))}
      </div>

      {/* Guide section */}
      <div className="h-6 w-20 bg-gray-200 rounded-lg animate-pulse" />
      <div className="bg-gray-100 rounded-2xl p-4 space-y-2 animate-pulse">
        <div className="h-5 w-3/4 bg-gray-200 rounded" />
        <div className="h-4 w-2/3 bg-gray-200 rounded" />
        <div className="h-8 w-28 bg-gray-200 rounded-lg mt-2" />
      </div>

      {/* Quick Actions */}
      <div className="h-6 w-36 bg-gray-200 rounded-lg animate-pulse" />
      <div className="flex flex-col gap-4 animate-pulse">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-4 w-36 bg-gray-200 rounded" />
        ))}
      </div>
    </main>
  )
}
