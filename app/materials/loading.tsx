import Loader from "@/app/components/ui/loader";

export default function LoadingMaterialsPage() {
  return (
    <main className="flex min-h-full flex-1 flex-col">
      <div className="mx-auto flex w-full max-w-6xl flex-1 items-center justify-center p-8">
        <Loader
          title="Loading materials"
          subtitle="Getting your notes and flashcards ready."
        />
      </div>
    </main>
  );
}
