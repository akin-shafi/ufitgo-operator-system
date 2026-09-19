import { ArrowLeft, CheckCircle2, Circle, FileText, User } from "lucide-react"
import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { DashboardLayout } from "../../components/layout/DashboardLayout"
import { Spinner } from "../../components/common/Spinner"
import { bookingsService } from "../../api/services/bookings.service"

const money = (value) => `₦${Number(value || 0).toLocaleString("en-NG")}`

function getPaymentJourney(booking) {
  const payment = booking.paymentBreakdown || {}
  const hasNormalized = payment.totalAmountPayable !== undefined || payment.totalPaid !== undefined || payment.registration || payment.initialPayment || payment.finalBalance
  const payable = Number(payment.totalAmountPayable ?? booking.totalAmountPayable ?? booking.totalAmount ?? 0)
  const paid = Number(payment.totalPaid ?? booking.totalPaid ?? booking.amountPaid ?? 0)
  const packageCost = Number(payment.packageCost ?? booking.basePackageAmount ?? booking.totalAmount ?? 0)
  const registrationAmount = Number(payment.registration?.amount ?? booking.registrationFeeAmount ?? (booking.package?.registrationFeeEnabled ? booking.package.registrationFeeAmount : 0) ?? 0)
  const registrationPaid = Number(payment.registration?.paid ?? booking.registrationAmountPaid ?? 0)
  const legacyPaid = Number(booking.amountPaid || booking.totalPaid || 0)
  const legacyCost = Number(booking.basePackageAmount || booking.totalAmount || 0)
  const hasStagePayment = Boolean(payment.initialPayment?.paid || payment.finalBalance?.paid || payment.registration?.paid)
  const packagePaid = payment.initialPayment || payment.finalBalance
    ? hasStagePayment ? Number(payment.initialPayment?.paid || 0) + Number(payment.finalBalance?.paid || 0) : legacyPaid
    : paid
  const isLegacyPackagePaid = booking.status === "fully_paid" && (!hasNormalized || (paid === 0 && legacyPaid >= legacyCost))
  const fullyPaid = isLegacyPackagePaid && registrationAmount <= registrationPaid || (payable > 0 && paid >= payable)
  const registrationDue = !fullyPaid && packageCost > 0 && packagePaid >= packageCost && registrationAmount > registrationPaid

  const policy = booking.paymentPolicy || {}
  const sourceStages = Array.isArray(booking.paymentStages) ? booking.paymentStages : [
    { key: "REGISTRATION", label: "Registration fee", amount: registrationAmount, paid: registrationPaid, enabled: registrationAmount > 0 || Boolean(payment.registration?.enabled) },
    ...(policy.mode === "INSTALLMENTS" || (!policy.mode && (payment.initialPayment || payment.finalBalance))
      ? [
          { key: "INITIAL_PAYMENT", label: "Initial payment", amount: Number(payment.initialPayment?.amount ?? packageCost), paid: Number(payment.initialPayment?.paid ?? (packagePaid >= packageCost ? packageCost : packagePaid)), enabled: Boolean(payment.initialPayment?.enabled) || packageCost > 0 },
          { key: "FINAL_PAYMENT", label: "Final balance", amount: Number(payment.finalBalance?.amount ?? 0), paid: Number(payment.finalBalance?.paid ?? 0), enabled: Boolean(payment.finalBalance?.enabled) },
        ]
      : [{ key: "FULL_PAYMENT", label: "Full package payment", amount: packageCost, paid: packagePaid, enabled: packageCost > 0 }]),
  ]
  const stages = sourceStages.map((stage) => {
    const stagePaid = isLegacyPackagePaid && stage.key !== "registration" ? stage.amount : stage.paid
    const isOverdue = stage.key === "FINAL_PAYMENT" && policy.finalPaymentStatus === "OVERDUE"
    const status = !stage.enabled ? "NOT_APPLICABLE" : isOverdue && stagePaid < stage.amount ? "OVERDUE" : stagePaid >= stage.amount && stage.amount > 0 ? "PAID" : stagePaid > 0 ? "PARTIALLY_PAID" : "DUE"
    return { ...stage, key: stage.key.toLowerCase(), paid: stagePaid, status }
  })

  return { stages, paid, payable, outstanding: Math.max(0, payable - paid), fullyPaid, registrationDue }
}

function stageTone(status) {
  if (status === "PAID") return "border-emerald-200 bg-emerald-50 text-emerald-700"
  if (status === "PARTIALLY_PAID") return "border-blue-200 bg-blue-50 text-blue-700"
  if (status === "DUE") return "border-amber-200 bg-amber-50 text-amber-700"
  if (status === "OVERDUE") return "border-red-200 bg-red-50 text-red-700"
  return "border-border bg-bg text-fg/50"
}

