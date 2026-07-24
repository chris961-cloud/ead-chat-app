import { RefreshCw, ChevronLeft, ChevronRight, ThumbsUp, ThumbsDown } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ResponseActions({
  versionCount,
  activeVersion,
  feedback,
  onRegenerate,
  onPrevVersion,
  onNextVersion,
  onThumbsUp,
  onThumbsDown,
  isLoading,
}) {
  const showVersionNav = versionCount > 1
  const rating = feedback?.rating

  return (
    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-700">
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={onThumbsUp}
          disabled={isLoading}
          className={
            rating === "up"
              ? "text-emerald-400 bg-emerald-950/50 hover:bg-emerald-950/70 hover:text-emerald-300"
              : "text-slate-400 hover:text-slate-100 hover:bg-slate-700/50"
          }
          title="Helpful"
        >
          <ThumbsUp className="size-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={onThumbsDown}
          disabled={isLoading}
          className={
            rating === "down"
              ? "text-red-400 bg-red-950/50 hover:bg-red-950/70 hover:text-red-300"
              : "text-slate-400 hover:text-slate-100 hover:bg-slate-700/50"
          }
          title="Not helpful"
        >
          <ThumbsDown className="size-3.5" />
        </Button>
      </div>

      <Button
        type="button"
        variant="ghost"
        size="xs"
        onClick={onRegenerate}
        disabled={isLoading}
        className="text-slate-400 hover:text-slate-100 hover:bg-slate-700/50"
        title="Regenerate response"
      >
        <RefreshCw className="size-3.5" />
        Regenerate
      </Button>

      {showVersionNav && (
        <div className="flex items-center gap-1 ml-auto text-xs text-slate-400">
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={onPrevVersion}
            disabled={activeVersion === 0 || isLoading}
            className="text-slate-400 hover:text-slate-100 hover:bg-slate-700/50"
            title="Previous version"
          >
            <ChevronLeft className="size-3.5" />
          </Button>
          <span className="tabular-nums min-w-[3rem] text-center">
            {activeVersion + 1} / {versionCount}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={onNextVersion}
            disabled={activeVersion >= versionCount - 1 || isLoading}
            className="text-slate-400 hover:text-slate-100 hover:bg-slate-700/50"
            title="Next version"
          >
            <ChevronRight className="size-3.5" />
          </Button>
        </div>
      )}
    </div>
  )
}
