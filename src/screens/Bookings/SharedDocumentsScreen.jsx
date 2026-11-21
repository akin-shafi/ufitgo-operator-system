import { ChevronRight, FileText, Info, Lock } from "lucide-react"
import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { DashboardLayout } from "../../components/layout/DashboardLayout"
import { Spinner } from "../../components/common/Spinner"
import { apiClient } from "../../api/client"

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"

// Bookings whose travellers' documents UfitGo has released to this operator
const SharedDocumentsScreen = () => {
  const [releases, setReleases] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    apiClient
      .get("/operator/document-releases")
      .then((response) => {
        const list = response?.data || response
        setReleases(Array.isArray(list) ? list : [])
      })
      .catch((requestError) => setError(requestError?.message || "Unable to load documents"))
      .finally(() => setLoading(false))
  }, [])

  return (
    <DashboardLayout title="Traveller Documents">
      <div className="mb-6">
        <h1 className="mb-2 text-2xl font-bold text-fg">Traveller documents</h1>
        <p className="text-fg/60">Bookings where UfitGo has released travellers&apos; passports and photos to you for visa processing.</p>
      </div>

      <div className="mb-6 flex items-start gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm text-fg/80">
        <Info className="mt-0.5 size-5 shrink-0 text-primary" />
        <div className="space-y-1">
          <p><strong>How this works:</strong> UfitGo collects and checks each traveller&apos;s documents, then releases them here. Your document contacts get an email each time. The email never contains the files.</p>
          <p>Open a booking to see each traveller&apos;s details and files. Files open through secure 5-minute links, and every view is recorded. Access ends 60 days after departure.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center"><Spinner /></div>
      ) : error ? (
        <div className="card p-6 text-center text-red-600">{error}</div>
      ) : releases.length === 0 ? (
        <div className="card flex flex-col items-center p-10 text-center">
          <Lock className="mb-3 size-8 text-fg/40" />
          <p className="font-semibold">No documents released yet</p>
          <p className="mt-1 max-w-md text-sm text-fg/60">When UfitGo releases travellers&apos; documents for one of your bookings, it will appear here and your document contacts will be emailed.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {releases.map((release) => (
            <Link
              key={release.bookingId}
              to={`/bookings/${release.bookingId}`}
              className="card flex items-center justify-between gap-4 p-4 transition hover:border-primary"
            >
              <div className="flex items-start gap-3">
                <FileText className="mt-0.5 size-5 text-primary" />
                <div>
                  <p className="font-bold">{release.bookingRef || `Booking #${release.bookingId}`}</p>
                  <p className="text-sm text-fg/60">
                    {[release.packageTitle, `${release.travelerCount} traveller${release.travelerCount === 1 ? "" : "s"}`, release.departureDate ? `Departs ${formatDate(release.departureDate)}` : null].filter(Boolean).join(" · ")}
                  </p>
                  <p className="mt-1 text-xs text-fg/50">Updated {formatDate(release.lastSentAt)} · Access until {formatDate(release.accessUntil)}</p>
                </div>
              </div>
              <ChevronRight className="size-5 shrink-0 text-fg/40" />
            </Link>
          ))}
        </div>
      )}
    </DashboardLayout>
  )
}

export default SharedDocumentsScreen
