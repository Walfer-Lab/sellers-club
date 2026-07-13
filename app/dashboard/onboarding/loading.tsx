export default function OnboardingLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
      <div className="w-full max-w-sm space-y-6 animate-pulse">
        {/* Heading */}
        <div className="space-y-2">
          <div className="h-8 w-48 bg-gray-200 rounded-lg" />
          <div className="h-4 w-64 bg-gray-200 rounded" />
        </div>

        {/* Fields */}
        {[...Array(2)].map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-3.5 w-24 bg-gray-200 rounded" />
            <div className="h-11 w-full bg-gray-100 rounded-xl border border-gray-200" />
          </div>
        ))}

        {/* Submit */}
        <div className="h-11 w-full bg-gray-200 rounded-xl" />
      </div>
    </div>
  )
}
