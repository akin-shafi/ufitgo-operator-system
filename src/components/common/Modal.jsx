import { X } from "lucide-react"

export function Modal({ open, onClose, title, description, children, size = "md" }) {
  if (!open) return null
  const width = size === "lg" ? "max-w-2xl" : size === "sm" ? "max-w-sm" : "max-w-lg"
  return (
    <div className="ui-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className={`ui-modal ${width}`} role="dialog" aria-modal="true" aria-labelledby="ui-modal-title" onMouseDown={(event) => event.stopPropagation()}>
        <header className="ui-modal-header">
          <div className="min-w-0"><h2 id="ui-modal-title" className="ui-modal-title">{title}</h2>{description && <p className="ui-modal-description">{description}</p>}</div>
          <button type="button" aria-label="Close" onClick={onClose} className="ui-icon-button"><X className="size-5" /></button>
        </header>
        <div className="ui-modal-body">{children}</div>
      </section>
    </div>
  )
}
