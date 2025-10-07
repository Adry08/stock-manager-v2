
  export default function SkeletonLoader({
  type = "card",
  count = 1,
  className = ""
}: {
  type?: "card" | "text" | "image" | "bar" | "chart" | "kpi" | "navbar" | "navbarMobile" | "podium",
  count?: number,
  className?: string
}) {
  const items = Array.from({ length: count }, (_, i) => i);
  
  // NOUVEAU: Squelette pour la navigation mobile
  if (type === "navbarMobile") {
    return (
      <div className="md:hidden animate-pulse">
        {/* Top bar skeleton */}
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-b dark:border-gray-700">
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
            <div className="flex gap-2">
              <div className="h-9 w-9 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              <div className="h-9 w-9 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            </div>
          </div>
        </nav>
        {/* Bottom nav skeleton */}
        <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 pb-[env(safe-area-inset-bottom)]">
            <div className="flex items-center gap-x-2 p-2 bg-gray-200/70 dark:bg-gray-700/70 rounded-full">
                <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
            </div>
        </nav>
      </div>
    );
  }

  if (type === "navbar") {
    return (
      <nav className="hidden md:flex fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-b dark:border-gray-700 shadow-sm animate-pulse">
        <div className="container mx-auto px-6 py-2 flex items-center justify-between">
          <div className="flex gap-2">
            {[...Array(6)].map((_, i) => (
                <div key={i} className="h-9 w-28 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
                <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
            <div className="h-9 w-9 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
          </div>
        </div>
      </nav>
    );
  }

  if (type === "kpi") {
    return (
      <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 ${className}`}>
        {items.map((item) => (
          <div key={item} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 animate-pulse">
            <div className="flex items-center justify-between mb-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
              <div className="h-6 w-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
          </div>
        ))}
      </div>
    );
  }

  if (type === "podium") {
    return (
      <div className={`bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 ${className}`}>
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4 w-48"></div>
        <div className="flex justify-around items-end gap-3 sm:gap-4 pt-2 h-[200px] sm:h-[250px] animate-pulse">
          {[1, 2, 3].map((item) => (
            <div key={item} className="flex flex-col justify-end w-1/3 text-center">
              <div className="mb-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-1"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16 mx-auto"></div>
              </div>
              <div className={`bg-gray-200 dark:bg-gray-700 rounded-t-lg`} style={{ height: `${60 + item * 20}%` }}></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === "card") {
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 ${className}`}>
        {items.map((item) => (
          <div key={item} className="bg-white dark:bg-gray-800 shadow-md rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 animate-pulse">
            <div className="w-full h-32 sm:h-40 bg-gray-200 dark:bg-gray-700"></div>
            <div className="p-3 sm:p-4 space-y-2">
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/5"></div>
              <div className="flex justify-between items-center mt-2">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
              </div>
            </div>
            <div className="border-t dark:border-gray-700 p-2 flex justify-between gap-2 bg-gray-50 dark:bg-gray-800">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded flex-1"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded flex-1"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === "text" || type === "bar") {
    return (
      <div className={`animate-pulse space-y-2 ${className}`}>
        {items.map((item) => (
          <div
            key={item}
            className={`h-4 bg-gray-200 dark:bg-gray-700 rounded ${type === "bar" ? "w-1/3 sm:w-1/4" : "w-full"}`}
          ></div>
        ))}
      </div>
    );
  }

  if (type === "image" || type === "chart") {
    return (
      <div className={`bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 ${className}`}>
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4 w-64 animate-pulse"></div>
        <div
          className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${type === "chart" ? "h-40 sm:h-60 w-full" : "w-full h-full"}`}
        ></div>
      </div>
    );
  }

  return null;
}