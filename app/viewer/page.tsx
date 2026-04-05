import { redirect } from "next/navigation";
import ViewerFrame from "./ViewerFrame";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type ViewerPageProps = {
  searchParams: Promise<{
    file?: string;
  }>;
};

export default async function ViewerPage({ searchParams }: ViewerPageProps) {
  const resolvedSearchParams = await searchParams;
  const file = resolvedSearchParams.file;

  if (!file) {
    return <div className="p-6">No file found</div>;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  const { data, error } = await supabase.storage
    .from("notes")
    .createSignedUrl(file, 60);

  if (error || !data?.signedUrl) {
    console.error("Failed to create note URL", error);
    return <div className="p-6">Unable to load this file right now.</div>;
  }

  return <ViewerFrame url={data.signedUrl} />;
}
