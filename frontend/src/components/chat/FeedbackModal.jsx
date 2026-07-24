import { useState } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

export const FEEDBACK_REASONS = [
  "Inaccurate information",
  "Incomplete answer",
  "Not relevant to my question",
  "Sources don't match",
  "Other",
]

export function FeedbackModal({ open, onClose, onSubmit }) {
  const [selectedReasons, setSelectedReasons] = useState([])
  const [comment, setComment] = useState("")
  const [submitting, setSubmitting] = useState(false)

  if (!open) return null

  function toggleReason(reason) {
    setSelectedReasons((prev) =>
      prev.includes(reason) ? prev.filter((r) => r !== reason) : [...prev, reason]
    )
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (selectedReasons.length === 0) return

    setSubmitting(true)
    try {
      await onSubmit({ reasons: selectedReasons, comment })
      setSelectedReasons([])
      setComment("")
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  function handleClose() {
    setSelectedReasons([])
    setComment("")
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-title"
        className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-xl shadow-xl p-5"
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 id="feedback-title" className="text-slate-50 font-semibold">
              What went wrong?
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Select one or more reasons. This helps improve future answers.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="text-slate-500 hover:text-slate-200 transition-colors p-1"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {FEEDBACK_REASONS.map((reason) => {
              const selected = selectedReasons.includes(reason)
              return (
                <button
                  key={reason}
                  type="button"
                  onClick={() => toggleReason(reason)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 ${
                    selected
                      ? "bg-indigo-600 border-indigo-500 text-white"
                      : "bg-slate-800 border-slate-600 text-slate-300 hover:border-indigo-500 hover:text-slate-100"
                  }`}
                >
                  {reason}
                </button>
              )
            })}
          </div>

          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Optional: tell us more..."
            rows={3}
            className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 focus:outline-none rounded-lg px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500 resize-none transition-all duration-200"
          />

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
              className="text-slate-400 hover:text-slate-100"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={selectedReasons.length === 0 || submitting}
              className="bg-indigo-500 hover:bg-indigo-600 text-white"
            >
              Submit feedback
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
