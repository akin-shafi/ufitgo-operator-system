import { useEffect, useMemo, useState } from "react"
import { ArrowLeft, CalendarDays, CheckCircle2, Clock3, Users } from "lucide-react"
import { useNavigate, useParams } from "react-router-dom"
import { DashboardLayout } from "../../components/layout/DashboardLayout"
import { Spinner } from "../../components/common/Spinner"
import { packagesService } from "../../api/services/packages.service"
import { bookingsService } from "../../api/services/bookings.service"

const money = (value) => `₦${Number(value || 0).toLocaleString("en-NG")}`
const statusTone = { pending: "bg-yellow-100 text-yellow-800", confirmed: "bg-green-100 text-green-800", completed: "bg-blue-100 text-blue-800", cancelled: "bg-red-100 text-red-800", fully_paid: "bg-emerald-100 text-emerald-800", deposit_paid: "bg-orange-100 text-orange-800" }

export default function PackageDetailsScreen() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [pkg, setPkg] = useState(null)
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState("all")

  useEffect(() => {
    Promise.all([packagesService.getById(id), bookingsService.getByPackage(id)])
      .then(([packageResponse, bookingResponse]) => {
        setPkg(packageResponse?.data || packageResponse)
        setBookings(Array.isArray(bookingResponse?.data) ? bookingResponse.data : bookingResponse || [])
      })
      .catch((requestError) => setError(requestError.message || "Unable to load package bookings"))
      .finally(() => setLoading(false))
  }, [id])

  const visibleBookings = useMemo(() => filter === "all" ? bookings : bookings.filter((booking) => booking.status === filter), [bookings, filter])
  const pending = bookings.filter((booking) => booking.status === "pending").length
  const paid = bookings.filter((booking) => booking.paymentBreakdown?.totalOutstanding === 0 || booking.status === "fully_paid").length

  if (loading) return <DashboardLayout title="Package Bookings"><div className="flex h-64 items-center justify-center"><Spinner /></div></DashboardLayout>
  if (error) return <DashboardLayout title="Package Bookings"><div className="card p-8 text-center text-red-600">{error}</div></DashboardLayout>

  return <DashboardLayout title="Package Bookings"><div className="space-y-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><button onClick={() => navigate("/packages")} className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-primary"><ArrowLeft size={16} /> Back to packages</button><p className="text-sm font-semibold uppercase tracking-wider text-primary">Package workspace</p><h1 className="mt-2 text-3xl font-bold text-gray-900">{pkg?.title || "Package bookings"}</h1><p className="mt-2 text-sm text-gray-600">Manage applicants, payment stages, and booking readiness in this package context.</p></div><button onClick={() => navigate(`/packages/${id}/edit`)} className="btn-secondary">Edit package</button></div>
  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Summary icon={Users} label="Bookings" value={bookings.length} note={`${pkg?.booked || bookings.length}/${pkg?.capacity || "-"} seats used`} /><Summary icon={Clock3} label="Pending review" value={pending} note="Require operator action" /><Summary icon={CheckCircle2} label="Fully paid" value={paid} note="Ready for fulfilment" /><Summary icon={CalendarDays} label="Departure" value={pkg?.departureDate ? new Date(pkg.departureDate).toLocaleDateString("en-NG", { day: "2-digit", month: "short" }) : "-"} note={pkg?.goingTo || "Package schedule"} /></div>
  <section className="card overflow-hidden p-0"><div className="flex flex-col justify-between gap-3 border-b border-border p-5 sm:flex-row sm:items-center"><div><h2 className="text-lg font-bold">Applicants and bookings</h2><p className="mt-1 text-sm text-fg/60">Select a booking to review the applicant and payment stages.</p></div><select value={filter} onChange={(event) => setFilter(event.target.value)} className="input-field w-full sm:w-44"><option value="all">All statuses</option><option value="pending">Pending review</option><option value="confirmed">Confirmed</option><option value="deposit_paid">Payment in progress</option><option value="fully_paid">Fully paid</option></select></div>{visibleBookings.length === 0 ? <p className="p-12 text-center text-fg/60">No bookings match this view.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-bg text-xs uppercase tracking-wider text-fg/60"><tr><th className="px-5 py-3">Applicant</th><th className="px-5 py-3">Booking</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Payment progress</th><th className="px-5 py-3">Action</th></tr></thead><tbody className="divide-y divide-border">{visibleBookings.map((booking) => <tr key={booking.id} onClick={() => navigate(`/bookings/${booking.id}`)} className="cursor-pointer hover:bg-bg/60"><td className="px-5 py-4"><p className="font-semibold text-gray-900">{booking.pilgrimName || "Applicant"}</p><p className="mt-1 text-xs text-fg/60">{booking.pilgrimEmail || booking.pilgrimPhone || "No contact details"}</p></td><td className="px-5 py-4"><p className="font-medium">{booking.bookingRef || `#${booking.id}`}</p><p className="mt-1 text-xs text-fg/60">{booking.numberOfPilgrims || 1} pilgrim{Number(booking.numberOfPilgrims || 1) === 1 ? "" : "s"}</p></td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusTone[booking.status] || "bg-gray-100 text-gray-700"}`}>{String(booking.status || "pending").replaceAll("_", " ")}</span></td><td className="px-5 py-4"><p className="font-semibold">{money(booking.paymentBreakdown?.totalPaid ?? booking.amountPaid)} / {money(booking.paymentBreakdown?.totalAmountPayable ?? booking.totalAmount)}</p><p className="mt-1 text-xs text-fg/60">{booking.paymentBreakdown?.registration?.status || "Payment pending"} · {booking.paymentBreakdown?.finalBalance?.status || "-"}</p></td><td className="px-5 py-4 text-primary font-semibold">Review</td></tr>)}</tbody></table></div>}</section></div></DashboardLayout>
}

function Summary({ icon: Icon, label, value, note }) { return <div className="card p-5"><Icon className="size-5 text-primary" /><p className="mt-4 text-xs font-semibold uppercase tracking-wider text-fg/60">{label}</p><p className="mt-1 text-2xl font-bold">{value}</p><p className="mt-1 text-xs text-fg/60">{note}</p></div> }
