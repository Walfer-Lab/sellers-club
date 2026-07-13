export default function NewProductLoading() {
  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="h-8 w-40 bg-gray-200 rounded-lg animate-pulse" />

      {/* Form fields */}
      {[...Array(5)].map((_, i) => (
        <div key={i} className="space-y-2 animate-pulse">
          <div className="h-3.5 w-24 bg-gray-200 rounded" />
          <div className="h-10 w-full bg-gray-100 rounded-xl border border-gray-200" />
        </div>
      ))}

      {/* Image upload area */}
      <div className="space-y-2 animate-pulse">
        <div className="h-3.5 w-20 bg-gray-200 rounded" />
        <div className="h-36 w-full bg-gray-100 rounded-2xl border-2 border-dashed border-gray-200" />
      </div>

      {/* Submit button */}
      <div className="h-11 w-full bg-gray-200 rounded-xl animate-pulse" />
    </main>
  )
}
