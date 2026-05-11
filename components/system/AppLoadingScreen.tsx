export function AppLoadingScreen() {
  return (
    <div className="min-h-screen bg-[#f7f9fd] px-6 py-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl items-center justify-center">
        <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
          <div className="mx-auto mb-5 h-10 w-10 animate-spin rounded-full border-4 border-slate-100 border-t-blue-600" />
          <h1 className="text-xl font-semibold text-slate-950">PairWise</h1>
          <p className="mt-2 text-sm text-slate-500">Opening your household budget...</p>
        </div>
      </div>
    </div>
  );
}
