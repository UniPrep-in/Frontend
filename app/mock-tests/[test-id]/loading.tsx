export default function MockTestInstructionsLoading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-100 px-4 text-center">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-neutral-200 border-t-neutral-800" />
      <p className="mt-4 text-base font-medium text-neutral-700">
        Loading test instructions...
      </p>
      <p className="mt-1 text-sm text-neutral-500">
        Preparing the proceed screen for you.
      </p>
    </div>
  );
}
