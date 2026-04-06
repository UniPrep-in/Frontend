import Loader from "@/app/components/ui/loader";

export default function StartMockLoading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-orange-50 via-white to-amber-50 px-4 text-center">
      <Loader
        title="Loading your mock"
        subtitle="Setting up your questions and timer."
      />
    </div>
  );
}
