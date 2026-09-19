import { useNavigate } from "react-router-dom"
import { ArrowUpRight } from "lucide-react"

export const StatCard = ({ title, value, subtitle, icon, trend, to }) => {
  const navigate = useNavigate()

  return (
    <div
      onClick={to ? () => navigate(to) : undefined}
      onKeyDown={to ? (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); navigate(to) } } : undefined}
      role={to ? "link" : undefined}
      tabIndex={to ? 0 : undefined}
      className={`card relative ${to ? "group cursor-pointer transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/30" : ""}`}
    >
      <div className="flex items-start justify-between">
        <div>
          {/* Title */}
          <p className="text-sm font-medium text-fg/70">
            {title}
          </p>

          {/* Value */}
          <p className="text-3xl font-bold text-fg mt-2">
            {value}
          </p>

          {/* Subtitle */}
          {subtitle && (
            <p className="text-sm text-fg/60 mt-1">
              {subtitle}
            </p>
          )}
        </div>

        {/* Icon */}
        {icon && (
          <div className="text-4xl">
            {icon}
          </div>
        )}
      </div>

      {to && <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-primary opacity-70 transition-opacity group-hover:opacity-100">View details <ArrowUpRight className="size-3.5" /></div>}

      {/* Trend */}
      {trend && (
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-sm text-fg/70">
            {trend}
          </p>
        </div>
      )}
    </div>

  )
}
