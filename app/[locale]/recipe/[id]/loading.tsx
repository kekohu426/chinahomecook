export default function RecipeLoading() {
  const steps = Array.from({ length: 3 });

  return (
    <div className="min-h-screen bg-cream">
      <div className="w-full h-[520px] bg-lightGray animate-pulse" />
      <div className="max-w-7xl mx-auto px-12 py-12">
        <div className="flex gap-8">
          <div className="w-[300px] h-[500px] bg-white border border-cream rounded-[18px] shadow-card p-6 animate-pulse" />
          <div className="flex-1 space-y-6">
            <div className="bg-white rounded-[18px] border border-cream shadow-card p-8 space-y-3 animate-pulse">
              <div className="h-6 w-40 bg-lightGray rounded" />
              <div className="h-4 w-3/4 bg-lightGray rounded" />
              <div className="h-4 w-1/2 bg-lightGray rounded" />
            </div>
            {steps.map((_, idx) => (
              <div
                key={idx}
                className="bg-white rounded-[18px] shadow-card border border-cream p-6 space-y-3 animate-pulse"
              >
                <div className="h-6 w-24 bg-lightGray rounded" />
                <div className="h-48 w-full bg-lightGray rounded" />
                <div className="h-4 w-full bg-lightGray rounded" />
                <div className="h-4 w-5/6 bg-lightGray rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
