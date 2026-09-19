export const Card = ({ title, children, className = "" }) => {
  return (
    <div className={`card ${className}`}>
      {title && <h3 className="mb-4 text-lg font-semibold text-fg">{title}</h3>}
      {children}
    </div>
  )
}
