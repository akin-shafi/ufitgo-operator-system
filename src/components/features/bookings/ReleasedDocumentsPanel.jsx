import { AlertCircle, Download, ExternalLink, FileText, Info, Lock, ShieldCheck, User, X } from "lucide-react"
import { useEffect, useState } from "react"
import { apiClient } from "../../../api/client"
import { Spinner } from "../../common/Spinner"

const DOC_LABELS = {
  PASSPORT: "Passport data page",
  PASSPORT_PHOTO: "Passport photo",
  VISA: "Visa",
  HEALTH_CARD: "Health card",
  RELATIONSHIP_PROOF: "Proof of relationship",
  SHAHADAH: "Shahadah certificate",
}

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"

const titleCase = (value) => (value ? String(value).toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()) : "")

function HelpModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-5" role="dialog" aria-modal="true" aria-label="How traveller documents work" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl bg-bg p-6 shadow-xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">How this works</p>
            <h2 className="mt-1 text-xl font-bold">Traveller documents from UfitGo</h2>
          </div>
          <button type="button" aria-label="Close" onClick={onClose} className="text-fg/60"><X size={20} /></button>
        </div>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-fg/80">
          <li>UfitGo collects each traveller&apos;s passport and photo, checks them, and releases them to you for visa processing.</li>
          <li>Names, gender, date of birth and nationality were copied by UfitGo staff from the passport data page. Always confirm against the passport image before submitting a visa.</li>
          <li><strong>Open</strong> shows a file in a new tab. <strong>Download</strong> saves it to your device, named after the traveller (e.g. YUSUF-AMINA-passport.jpg), ready to upload to the visa portal.</li>
          <li>Each link lasts 5 minutes. Click again if it expires.</li>
          <li>Every view and download is recorded with your login email, and UfitGo can see this record.</li>
          <li>Downloaded files contain personal data. Store them securely, use them only for this traveller&apos;s visa, and delete them once the visa is issued.</li>
          <li>If a document changes, UfitGo sends an update by email. Always use the latest version shown here.</li>
          <li>Access ends 60 days after departure, or earlier if UfitGo withdraws it. Contact UfitGo if you need more time.</li>
        </ul>
      </div>
    </div>
  )
}

