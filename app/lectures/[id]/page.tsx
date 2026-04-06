import LecturesView from "./components/view";

export default function Live({
  params,
}: {
  params: { id: string };
}) {
    return(
        <main>
            <div className="p-4 md:p-8">
              <LecturesView lectureId={params.id} />
            </div>
        </main>
    );
}
