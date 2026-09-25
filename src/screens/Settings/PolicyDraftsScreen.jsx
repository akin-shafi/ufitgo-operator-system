import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { DashboardLayout } from "../../components/layout/DashboardLayout"
import apiClient from "../../api/client"
import { ENDPOINTS } from "../../api/endpoints"

export default function PolicyDraftsScreen() {
  const [drafts, setDrafts] = useState([])
  const [error, setError] = useState("")

  useEffect(() => {
    apiClient.get(ENDPOINTS.POLICY_DRAFTS.LIST)
      .then((response) => setDrafts(Array.isArray(response?.data) ? response.data : []))
      .catch((requestError) => setError(requestError.message || "Unable to load policy reviews."))
  }, [])

  return <DashboardLayout title="Policy reviews"><div className="mx-auto max-w-3xl space-y-5"><div><p className="text-sm text-fg/70">Review the cancellation and refund policy shared with your organisation. Your changes are tracked before UfitGo completes its review.</p></div>{error && <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}{!error && !drafts.length && <p className="rounded-lg border border-border bg-card p-5 text-sm text-fg/70">No policy drafts have been shared with you.</p>}<div className="space-y-3">{drafts.map((draft) => <article key={draft.id} className="rounded-lg border border-border bg-card p-4"><p className="font-semibold text-fg">{draft.title}</p><p className="mt-1 text-xs text-fg/65">Revision {draft.revision} · {draft.status.replaceAll("_", " ")}</p><Link to={`/policy-drafts/${draft.id}`} className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-white">Review policy</Link></article>)}</div></div></DashboardLayout>
}