/** Travellers and their documents that UfitGo released to this operator for this booking. */
export function ReleasedDocumentsPanel({ bookingId }) {
  const [data, setData] = useState(null)
  const [state, setState] = useState("loading")
  const [message, setMessage] = useState("")
  const [opening, setOpening] = useState(null)
  const [openError, setOpenError] = useState(null)
  const [helpOpen, setHelpOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    apiClient
      .get(`/operator/document-releases/${bookingId}`)
      .then((response) => {
        if (cancelled) return
        setData(response?.data || response)
        setState("ready")
      })
      .catch((error) => {
        if (cancelled) return
        setMessage(error?.message || "")
        setState(error?.status === 403 || error?.status === 404 ? "not_released" : "error")
      })
    return () => {
      cancelled = true
    }
  }, [bookingId])

  const downloadDocument = async (documentId) => {
    setOpening(`${documentId}:download`)
    setOpenError(null)
    try {
      const response = await apiClient.post(`/operator/document-releases/${bookingId}/documents/${documentId}/open?mode=download`)
      const url = (response?.data || response)?.url
      if (!url) throw new Error("Unable to download document")
      // The signed link tells the browser to save the file, so the current page stays open
      const link = document.createElement("a")
      link.href = url
      link.rel = "noopener"
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error) {
      setOpenError(error?.message || "Unable to download document. Please try again.")
    } finally {
      setOpening(null)
    }
  }

  const openDocument = async (documentId) => {
    setOpening(documentId)
    setOpenError(null)
    // Open the tab synchronously so pop-up blockers allow it, then point it at the signed link
    const tab = window.open("", "_blank")
    try {
      const response = await apiClient.post(`/operator/document-releases/${bookingId}/documents/${documentId}/open`)
      const url = (response?.data || response)?.url
      if (!url) throw new Error("Unable to open document")
      if (tab) {
        tab.opener = null
        tab.location.href = url
      } else {
        window.location.assign(url)
      }
    } catch (error) {
      if (tab) tab.close()
      setOpenError(error?.message || "Unable to open document. Please try again.")
    } finally {
      setOpening(null)
    }
  }

  const header = (
    <div className="flex items-center justify-between gap-3">
      <h2 className="flex items-center gap-2 text-lg font-bold"><FileText className="size-5 text-primary" /> Travellers &amp; documents</h2>
      <button type="button" onClick={() => setHelpOpen(true)} aria-label="How this works" className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
        <Info size={16} /> How this works
      </button>
    </div>
  )

  return (
    <section className="card">
      {header}
      {helpOpen && <HelpModal onClose={() => setHelpOpen(false)} />}

      {state === "loading" && <div className="mt-5 flex justify-center"><Spinner /></div>}

      {state === "not_released" && (
        <div className="mt-5 flex items-start gap-3 rounded-lg border border-border bg-fg/5 p-4 text-sm">
          <Lock className="mt-0.5 size-5 shrink-0 text-fg/50" />
          <div>
            <p className="font-semibold">{/ended/i.test(message) ? "Access to these documents has ended" : "Documents not released yet"}</p>
            <p className="mt-1 text-fg/70">
              {/ended/i.test(message)
                ? "The access period for this booking is over. Contact UfitGo if you still need the documents."
                : "UfitGo is collecting and checking the travellers' passports. We'll email your document contacts as soon as they're ready for visa processing."}
            </p>
          </div>
        </div>
      )}

      {state === "error" && (
        <div className="mt-5 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="mt-0.5 size-5 shrink-0" />
          <p>{message || "Documents are temporarily unavailable. Please refresh in a moment."}</p>
        </div>
      )}

      {state === "ready" && data && (
        <>
          <div className="mt-5 flex items-start gap-3 rounded-lg border border-primary/30 bg-primary/5 p-4 text-sm">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" />
            <p className="text-fg/80">
              Released by UfitGo for visa processing{data.lastSentAt ? `, last updated ${formatDate(data.lastSentAt)}` : ""}. Access until <strong>{formatDate(data.accessUntil)}</strong>. Files open or download through secure 5-minute links, and every view and download is recorded.
            </p>
          </div>

          {openError && <p className="mt-3 text-sm font-semibold text-red-600">{openError}</p>}

          <div className="mt-5 space-y-4">
            {(data.travelers || []).map((traveler) => (
              <div key={traveler.travelerId} className="rounded-xl border border-border p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="flex items-center gap-2 font-bold"><User className="size-4 text-primary" /> {traveler.fullName}</p>
                    <p className="mt-0.5 text-xs text-fg/60">{traveler.relationship || "Co-traveller"}</p>
                  </div>
                  {traveler.visa && <span className="rounded-full bg-fg/5 px-2.5 py-0.5 text-xs font-semibold">Visa: {titleCase(traveler.visa.replaceAll("_", " "))}</span>}
                </div>
                <dl className="mt-3 grid gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
                  <div><dt className="text-xs text-fg/50">Surname</dt><dd className="font-semibold">{traveler.lastName || "—"}</dd></div>
                  <div><dt className="text-xs text-fg/50">Given names</dt><dd className="font-semibold">{[traveler.firstName, traveler.middleName].filter(Boolean).join(" ") || "—"}</dd></div>
                  <div><dt className="text-xs text-fg/50">Gender</dt><dd className="font-semibold">{titleCase(traveler.gender) || "—"}</dd></div>
                  <div><dt className="text-xs text-fg/50">Date of birth</dt><dd className="font-semibold">{formatDate(traveler.dateOfBirth)}</dd></div>
                  <div><dt className="text-xs text-fg/50">Nationality</dt><dd className="font-semibold">{traveler.nationality || "—"}</dd></div>
                </dl>
                <div className="mt-4 space-y-2">
                  {(traveler.documents || []).length === 0 && <p className="text-sm text-fg/60">No files for this traveller yet. UfitGo will send an update when they arrive.</p>}
                  {(traveler.documents || []).map((doc) => (
                    <div key={doc.documentId} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-fg/5 px-3 py-2 text-sm">
                      <div>
                        <p className="font-semibold">{DOC_LABELS[doc.type] || titleCase(String(doc.type).replaceAll("_", " "))}</p>
                        <p className="text-xs text-fg/60">
                          {[doc.documentNumber ? `No. ${doc.documentNumber}` : null, doc.expiryDate ? `Expires ${formatDate(doc.expiryDate)}` : null, doc.status === "VERIFIED" ? "Checked by UfitGo" : doc.stale ? "Expired" : "Not yet checked by UfitGo"].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => void openDocument(doc.documentId)}
                          disabled={opening !== null}
                          className="inline-flex items-center gap-1 rounded-lg border border-primary px-3 py-1.5 text-xs font-semibold text-primary disabled:opacity-50"
                        >
                          {opening === doc.documentId ? "Opening…" : <>Open <ExternalLink size={12} /></>}
                        </button>
                        <button
                          type="button"
                          onClick={() => void downloadDocument(doc.documentId)}
                          disabled={opening !== null}
                          className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                        >
                          {opening === `${doc.documentId}:download` ? "Preparing…" : <>Download <Download size={12} /></>}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  )
}
