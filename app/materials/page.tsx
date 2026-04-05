import Footer from "../components/Footer";
import Navbar from "../components/ui/Navbar";
import MaterialsClient from "./MaterialsClient";
import { createAdminClient } from "@/lib/supabase/admin";
import { getFlashcardsSearchPage } from "@/lib/materials-data";

export default async function MaterialsPage() {
  const initialFlashcardsPage = await getFlashcardsSearchPage(
    createAdminClient(),
    0,
  );

  return (
    <main>
      <div>
        <Navbar />
      </div>

      <MaterialsClient initialFlashcardsPage={initialFlashcardsPage} />

      <div>
        <Footer />
      </div>
    </main>
  );
}
