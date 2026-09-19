export const Button = ({ children, variant = "primary", className = "", ...props }) => {
  const baseClass = variant === "primary" ? "btn-primary" : variant === "danger" ? "btn-danger" : "btn-secondary"

  return (
    <button className={`${baseClass} ${className}`} {...props}>
      {children}
    </button>
  )
}
