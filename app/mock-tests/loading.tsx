import Loader from "@/app/components/ui/loader";

export default function LoadingMockTestsPage() {
  return (
    <main className="flex min-h-full flex-1 flex-col">
      <div className="mx-auto flex min-h-[70vh] w-full max-w-6xl flex-1 items-center justify-center p-8">
        <Loader
          title="Loading mock tests"
          subtitle="Preparing your mock dashboard."
        />
      </div>
    </main>
  );
}
