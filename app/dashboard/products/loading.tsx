export default function ProductsLoading() {
  return (
    <div className="font-general text-gray-900">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="h-8 w-28 bg-gray-200 rounded-lg animate-pulse" />
          <div className="h-9 w-32 bg-gray-200 rounded-lg animate-pulse" />
        </div>

        {/* Product list rows */}
        <section className="rounded-xl overflow-hidden flex flex-col gap-2">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-4 px-5 py-4 bg-zinc-100 animate-pulse"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-48 bg-zinc-200 rounded" />
                    <div className="h-3.5 w-10 bg-zinc-200 rounded" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-20 bg-zinc-200 rounded" />
                    <div className="h-3 w-16 bg-zinc-200 rounded" />
                  </div>
                </div>
              </div>
              <div className="h-8 w-8 bg-zinc-200 rounded-lg flex-shrink-0" />
            </div>
          ))}
        </section>
      </main>
    </div>
  )
}
