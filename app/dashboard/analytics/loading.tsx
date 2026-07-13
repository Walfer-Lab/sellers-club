export default function AnalyticsLoading() {
  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-8">
      {/* Title */}
      <div className="h-8 w-28 bg-gray-200 rounded-lg animate-pulse" />

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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

      {/* Chart area */}
      <div className="bg-gray-100 rounded-2xl p-5 space-y-4 animate-pulse">
        {/* Chart header with toggle buttons */}
        <div className="flex items-center justify-between">
          <div className="h-5 w-32 bg-gray-200 rounded" />
          <div className="flex gap-2">
            <div className="h-7 w-14 bg-gray-200 rounded-lg" />
            <div className="h-7 w-14 bg-gray-200 rounded-lg" />
            <div className="h-7 w-14 bg-gray-200 rounded-lg" />
          </div>
        </div>
        {/* Chart body */}
        <div className="h-64 w-full bg-gray-200 rounded-xl" />
      </div>
    </main>
  )
}
