export default function EditProductLoading() {
  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="h-8 w-36 bg-gray-200 rounded-lg animate-pulse" />

      {/* Existing images row */}
      <div className="space-y-2 animate-pulse">
        <div className="h-3.5 w-28 bg-gray-200 rounded" />
        <div className="flex gap-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="w-20 h-20 bg-gray-100 rounded-xl border border-gray-200" />
          ))}
        </div>
      </div>

      {/* Form fields */}
      {[...Array(5)].map((_, i) => (
        <div key={i} className="space-y-2 animate-pulse">
          <div className="h-3.5 w-24 bg-gray-200 rounded" />
          <div className="h-10 w-full bg-gray-100 rounded-xl border border-gray-200" />
        </div>
      ))}

      {/* Submit button */}
      <div className="h-11 w-full bg-gray-200 rounded-xl animate-pulse" />
    </main>
  )
}
