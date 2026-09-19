import { ArrowLeft, CheckCircle2, FileText, User } from "lucide-react"
import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { DashboardLayout } from "../../components/layout/DashboardLayout"
import { Spinner } from "../../components/common/Spinner"
import { bookingsService } from "../../api/services/bookings.service"

const money = (value) => `₦${Number(value || 0).toLocaleString("en-NG")}`

export default function BookingDetailsScreen() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [booking, setBooking] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => { bookingsService.getById(id).then((response) => setBooking(response?.data || response)).catch((requestError) => setError(requestError.message || "Unable to load booking")) }, [id])

  if (error) return <DashboardLayout title="Booking Details"><div className="card p-8 text-center text-red-600">{error}</div></DashboardLayout>
  if (!booking) return <DashboardLayout title="Booking Details"><div className="flex h-64 items-center justify-center"><Spinner /></div></DashboardLayout>

  const payment = booking.paymentBreakdown || {}
  const stages = [
    ["Registration Fee", payment.registration],
    ["Initial Payment", payment.initialPayment],
    ["Final Balance", payment.finalBalance],
  ].filter(([, stage]) => stage?.enabled)

  return <DashboardLayout title="Booking Details"><div className="space-y-6"><button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm font-semibold text-primary"><ArrowLeft size={16} /> Back to package</button><div><p className="text-sm font-semibold uppercase tracking-wider text-primary">Applicant review</p><h1 className="mt-2 text-3xl font-bold">{booking.pilgrimName || "Applicant"}</h1><p className="mt-1 text-sm text-fg/60">{booking.bookingRef || `Booking #${booking.id}`} · {booking.status}</p></div><div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]"><div className="space-y-6"><section className="card"><h2 className="flex items-center gap-2 text-lg font-bold"><User className="size-5 text-primary" /> Applicant information</h2><div className="mt-5 grid gap-4 sm:grid-cols-2"><Info label="Name" value={booking.pilgrimName} /><Info label="Email" value={booking.pilgrimEmail} /><Info label="Phone" value={booking.pilgrimPhone} /><Info label="Pilgrims" value={booking.numberOfPilgrims} /><Info label="NIN" value={booking.nin || "Not submitted"} /><Info label="Package" value={booking.package?.title || booking.packageName} /></div></section><section className="card"><h2 className="flex items-center gap-2 text-lg font-bold"><FileText className="size-5 text-primary" /> Documents</h2><div className="mt-5 space-y-3"><Info label="Passport" value={booking.passportUrl ? "Uploaded" : "Not uploaded"} /><Info label="NIN verification" value={booking.ninSubmitted ? "Submitted" : "Pending"} /><Info label="Shared documents" value={`${(booking.pilgrimDocuments || []).length} document(s)`} /></div></section></div><section className="card h-fit"><h2 className="flex items-center gap-2 text-lg font-bold"><CheckCircle2 className="size-5 text-primary" /> Payment summary</h2><div className="mt-5 space-y-4"><Info label="Package cost" value={money(payment.packageCost ?? booking.basePackageAmount ?? booking.totalAmount)} /><Info label="Registration fee" value={money(payment.registrationFee ?? booking.registrationFeeAmount)} /><Info label="Total payable" value={money(payment.totalAmountPayable ?? booking.totalAmount)} /><div className="border-t border-border pt-4"><Info label="Total paid" value={money(payment.totalPaid ?? booking.amountPaid)} /><Info label="Outstanding" value={money(payment.totalOutstanding ?? Number(booking.totalAmount || 0) - Number(booking.amountPaid || 0))} /></div>{stages.map(([label, stage]) => <div key={label} className="rounded-lg bg-bg p-3"><div className="flex items-center justify-between"><span className="text-sm font-semibold">{label}</span><span className="text-xs font-bold uppercase text-primary">{stage.status.replaceAll("_", " ")}</span></div><p className="mt-1 text-xs text-fg/60">{money(stage.paid)} paid · {money(stage.balance)} remaining</p></div>)}</div></section></div></div></DashboardLayout>
}

function Info({ label, value }) { return <div><p className="text-xs uppercase tracking-wider text-fg/50">{label}</p><p className="mt-1 font-semibold text-fg">{value || "-"}</p></div> }
