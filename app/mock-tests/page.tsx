import Navbar from "../components/ui/Navbar";
import Footer from "../components/Footer";
import MockTestsClient from "./MockTestsClient";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  createBrowseAccess,
  type MainStreamLabel,
  type SubscriptionAccess,
  getLatestVerifiedSubscriptionAccess,
  normalizeContentStreamLabel,
  resolveContentMeta,
} from "@/lib/subscriptions";

type MockTestsPageProps = {
  searchParams: Promise<{
    page?: string;
    category?: string;
    subject?: string;
    stream?: string;
  }>;
};

type SubjectOptionsByStream = Record<MainStreamLabel, string[]>;
type MockFilterRow = {
  stream: string | null;
  subject: string | null;
};

export default async function MockTestsPage({
  searchParams,
}: MockTestsPageProps) {
  const resolvedSearchParams = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let access: SubscriptionAccess | null = null;

  if (user) {
    const adminSupabase = createAdminClient();
    const { data } = await getLatestVerifiedSubscriptionAccess(
      adminSupabase,
      user.id,
    );
    access = data ?? createBrowseAccess(resolvedSearchParams.stream);
  }

  const subjectOptionsByStream = await getSubjectOptionsByStream();

  return (
    <main className="flex flex-col items-center justify-center">
      <div>
        <Navbar />
      </div>

      <div className="p-8 max-w-6xl mx-auto w-full">
        <MockTestsClient
          access={access}
          subjectOptionsByStream={subjectOptionsByStream}
          initialParams={resolvedSearchParams}
        />
      </div>

      <div className="w-full">
        <Footer />
      </div>
    </main>
  );
}

function getEmptySubjectOptionsByStream(): SubjectOptionsByStream {
  return {
    Science: [],
    Commerce: [],
    Arts: [],
  };
}

async function getSubjectOptionsByStream(): Promise<SubjectOptionsByStream> {
  const adminSupabase = createAdminClient();
  const { data: tests, error } = await adminSupabase
    .from("tests")
    .select("stream, subject")
    .not("subject", "is", null);

  if (error || !tests) {
    console.error("Error fetching mock filter options:", error);
    return getEmptySubjectOptionsByStream();
  }

  const mainSubjectsByStream = {
    Science: new Set<string>(),
    Commerce: new Set<string>(),
    Arts: new Set<string>(),
  };

  (tests as MockFilterRow[]).forEach((test) => {
    if (!test.subject) {
      return;
    }

    const contentMeta = resolveContentMeta(test.stream, test.subject);

    if (!contentMeta || contentMeta.category !== "main" || !contentMeta.mainStreamLabel) {
      return;
    }

    const normalizedStream = normalizeContentStreamLabel(test.stream);

    if (
      normalizedStream === "Science" ||
      normalizedStream === "Commerce" ||
      normalizedStream === "Arts"
    ) {
      mainSubjectsByStream[normalizedStream].add(test.subject);
    }
  });

  return {
    Science: Array.from(mainSubjectsByStream.Science).sort(),
    Commerce: Array.from(mainSubjectsByStream.Commerce).sort(),
    Arts: Array.from(mainSubjectsByStream.Arts).sort(),
  };
}
