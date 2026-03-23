import Navbar from "../components/ui/Navbar";
import Footer from "../components/Footer";
import MockTestsClient from "./MockTestsClient";
import { createClient } from "@/lib/supabase/server";

export default async function MockTestsPage({
  searchParams,
}: {
  searchParams: {
  page?: string;
  stream?: string;
  subject?: string;
};
}) {
  const resolvedSearchParams = await searchParams;
  
  // Build filter tree from database
  const filterTree = await getMockTestFilterTree();

  // Get all unique streams and subjects
  const { streams, subjects } = await getFilterOptions();

  return (
    <main className="flex flex-col items-center justify-center">
      <div>
        <Navbar />
      </div>

      <div className="p-8 max-w-6xl mx-auto w-full">
        <MockTestsClient
          filterTree={filterTree}
          streams={streams}
          subjects={subjects}
          initialParams={resolvedSearchParams}
        />
      </div>

      <div className="w-full">
        <Footer />
      </div>
    </main>
  );
}

// Helper function to get filter tree (stream -> subjects)
async function getMockTestFilterTree(): Promise<{ [stream: string]: string[] }> {
  const supabase = await createClient();
  
  const { data: tests, error } = await supabase
    .from("tests")
    .select("stream, subject")
    .not("stream", "is", null)
    .not("subject", "is", null);

  if (error || !tests) {
    console.error("Error fetching filter tree:", error);
    return {};
  }

  const tree: { [stream: string]: string[] } = {};
  
  tests.forEach((test: any) => {
    if (!tree[test.stream]) {
      tree[test.stream] = [];
    }
    if (test.subject && !tree[test.stream].includes(test.subject)) {
      tree[test.stream].push(test.subject);
    }
  });

  return tree;
}

// Get all unique streams and subjects
async function getFilterOptions(): Promise<{ streams: string[]; subjects: string[] }> {
  const supabase = await createClient();
  
  const { data: tests, error } = await supabase
    .from("tests")
    .select("stream, subject");

  if (error || !tests) {
    console.error("Error fetching filter options:", error);
    return { streams: [], subjects: [] };
  }

  const streamsSet = new Set<string>();
  const subjectsSet = new Set<string>();

  tests.forEach((test: any) => {
    if (test.stream) streamsSet.add(test.stream);
    if (test.subject) subjectsSet.add(test.subject);
  });

  return {
    streams: Array.from(streamsSet).sort(),
    subjects: Array.from(subjectsSet).sort(),
  };
}