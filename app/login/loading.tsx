export default function LoginLoading() {
  return (
    <div className="flex min-h-screen bg-white">
      {/* Left dark panel — desktop only */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-zinc-950 p-12">
        <div className="h-8 w-32 bg-zinc-800 rounded-lg animate-pulse" />
        <div className="space-y-3 max-w-md animate-pulse">
          <div className="h-8 w-3/4 bg-zinc-800 rounded-lg" />
          <div className="h-8 w-2/3 bg-zinc-800 rounded-lg" />
          <div className="h-5 w-full bg-zinc-800 rounded mt-4" />
          <div className="h-5 w-4/5 bg-zinc-800 rounded" />
        </div>
        <div className="h-4 w-48 bg-zinc-800 rounded animate-pulse" />
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm space-y-6 animate-pulse">
          <div className="space-y-2">
            <div className="h-7 w-36 bg-gray-200 rounded-lg" />
            <div className="h-4 w-56 bg-gray-200 rounded" />
          </div>
          <div className="space-y-2">
            <div className="h-3.5 w-20 bg-gray-200 rounded" />
            <div className="h-11 w-full bg-gray-100 rounded-xl border border-gray-200" />
          </div>
          <div className="h-11 w-full bg-gray-200 rounded-xl" />
        </div>
      </div>
    </div>
  )
}
