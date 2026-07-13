export default function PaymentsLoading() {
  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="h-8 w-28 bg-gray-200 rounded-lg animate-pulse" />
        <div className="h-9 w-24 bg-gray-200 rounded-lg animate-pulse" />
      </div>

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

      {/* Payment method card */}
      <div className="bg-gray-100 rounded-2xl p-4 space-y-2 animate-pulse">
        <div className="h-4 w-56 bg-gray-200 rounded" />
        <div className="h-8 w-40 bg-gray-200 rounded-lg" />
      </div>

      {/* Receipt table */}
      <div className="bg-gray-100 rounded-2xl overflow-hidden animate-pulse">
        {/* Table header */}
        <div className="flex gap-4 px-5 py-3 border-b border-gray-200">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex-1 h-3.5 bg-gray-200 rounded" />
          ))}
        </div>
        {/* Table rows */}
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-4 px-5 py-4 border-b border-gray-100 last:border-0">
            {[...Array(4)].map((_, j) => (
              <div key={j} className="flex-1 h-4 bg-gray-200 rounded" />
            ))}
          </div>
        ))}
      </div>
    </main>
  )
}
