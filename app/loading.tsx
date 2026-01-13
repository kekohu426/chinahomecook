export default function Loading() {
  const skeletons = Array.from({ length: 6 });

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-7xl mx-auto px-8 py-12">
        <div className="mb-8 space-y-3">
          <div className="h-8 w-48 bg-lightGray rounded-md animate-pulse" />
          <div className="h-4 w-64 bg-lightGray rounded-md animate-pulse" />
        </div>

        <div className="columns-1 sm:columns-2 lg:columns-3 gap-8 [column-fill:_balance]">
          {skeletons.map((_, idx) => (
            <div key={idx} className="mb-8 break-inside-avoid">
              <div className="w-full h-64 bg-lightGray rounded-md animate-pulse" />
              <div className="bg-white rounded-md shadow-card p-5 space-y-3">
                <div className="h-5 w-3/4 bg-lightGray rounded-md animate-pulse" />
                <div className="h-4 w-5/6 bg-lightGray rounded-md animate-pulse" />
                <div className="flex gap-3">
                  <div className="h-3 w-16 bg-lightGray rounded-full animate-pulse" />
                  <div className="h-3 w-14 bg-lightGray rounded-full animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
