import Loader from "../components/ui/loader";

export default function ProfileLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-100 px-4">
      <Loader />
    </div>
  );
}
