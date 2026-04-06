import Loader from "../components/ui/loader";

export default function ProfileLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-orange-50 via-white to-amber-50 px-4">
      <Loader
        title="Loading your profile"
        subtitle="Bringing your UniPrep details into view."
      />
    </div>
  );
}
