function SectionCard({ rows = 3 }: { rows?: number }) {
  return (
    <div className="bg-gray-100 rounded-2xl p-4 sm:p-5 space-y-3.5 animate-pulse">
      <div className="h-3 w-36 bg-gray-200 rounded" />
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="space-y-1">
          <div className="h-2.5 w-16 bg-gray-200 rounded" />
          <div className="h-4 w-40 bg-gray-200 rounded" />
        </div>
      ))}
    </div>
  )
}

export default function SettingsLoading() {
  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-5">
      {/* Title */}
      <div className="h-8 w-24 bg-gray-200 rounded-lg animate-pulse" />

      <div className="flex flex-col gap-4">
        {/* Basic Information */}
        <div className="relative bg-gray-100 rounded-2xl p-4 sm:p-5 space-y-3.5 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="h-3 w-36 bg-gray-200 rounded" />
            <div className="h-7 w-16 bg-gray-200 rounded-lg" />
          </div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-1">
              <div className="h-2.5 w-16 bg-gray-200 rounded" />
              <div className="h-4 w-44 bg-gray-200 rounded" />
            </div>
          ))}
        </div>

        {/* Commission */}
        <div className="bg-gray-100 rounded-2xl p-4 sm:p-5 space-y-3 animate-pulse">
          <div className="h-3 w-44 bg-gray-200 rounded" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-gray-200 last:border-0">
              <div className="space-y-1.5">
                <div className="h-4 w-32 bg-gray-200 rounded" />
                <div className="h-3 w-48 bg-gray-200 rounded" />
              </div>
              <div className="h-7 w-12 bg-gray-200 rounded-lg" />
            </div>
          ))}
        </div>

        {/* Legal */}
        <div className="bg-gray-100 rounded-2xl p-4 sm:p-5 space-y-2 animate-pulse">
          <div className="h-3 w-12 bg-gray-200 rounded" />
          <div className="h-4 w-full bg-gray-200 rounded" />
          <div className="h-4 w-3/4 bg-gray-200 rounded" />
        </div>

        {/* Notifications */}
        <div className="bg-gray-100 rounded-2xl p-4 sm:p-5 space-y-2.5 animate-pulse">
          <div className="h-3 w-24 bg-gray-200 rounded" />
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 bg-gray-200 rounded" />
            <div className="h-4 w-40 bg-gray-200 rounded" />
          </div>
        </div>

        {/* Danger Zone */}
        <div className="border border-red-100 bg-red-50 rounded-2xl p-4 sm:p-5 space-y-2.5 animate-pulse">
          <div className="h-3 w-24 bg-red-200 rounded" />
          <div className="h-4 w-full bg-red-100 rounded" />
          <div className="h-4 w-2/3 bg-red-100 rounded" />
          <div className="h-9 w-32 bg-red-200 rounded-xl" />
        </div>
      </div>
    </main>
  )
}
