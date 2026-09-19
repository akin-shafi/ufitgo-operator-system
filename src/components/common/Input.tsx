// Input.tsx (or src/components/common/Input.tsx)
import { forwardRef } from "react"

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, ...props }, ref) => {
    return (
      <div className="mb-4">
        {label && (
          <label className="mb-2 block text-sm font-semibold text-fg/75">
            {label}
          </label>
        )}
        <input
          className="input-field"
          ref={ref}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-danger">{error}</p>}
      </div>
    )
  }
)

Input.displayName = "Input"