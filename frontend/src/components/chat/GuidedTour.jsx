import { useEffect } from "react"
import { Button } from "@/components/ui/button"

// Centered modal layout style for tour step dialog
const CENTERED_STYLE = {
  position: "fixed",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 360,
}

/**
 * Onboarding Guided Tour component.
 * Displays a centered modal overlay highlighting app functionality step-by-step.
 *
 * Props:
 *   tour: Object returned by useGuidedTour hook containing step state and control functions:
 *         { active, step, stepIndex, totalSteps, next, prev, skip }
 */
export function GuidedTour({ tour }) {
  const { active, step, stepIndex, totalSteps, next, prev, skip } = tour

  // Attach global keydown listeners for keyboard navigation when tour is active
  useEffect(() => {
    if (!active) return
    function onKey(e) {
      if (e.key === "Escape") skip()
      if (e.key === "ArrowRight") next()
      if (e.key === "ArrowLeft") prev()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [active, next, prev, skip])

  if (!active) return null

  const isLast = stepIndex === totalSteps - 1

  return (
    <div className="fixed inset-0 z-[100]" aria-modal="true" role="dialog">
      {/* Uniform full-screen dark backdrop */}
      <div className="absolute inset-0 bg-black/65 backdrop-blur-[2px]" />

      {/* Centered step instruction card */}
      <div
        style={CENTERED_STYLE}
        className="z-[101] bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-5"
      >
        <p className="text-xs font-medium text-indigo-400 mb-1">
          Step {stepIndex + 1} of {totalSteps}
        </p>
        <h2 className="text-slate-50 font-semibold text-base mb-2">{step.title}</h2>
        <p className="text-sm text-slate-400 leading-relaxed mb-5">{step.content}</p>

        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={skip}
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            Skip tour
          </button>
          <div className="flex items-center gap-2">
            {stepIndex > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={prev}
                className="text-slate-400 hover:text-slate-100"
              >
                Back
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              onClick={next}
              className="bg-indigo-500 hover:bg-indigo-600 text-white"
            >
              {isLast ? "Got it" : "Next"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

