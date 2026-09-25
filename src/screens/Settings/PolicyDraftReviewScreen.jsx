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
  const [requestingReview, setRequestingReview] = useState(false)
  const [conflictForm, setConflictForm] = useState(null)
  const [approval, setApproval] = useState({ authorityConfirmed: false, legalAcknowledged: false, signatoryName: "" })
  const [approving, setApproving] = useState(false)

  async function loadDraft() {
    setError("")
    try {
      const response = await apiClient.get(ENDPOINTS.POLICY_DRAFTS.GET(id))
      const current = response?.data?.draft
      if (!current) throw new Error("Policy draft was not found.")
      setDraft({ ...current, access: response?.data?.access, approvals: response?.data?.approvals || [], approvalSignatory: response?.data?.approvalSignatory })
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
      if (requestError.status === 409) {
        setConflictForm(form)
        setError("This draft changed while you were editing. Reload the current revision, then reapply your saved changes if appropriate.")
      } else {
        setError(requestError.message || "Unable to save changes.")
      }
    } finally {
      setSaving(false)
    }
  }

  async function requestReview() {
    if (!draft) return
    setRequestingReview(true)
    setError("")
    try {
      const response = await apiClient.post(ENDPOINTS.POLICY_DRAFTS.REQUEST_REVIEW(id))
      setDraft((current) => ({ ...current, ...response.data }))
      setMessage("Policy review requested. UfitGo will review this revision.")
    } catch (requestError) {
      setError(requestError.message || "Unable to request review.")
    } finally { setRequestingReview(false) }
  }

  async function approvePolicy() {
    if (!draft) return
    setApproving(true)
    setError("")
    setMessage("")
    try {
      const response = await apiClient.post(ENDPOINTS.POLICY_DRAFTS.APPROVE(id), { ...approval, expectedRevision: draft.revision })
      setDraft((current) => ({ ...current, ...response.data.draft, approvals: [response.data.approval, ...(current.approvals || [])] }))
      setMessage("Your approval has been permanently recorded against this exact policy revision.")
    } catch (requestError) {
      setError(requestError.message || "Unable to record policy approval.")
    } finally { setApproving(false) }
  }

  function reapplyConflictChanges() {
    if (!conflictForm) return
    setForm(conflictForm)
    setConflictForm(null)
    setError("")
    setMessage("Your unsaved changes have been restored. Review the current revision and save when ready.")
  }

  return <DashboardLayout title="Review policy">
    <div className="mx-auto max-w-3xl">
      <Link to="/policy-drafts" className="inline-flex min-h-11 items-center text-sm font-medium text-primary hover:underline">Back to policy reviews</Link>
      {error && <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"><p>{error}</p><div className="mt-2 flex flex-wrap gap-4"><button type="button" onClick={() => void loadDraft()} className="min-h-11 font-semibold underline">Reload current draft</button>{conflictForm && <button type="button" onClick={reapplyConflictChanges} className="min-h-11 font-semibold underline">Reapply my changes</button>}</div></div>}
      {draft && <form onSubmit={save} className="mt-5 space-y-5 rounded-lg border border-border bg-card p-4 sm:p-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Revision {draft.revision}</p>
          <h2 className="mt-1 text-xl font-bold text-fg">Review cancellation and refund policy</h2>
          <p className="mt-2 text-sm leading-6 text-fg/70">{draft.access?.permission === "view" ? "You have view-only access to this policy." : "Edit the draft carefully. Every saved change is recorded for UfitGo's final review."}</p>
        </div>
        <label className="block text-sm font-semibold text-fg">Policy title<input required readOnly={draft.access?.permission === "view"} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className="mt-2 h-12 w-full rounded-lg border border-border bg-bg px-3 text-base font-normal read-only:opacity-75" /></label>
        <div className="text-sm font-semibold text-fg">Policy text<PolicyRichTextEditor value={form.content} contentFormat={form.contentFormat} editable={draft.access?.permission !== "view"} onChange={(content) => setForm((current) => ({ ...current, content, contentFormat: "rich_text" }))} /></div>
        {draft.access?.permission !== "view" && <label className="block text-sm font-semibold text-fg">What changed?<input required value={form.changeSummary} onChange={(event) => setForm({ ...form, changeSummary: event.target.value })} placeholder="For example: clarified flight refund deductions" className="mt-2 h-12 w-full rounded-lg border border-border bg-bg px-3 text-base font-normal" /></label>}
        {draft.approvalSignatory && draft.status !== "operator_approved" && <section className="space-y-4 border-t border-border pt-5"><div><p className="text-xs font-semibold uppercase tracking-wide text-primary">Final approval</p><h3 className="mt-1 text-lg font-bold text-fg">Approve this policy revision</h3><p className="mt-2 text-sm leading-6 text-fg/70">Approval permanently records revision {draft.revision}. The current policy wording above is the exact content you are approving.</p></div><p className="rounded-lg bg-muted p-3 text-sm text-fg">Verified signatory: <strong>{draft.approvalSignatory.fullName}</strong>, {draft.approvalSignatory.role}</p><label className="flex gap-3 text-sm leading-6 text-fg"><input type="checkbox" checked={approval.authorityConfirmed} onChange={(event) => setApproval((current) => ({ ...current, authorityConfirmed: event.target.checked }))} className="mt-1 size-4" />I am authorised to approve this policy on behalf of this operator.</label><label className="flex gap-3 text-sm leading-6 text-fg"><input type="checkbox" checked={approval.legalAcknowledged} onChange={(event) => setApproval((current) => ({ ...current, legalAcknowledged: event.target.checked }))} className="mt-1 size-4" />I understand this legal cancellation and refund policy approval will be permanently recorded against this exact revision.</label><label className="block text-sm font-semibold text-fg">Type your full legal name<input required value={approval.signatoryName} onChange={(event) => setApproval((current) => ({ ...current, signatoryName: event.target.value }))} placeholder={draft.approvalSignatory.fullName} className="mt-2 h-12 w-full rounded-lg border border-border bg-bg px-3 text-base font-normal" /></label><button type="button" disabled={approving || !approval.authorityConfirmed || !approval.legalAcknowledged || !approval.signatoryName} onClick={() => void approvePolicy()} className="min-h-12 w-full rounded-lg bg-primary px-4 text-base font-semibold text-white disabled:opacity-60">{approving ? "Recording approval..." : "Approve policy revision"}</button></section>}
        {draft.status === "operator_approved" && <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">This policy revision is approved and awaiting UfitGo review. Any content edit will invalidate this approval.</p>}
        {message && <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p>}
        {draft.access?.permission !== "view" && <div className="sticky bottom-4 grid gap-2 bg-card pt-2 sm:grid-cols-2"><button disabled={saving} className="min-h-12 rounded-lg border border-primary px-4 text-base font-semibold text-primary disabled:opacity-60">{saving ? "Saving..." : "Save policy changes"}</button><button type="button" disabled={requestingReview} onClick={() => void requestReview()} className="min-h-12 rounded-lg bg-primary px-4 text-base font-semibold text-white disabled:opacity-60">{requestingReview ? "Requesting..." : "Request review"}</button></div>}
      </form>}
    </div>
  </DashboardLayout>
}
