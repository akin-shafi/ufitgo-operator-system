import { useEffect, useState } from "react"
import { DashboardLayout } from "../../components/layout/DashboardLayout"
import { apiClient } from "../../api/client"
import { authService } from "../../api/services/auth.service"

const SharedDocumentsScreen = () => {
  const [shares, setShares] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewingDocs, setViewingDocs] = useState(null)
  const [viewLoading, setViewLoading] = useState(false)

  const operator = authService.getStoredOperator()
  const operatorId = operator?.id

  useEffect(() => {
    if (!operatorId) return
    apiClient
      .get(`/operator/document-shares?operatorId=${operatorId}`)
      .then((data) => setShares(Array.isArray(data) ? data : []))
      .catch(() => setShares([]))
      .finally(() => setLoading(false))
  }, [operatorId])

  const handleView = async (share) => {
    setViewLoading(true)
    setViewingDocs({ pilgrimName: share.data?.pilgrimName, documents: [] })
    try {
      const res = await fetch(share.data?.viewUrl)
      const json = await res.json()
      setViewingDocs({ pilgrimName: share.data?.pilgrimName, documents: json?.data || [] })
    } catch {
      setViewingDocs({ pilgrimName: share.data?.pilgrimName, documents: [], error: true })
    } finally {
      setViewLoading(false)
    }
  }

  return (
    <DashboardLayout title="Shared Documents">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-fg mb-2">Shared Travel Documents</h1>
        <p className="text-fg/60">Passports, visas, and health cards pilgrims have shared with you.</p>
      </div>

      {loading ? (
        <p className="text-fg/60">Loading...</p>
      ) : shares.length === 0 ? (
        <div className="card p-8 text-center text-fg/60">No documents have been shared with you yet.</div>
      ) : (
        <div className="space-y-4">
          {shares.map((share) => (
            <div key={share.id} className="card p-5 flex items-center justify-between">
              <div>
                <p className="font-semibold">{share.data?.pilgrimName}</p>
                <p className="text-sm text-fg/60 mt-1">
                  {(share.data?.documentTypes || []).join(", ").toLowerCase()} · shared{" "}
                  {new Date(share.createdAt).toLocaleDateString()}
                </p>
                <p className="text-xs text-fg/40 mt-1">
                  Expires {new Date(share.data?.expiresAt).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => handleView(share)}
                className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold"
              >
                View Documents
              </button>
            </div>
          ))}
        </div>
      )}

      {viewingDocs && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setViewingDocs(null)}>
          <div className="bg-bg rounded-xl p-6 max-w-lg w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-bold mb-4">{viewingDocs.pilgrimName}'s Documents</h2>
            {viewLoading ? (
              <p className="text-fg/60">Loading documents...</p>
            ) : viewingDocs.error ? (
              <p className="text-red-600">This share link may have expired.</p>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {viewingDocs.documents.map((doc) => (
                  <a key={doc.id} href={doc.viewUrl} target="_blank" rel="noreferrer" className="border border-border rounded-lg p-3 text-center">
                    <p className="text-sm font-medium">{doc.type}</p>
                    <img src={doc.viewUrl} alt={doc.type} className="w-full h-28 object-cover rounded mt-2" />
                  </a>
                ))}
              </div>
            )}
            <button onClick={() => setViewingDocs(null)} className="mt-4 w-full py-2 border border-border rounded-lg text-sm">
              Close
            </button>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}

export default SharedDocumentsScreen
