import MockTestsClient from "./MockTestsClient";

type MockTestsPageProps = {
  searchParams: Promise<{
    page?: string;
    category?: string;
    subject?: string;
    stream?: string;
  }>;
};

export default async function MockTestsPage({
  searchParams,
}: MockTestsPageProps) {
  const resolvedSearchParams = await searchParams;

  return (
    <main className="flex min-h-full flex-1 flex-col">
      <div className="mx-auto w-full max-w-6xl flex-1 p-8">
        <MockTestsClient initialParams={resolvedSearchParams} />
      </div>
    </main>
  );
}
