import { useState } from "react"

export function Citation({ number, sourceText }) {
  const [showTooltip, setShowTooltip] = useState(false)

  return (
    <span className="relative inline-block">
      <sup
        className="cursor-pointer text-indigo-300 font-semibold px-0.5 hover:text-indigo-200 hover:underline transition-all duration-200"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        [{number}]
      </sup>
      {showTooltip && (
        <span className="absolute bottom-full left-0 mb-1 w-64 p-2 bg-slate-800 border border-slate-700 text-slate-100 text-xs rounded-lg shadow-lg z-10">
          {sourceText.slice(0, 150)}...
        </span>
      )}
    </span>
  )
}