"use client";

import Link from "next/link";
import { useFormStatus } from "react-dom";
import { useMockTestsNavigationLoader } from "../MockTestsNavigationLoader";

function ProceedSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg border bg-emerald-300 py-2 text-xs text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70 sm:text-[16px]"
    >
      Proceed
    </button>
  );
}

export default function ProceedForm({
  action,
  confirmationText,
}: {
  action: (formData: FormData) => void | Promise<void>;
  confirmationText: string;
}) {
  const { showLoader } = useMockTestsNavigationLoader();

  return (
    <form
      action={action}
      onSubmitCapture={() => showLoader()}
      className="fixed bottom-0 left-0 flex w-full flex-col items-center justify-center gap-2 border-t border-neutral-300 bg-white px-4 py-2 sm:gap-4 sm:py-4"
    >
      <label className="flex max-w-6xl items-center gap-2 py-2 text-xs text-black sm:gap-4 sm:text-[16px]">
        <input
          id="confirmStart"
          name="confirmStart"
          type="checkbox"
          required
          className="h-6 w-6"
        />
        {confirmationText}
      </label>

      <div className="mx-auto flex w-full max-w-6xl gap-4">
        <ProceedSubmitButton />

        <Link
          className="flex w-full items-center justify-center rounded-lg border bg-red-200 py-2 text-xs text-black transition hover:opacity-90 sm:text-[16px]"
          href="/mock-tests"
        >
          Go Back
        </Link>
      </div>
    </form>
  );
}
