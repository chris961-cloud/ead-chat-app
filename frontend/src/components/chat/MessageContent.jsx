import { useState } from "react"
import ReactMarkdown from "react-markdown"
import { Citation } from "./Citation"

export function MessageContent({ content, sources }) {
  const [showAccordion, setShowAccordion] = useState(false)

  const parts = content.split(/(\[\d+\])/g)

  return (
    <div>
      <div className="prose prose-sm prose-invert max-w-none">
        {parts.map((part, i) => {
          const match = part.match(/^\[(\d+)\]$/)
          if (match && sources) {
            const num = parseInt(match[1])
            const sourceText = sources[num - 1]
            if (sourceText) {
              return <Citation key={i} number={num} sourceText={sourceText} />
            }
          }
          return <ReactMarkdown key={i}>{part}</ReactMarkdown>
        })}
      </div>

      {sources && sources.length > 0 && (
        <div className="mt-2 border-t border-slate-700 pt-2">
          <button
            onClick={() => setShowAccordion(!showAccordion)}
            className="text-xs text-slate-400 hover:text-slate-100 transition-all duration-200"
          >
            {showAccordion ? "▼" : "▶"} Sources ({sources.length})
          </button>
          {showAccordion && (
            <div className="mt-1 space-y-1">
              {sources.map((src, i) => (
                <div
                  key={i}
                  className="text-xs text-indigo-300 bg-indigo-950/50 border border-indigo-800 p-2 rounded transition-all duration-200"
                >
                  <span className="font-semibold">[{i + 1}]</span> {src.slice(0, 200)}...
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}