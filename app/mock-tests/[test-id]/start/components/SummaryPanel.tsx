interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
  submitting: boolean;
  autoSubmitting?: boolean;
  total: number;
  answered: number;
  notAnswered: number;
  marked: number;
  answeredAndMarked: number;
}

export default function SubmitModal({
  open,
  onClose,
  onSubmit,
  submitting,
  autoSubmitting = false,
  total,
  answered,
  notAnswered,
  marked,
  answeredAndMarked,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
  <div className="bg-white flex flex-col gap-6 rounded-xl p-8 w-2xl max-w-2xl">
    <h2 className="text-2xl font-semibold text-center">
      Your Attempt Summary
    </h2>

    <table className="w-full text-sm border-collapse">
      <tbody>
        <tr className="border-b border-neutral-100">
          <td className="py-3 text-neutral-600">Total Number of Questions</td>
          <td className="py-3 text-right font-semibold">{total}</td>
        </tr>
        <tr className="border-b border-neutral-100">
          <td className="py-3 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-neutral-600">Answered</span>
          </td>
          <td className="py-3 text-right font-semibold">{answered}</td>
        </tr>
        <tr className="border-b border-neutral-100">
          <td className="py-3 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
            <span className="text-neutral-600">Not Answered</span>
          </td>
          <td className="py-3 text-right font-semibold">{notAnswered}</td>
        </tr>
        <tr className="border-b border-neutral-100">
          <td className="py-3 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500 animate-pulse"></div>
            <span className="text-neutral-600">Marked</span>
          </td>
          <td className="py-3 text-right font-semibold">{marked}</td>
        </tr>
        <tr>
          <td className="py-3 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse"></div>
            <span className="text-neutral-600">Answered & Marked</span>
          </td>
          <td className="py-3 text-right font-semibold">{answeredAndMarked}</td>
        </tr>
      </tbody>
    </table>

    <div className="flex justify-between gap-3 pt-2">
      <button
        onClick={onClose}
        disabled={submitting || autoSubmitting}
        className="w-full px-4 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-amber-300 text-white font-medium rounded-lg transition-colors"
      >
        {autoSubmitting ? "Time is up" : "Continue Test"}
      </button>

      <button
        onClick={onSubmit}
        disabled={submitting}
        className="w-full px-4 py-2.5 bg-green-500 hover:bg-green-600 disabled:cursor-not-allowed disabled:bg-green-300 text-white font-medium rounded-lg transition-colors"
      >
        {submitting ? "Processing..." : "Submit Test"}
      </button>
    </div>
  </div>
</div>
  );
}