function PaymentJourney({ payment }) {
  return <section className="card h-fit"><div className="flex items-center justify-between gap-3"><div><h2 className="text-lg font-bold">Payment journey</h2><p className="mt-1 text-sm text-fg/60">A clear view of what has been paid and what remains.</p></div><span className={`rounded-full border px-3 py-1 text-xs font-bold ${payment.fullyPaid ? "border-emerald-200 bg-emerald-50 text-emerald-700" : payment.registrationDue ? "border-amber-200 bg-amber-50 text-amber-700" : "border-blue-200 bg-blue-50 text-blue-700"}`}>{payment.fullyPaid ? "Fully paid" : payment.registrationDue ? "Registration due" : "Payment in progress"}</span></div><div className="mt-6 space-y-3">{payment.stages.map((stage, index) => <div key={stage.key} className="relative flex gap-3">{index < payment.stages.length - 1 && <span className="absolute left-4 top-9 h-8 w-px bg-border" />}<span className={`relative z-10 grid size-8 shrink-0 place-items-center rounded-full border ${stage.status === "PAID" ? "border-emerald-300 bg-emerald-100 text-emerald-700" : stage.status === "NOT_APPLICABLE" ? "border-border bg-bg text-fg/40" : "border-amber-300 bg-amber-50 text-amber-700"}`}>{stage.status === "PAID" ? <CheckCircle2 className="size-4" /> : <Circle className="size-3" />}</span><div className={`min-w-0 flex-1 rounded-xl border p-3 ${stageTone(stage.status)}`}><div className="flex items-center justify-between gap-3"><p className="font-semibold">{stage.label}</p><span className="text-[11px] font-bold uppercase">{stage.status.replaceAll("_", " ")}</span></div>{stage.status !== "NOT_APPLICABLE" && <p className="mt-1 text-xs">{money(stage.paid)} paid · {money(Math.max(0, stage.amount - stage.paid))} remaining</p>}</div></div>)}</div><div className="mt-5 grid grid-cols-2 gap-3 border-t border-border pt-4"><Info label="Total paid" value={money(payment.paid)} /><Info label="Outstanding" value={money(payment.outstanding)} /></div></section>
}

export default function BookingDetailsScreen() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [booking, setBooking] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => { bookingsService.getById(id).then((response) => setBooking(response?.data || response)).catch((requestError) => setError(requestError.message || "Unable to load booking")) }, [id])

  if (error) return <DashboardLayout title="Booking Details"><div className="card p-8 text-center text-red-600">{error}</div></DashboardLayout>
  if (!booking) return <DashboardLayout title="Booking Details"><div className="flex h-64 items-center justify-center"><Spinner /></div></DashboardLayout>

  const payment = getPaymentJourney(booking)
  return <DashboardLayout title="Booking Details"><div className="space-y-6"><button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm font-semibold text-primary"><ArrowLeft size={16} /> Back</button><div><p className="text-sm font-semibold uppercase tracking-wider text-primary">Applicant review</p><h1 className="mt-2 text-3xl font-bold">{booking.pilgrimName || "Applicant"}</h1><p className="mt-1 text-sm text-fg/60">{booking.bookingRef || `Booking #${booking.id}`} · {booking.package?.title || booking.packageName || "Package"}</p></div><div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]"><div className="space-y-6"><section className="card"><h2 className="flex items-center gap-2 text-lg font-bold"><User className="size-5 text-primary" /> Applicant information</h2><div className="mt-5 grid gap-4 sm:grid-cols-2"><Info label="Name" value={booking.pilgrimName} /><Info label="Email" value={booking.pilgrimEmail} /><Info label="Phone" value={booking.pilgrimPhone} /><Info label="Pilgrims" value={booking.numberOfPilgrims || 1} /><Info label="NIN" value={booking.nin || "Not submitted"} /><Info label="Package" value={booking.package?.title || booking.packageName} /></div></section><section className="card"><h2 className="flex items-center gap-2 text-lg font-bold"><FileText className="size-5 text-primary" /> Documents</h2><div className="mt-5 space-y-3"><Info label="Passport" value={booking.passportUrl ? "Uploaded" : "Not uploaded"} /><Info label="NIN verification" value={booking.ninSubmitted ? "Submitted" : "Pending"} /><Info label="Shared documents" value={`${(booking.pilgrimDocuments || []).length} document(s)`} /></div></section></div><PaymentJourney payment={payment} /></div></div></DashboardLayout>
}

function Info({ label, value }) { return <div><p className="text-xs uppercase tracking-wider text-fg/50">{label}</p><p className="mt-1 font-semibold text-fg">{value || "-"}</p></div> }