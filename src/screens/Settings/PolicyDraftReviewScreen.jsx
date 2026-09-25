import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { DashboardLayout } from "../../components/layout/DashboardLayout"
import { PolicyRichTextEditor } from "../../components/common/PolicyRichTextEditor"
import apiClient from "../../api/client"
import { ENDPOINTS } from "../../api/endpoints"

export default function PolicyDraftReviewScreen() {
  const { id } = useParams()
  const [draft, setDraft] = useState(null)
  const [form, setForm] = useState({ title: "", content: "", contentFormat: "plain_text", changeSummary: "" })
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")

  async function loadDraft() {
    setError("")
    try {
      const response = await apiClient.get(ENDPOINTS.POLICY_DRAFTS.GET(id))
      const current = response?.data?.draft
      if (!current) throw new Error("Policy draft was not found.")
      setDraft(current)
      setForm({ title: current.title, content: current.content, contentFormat: current.contentFormat || "plain_text", changeSummary: "" })
    } catch (requestError) {
      setError(requestError.message || "Unable to load policy draft.")
    }
  }

  useEffect(() => { void loadDraft() }, [id])

  async function save(event) {
    event.preventDefault()
    if (!draft) return
    setSaving(true)
    setMessage("")
    setError("")
    try {
      const response = await apiClient.patch(ENDPOINTS.POLICY_DRAFTS.UPDATE(id), { ...form, expectedRevision: draft.revision })
      const updated = response?.data
      setDraft(updated)
      setForm((current) => ({ ...current, contentFormat: updated.contentFormat || current.contentFormat, changeSummary: "" }))
      setMessage("Your changes were saved and sent to UfitGo for review.")
    } catch (requestError) {
      setError(requestError.status === 409 ? "This draft changed while you were editing. Reload it before saving again." : requestError.message || "Unable to save changes.")
    } finally {
      setSaving(false)
    }
  }

  return <DashboardLayout title="Review policy">
    <div className="mx-auto max-w-3xl">
      <Link to="/policy-drafts" className="inline-flex min-h-11 items-center text-sm font-medium text-primary hover:underline">Back to policy reviews</Link>
      {error && <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"><p>{error}</p><button type="button" onClick={() => void loadDraft()} className="mt-2 min-h-11 font-semibold underline">Reload draft</button></div>}
      {draft && <form onSubmit={save} className="mt-5 space-y-5 rounded-lg border border-border bg-card p-4 sm:p-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Revision {draft.revision}</p>
          <h2 className="mt-1 text-xl font-bold text-fg">Review cancellation and refund policy</h2>
          <p className="mt-2 text-sm leading-6 text-fg/70">Edit the draft carefully. Every saved change is recorded for UfitGo's final review.</p>
        </div>
        <label className="block text-sm font-semibold text-fg">Policy title<input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className="mt-2 h-12 w-full rounded-lg border border-border bg-bg px-3 text-base font-normal" /></label>
        <div className="text-sm font-semibold text-fg">Policy text<PolicyRichTextEditor value={form.content} contentFormat={form.contentFormat} onChange={(content) => setForm((current) => ({ ...current, content, contentFormat: "rich_text" }))} /></div>
        <label className="block text-sm font-semibold text-fg">What changed?<input value={form.changeSummary} onChange={(event) => setForm({ ...form, changeSummary: event.target.value })} placeholder="For example: clarified flight refund deductions" className="mt-2 h-12 w-full rounded-lg border border-border bg-bg px-3 text-base font-normal" /></label>
        {message && <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p>}
        <button disabled={saving} className="sticky bottom-4 min-h-12 w-full rounded-lg bg-primary px-4 text-base font-semibold text-white disabled:opacity-60">{saving ? "Saving..." : "Save policy changes"}</button>
      </form>}
    </div>
  </DashboardLayout>
}
