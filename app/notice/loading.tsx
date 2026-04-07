import Loader from "@/app/components/ui/loader";

export default function LoadingNoticePage() {
  return (
    <main className="flex min-h-full flex-1 flex-col">
      <div className="mx-auto flex w-full max-w-6xl flex-1 items-center justify-center p-8">
        <Loader
          title="Loading notices"
          subtitle="Fetching the latest updates."
        />
      </div>
    </main>
  );
}
