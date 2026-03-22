import Navbar from "@/app/components/ui/Navbar";
import Footer from "@/app/components/Footer";
import LecturesView from "./components/view";

export default function Live({
  params,
}: {
  params: { id: string };
}) {
    return(
        <main>
            <div>
                <Navbar />
            </div>

            <div className="p-4 md:p-8">
              <LecturesView lectureId={params.id} />
            </div>

            <div>
                <Footer />
            </div>
        </main>
    );
}