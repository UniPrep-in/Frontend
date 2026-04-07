import MockTestsClient from "./MockTestsClient";
import { createClient } from "@/lib/supabase/server";
import { getMockTestsBootstrapData } from "@/lib/mock-tests-data";

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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const initialData = await getMockTestsBootstrapData({
    searchParams: {
      stream: resolvedSearchParams.stream ?? null,
      category: resolvedSearchParams.category ?? null,
      subject: resolvedSearchParams.subject ?? null,
      page: resolvedSearchParams.page ?? null,
    },
    userId: user?.id ?? null,
  });

  return (
    <main className="flex min-h-full flex-1 flex-col">
      <div className="mx-auto w-full max-w-6xl flex-1 p-8">
        <MockTestsClient
          initialParams={resolvedSearchParams}
          initialData={initialData}
          initialUserId={user?.id ?? null}
        />
      </div>
    </main>
  );
}
