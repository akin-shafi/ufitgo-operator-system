import { useMemo, useState } from "react"
import { ArrowDownToLine, Banknote, CalendarDays, CheckCircle2, Clock3, Download, Filter, Landmark, RefreshCw, Search, WalletCards } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useFinancial } from "../../hooks/useFinancial"
import { useSettlement } from "../../hooks/useSettlement"
import { Button } from "../../components/common/Button"
import { Card } from "../../components/common/Card"
import { Input } from "../../components/common/Input"
import { DashboardLayout } from "../../components/layout/DashboardLayout"

const formatCurrency = (amount) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(Number(amount || 0))

const formatDate = (value) => {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString("en-NG", { day: "2-digit", month: "short", year: "numeric" })
}

const transactionAmount = (transaction) => Number(transaction.amount || transaction.operatorSettlement || 0)

function MetricCard({ icon: Icon, label, value, tone, note }) {
  return <Card className="p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.1em] text-gray-500">{label}</p><p className="mt-3 text-2xl font-bold text-gray-900">{value}</p><p className="mt-1 text-xs text-gray-500">{note}</p></div><span className={`grid size-10 place-items-center rounded-lg bg-gray-50 ${tone}`}><Icon className="size-5" /></span></div></Card>
}

const FinancialScreen = () => {
  const navigate = useNavigate()
  const { summary, transactions, loading, error, requestPayout, refetch } = useFinancial()
  const { bankAccount } = useSettlement()
  const [showPayoutForm, setShowPayoutForm] = useState(false)
  const [payoutAmount, setPayoutAmount] = useState("")
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [requesting, setRequesting] = useState(false)

  const visibleTransactions = useMemo(() => {
    const term = search.trim().toLowerCase()
    return (transactions || []).filter((transaction) => {
      const searchable = `${transaction.description || ""} ${transaction.referenceNumber || ""} ${transaction.bookingId || ""}`.toLowerCase()
      return (statusFilter === "all" || transaction.status === statusFilter) && (!term || searchable.includes(term))
    })
  }, [transactions, search, statusFilter])

  const paymentTypes = useMemo(() => {
    const groups = [
      { key: "credit", label: "Payments received", color: "bg-emerald-500" },
      { key: "debit", label: "Payouts", color: "bg-blue-500" },
      { key: "refund", label: "Refunds", color: "bg-orange-500" },
    ].map((group) => ({ ...group, amount: (transactions || []).filter((transaction) => transaction.type === group.key).reduce((sum, transaction) => sum + transactionAmount(transaction), 0) }))
    const total = groups.reduce((sum, group) => sum + group.amount, 0)
    return groups.map((group) => ({ ...group, percent: total ? Math.round((group.amount / total) * 100) : 0 }))
  }, [transactions])

  const paymentFlow = useMemo(() => {
    const months = Array.from({ length: 6 }, (_, index) => {
      const date = new Date()
      date.setMonth(date.getMonth() - (5 - index), 1)
      return { key: `${date.getFullYear()}-${date.getMonth()}`, label: date.toLocaleDateString("en-NG", { month: "short" }), amount: 0 }
    })
    ;(transactions || []).forEach((transaction) => {
      const date = new Date(transaction.createdAt || transaction.date)
      const month = months.find((item) => item.key === `${date.getFullYear()}-${date.getMonth()}`)
      if (month && transaction.type === "credit" && transaction.status === "completed") month.amount += transactionAmount(transaction)
    })
    const maximum = Math.max(...months.map((month) => month.amount), 1)
    return months.map((month) => ({ ...month, height: Math.max((month.amount / maximum) * 100, month.amount ? 8 : 2) }))
  }, [transactions])

  const handleRequestPayout = async () => {
    if (!payoutAmount || Number.parseFloat(payoutAmount) <= 0) return alert("Please enter a valid amount")
    try {
      setRequesting(true)
      await requestPayout(Number.parseFloat(payoutAmount))
      alert("Payout request submitted successfully")
      setShowPayoutForm(false)
      setPayoutAmount("")
    } catch (requestError) {
      alert(`Failed to request payout: ${requestError.message}`)
    } finally {
      setRequesting(false)
    }
  }

  const handleExport = () => {
    const rows = [
      ["Description", "Date", "Type", "Amount", "Status"],
      ...visibleTransactions.map((transaction) => [
        transaction.description || `Booking #${transaction.bookingId || "-"}`,
        formatDate(transaction.createdAt || transaction.date),
        transaction.type || "payment",
        transactionAmount(transaction),
        transaction.status || "",
      ]),
    ]
    const csv = rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\n")
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }))
    const link = document.createElement("a")
    link.href = url
    link.download = "ufitgo-payment-transactions.csv"
    link.click()
    URL.revokeObjectURL(url)
  }

  if (loading) return <DashboardLayout title="Payments Overview"><div className="space-y-5"><div className="h-8 w-56 animate-pulse rounded bg-gray-200" /><div className="grid gap-4 md:grid-cols-4">{[1, 2, 3, 4].map((item) => <div key={item} className="h-32 animate-pulse rounded-xl bg-gray-200" />)}</div></div></DashboardLayout>

  if (error) return <DashboardLayout title="Payments Overview"><Card><div className="py-12 text-center"><p className="mb-4 text-red-600">Error: {error}</p><Button onClick={refetch}>Try Again</Button></div></Card></DashboardLayout>

  return (
    <DashboardLayout title="Payments Overview">
      <div className="space-y-6 pb-10">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end"><div><p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">Payments</p><h1 className="mt-2 text-3xl font-bold text-gray-900">Payments Overview</h1><p className="mt-2 max-w-xl text-sm text-gray-600">Track payment receipts, settlement readiness, and transaction history for your packages.</p></div><div className="flex flex-wrap gap-2"><Button variant="secondary" onClick={refetch}><RefreshCw className="mr-2 inline size-4" /> Refresh</Button><Button onClick={() => setShowPayoutForm(true)}><ArrowDownToLine className="mr-2 inline size-4" /> Request payout</Button></div></div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><MetricCard icon={Banknote} label="Collected this month" value={formatCurrency(summary?.monthlyCollected)} tone="text-emerald-600" note="Completed customer payments" /><MetricCard icon={WalletCards} label="Total transactions" value={Number(summary?.totalTransactions || 0).toLocaleString("en-NG")} tone="text-blue-600" note="All payment activity" /><MetricCard icon={CalendarDays} label="Average payment" value={formatCurrency(summary?.averageTransaction)} tone="text-violet-600" note="Average completed receipt" /><MetricCard icon={Clock3} label="Pending payouts" value={formatCurrency(summary?.pendingWithdrawals)} tone="text-orange-600" note="Awaiting settlement" /></div>

        <div className="grid gap-6 xl:grid-cols-[1.35fr_0.9fr]"><Card><div className="flex items-start justify-between gap-4"><div><h2 className="text-lg font-bold text-gray-900">Payment flow</h2><p className="mt-1 text-sm text-gray-500">Completed receipts across the last six months</p></div><span className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700">{formatCurrency(summary?.monthlyCollected)} this month</span></div><div className="mt-8 flex h-52 items-end gap-3 border-b border-gray-100 px-2 sm:gap-5">{paymentFlow.map((month, index) => <div key={month.key} className="group flex h-full flex-1 flex-col items-center justify-end gap-2"><div className={`relative w-full max-w-12 rounded-t-md ${index === paymentFlow.length - 1 ? "bg-primary" : "bg-primary/20"}`} style={{ height: `${month.height}%` }}><span className="absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-[10px] text-white group-hover:block">{formatCurrency(month.amount)}</span></div><span className="text-xs font-medium text-gray-500">{month.label}</span></div>)}</div></Card><Card><div className="flex items-start justify-between"><div><h2 className="text-lg font-bold text-gray-900">Payment types</h2><p className="mt-1 text-sm text-gray-500">Distribution by transaction category</p></div><Filter className="size-5 text-gray-400" /></div><div className="mt-7 space-y-5">{paymentTypes.map((type) => <div key={type.key}><div className="flex items-center justify-between text-sm"><span className="font-semibold text-gray-700">{type.label}</span><span className="font-bold text-gray-900">{type.percent}%</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100"><div className={`h-full rounded-full ${type.color}`} style={{ width: `${Math.max(type.percent, type.amount ? 4 : 0)}%` }} /></div><p className="mt-1 text-xs text-gray-500">{formatCurrency(type.amount)}</p></div>)}</div></Card></div>

        {showPayoutForm && <Card className="border-primary/30 bg-primary/5"><div className="flex flex-col gap-4 md:flex-row md:items-end"><Input label="Payout amount (NGN)" type="number" value={payoutAmount} onChange={(event) => setPayoutAmount(event.target.value)} placeholder="Enter amount" /><p className="pb-2 text-sm text-gray-600">Pending payout total: <strong>{formatCurrency(summary?.pendingWithdrawals)}</strong></p><div className="flex gap-2"><Button onClick={handleRequestPayout} disabled={requesting}>{requesting ? "Requesting..." : "Submit request"}</Button><Button variant="secondary" onClick={() => { setShowPayoutForm(false); setPayoutAmount("") }}>Cancel</Button></div></div></Card>}

        <Card><div className="flex flex-col justify-between gap-4 border-b border-gray-100 pb-4 lg:flex-row lg:items-center"><div><h2 className="text-lg font-bold text-gray-900">Recent transactions</h2><p className="mt-1 text-sm text-gray-500">Receipts, payouts, and refunds associated with your account.</p></div><div className="flex flex-wrap gap-2"><label className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search transactions" className="h-10 w-56 rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-3 text-sm outline-none focus:border-primary" /></label><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-10 rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm outline-none focus:border-primary"><option value="all">All statuses</option><option value="completed">Completed</option><option value="pending">Pending</option><option value="failed">Failed</option></select><button type="button" title="Export report" onClick={handleExport} className="inline-flex h-10 items-center gap-2 rounded-lg border border-gray-200 px-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"><Download className="size-4" /> Export</button></div></div>{visibleTransactions.length === 0 ? <p className="py-12 text-center text-sm text-gray-500">No transactions match your filters.</p> : <div className="mt-3 overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead className="text-[10px] uppercase tracking-[0.12em] text-gray-500"><tr><th className="px-3 py-3 font-semibold">Description</th><th className="px-3 py-3 font-semibold">Date</th><th className="px-3 py-3 font-semibold">Type</th><th className="px-3 py-3 font-semibold">Amount</th><th className="px-3 py-3 font-semibold">Status</th></tr></thead><tbody className="divide-y divide-gray-100">{visibleTransactions.map((transaction) => <tr key={transaction.id} className="hover:bg-gray-50"><td className="px-3 py-4"><p className="font-semibold text-gray-900">{transaction.description || `Booking #${transaction.bookingId || "-"}`}</p><p className="mt-1 text-xs text-gray-500">{transaction.referenceNumber || `Transaction #${transaction.id}`}</p></td><td className="px-3 py-4 text-gray-600">{formatDate(transaction.createdAt || transaction.date)}</td><td className="px-3 py-4 capitalize text-gray-600">{transaction.type || "payment"}</td><td className={`px-3 py-4 font-bold ${transaction.type === "debit" || transaction.type === "refund" ? "text-red-600" : "text-emerald-600"}`}>{transaction.type === "debit" || transaction.type === "refund" ? "-" : "+"}{formatCurrency(transactionAmount(transaction))}</td><td className="px-3 py-4"><span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${transaction.status === "completed" ? "bg-emerald-50 text-emerald-700" : transaction.status === "pending" ? "bg-orange-50 text-orange-700" : "bg-gray-100 text-gray-600"}`}><CheckCircle2 className="size-3" /> {transaction.status}</span></td></tr>)}</tbody></table></div>}</Card>

        <Card><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><h2 className="flex items-center gap-2 text-lg font-bold text-gray-900"><Landmark className="size-5 text-primary" /> Settlement account</h2><p className="mt-1 text-sm text-gray-500">The account used for operator settlement payouts.</p></div><Button variant="secondary" onClick={() => navigate("/settlement/setup")}>{bankAccount ? "Update account" : "Add bank details"}</Button></div>{bankAccount ? <div className="mt-5 grid gap-4 rounded-lg bg-gray-50 p-4 text-sm sm:grid-cols-3"><div><p className="text-xs text-gray-500">Bank</p><p className="mt-1 font-semibold text-gray-900">{bankAccount.bankName}</p></div><div><p className="text-xs text-gray-500">Account name</p><p className="mt-1 font-semibold text-gray-900">{bankAccount.accountName}</p></div><div><p className="text-xs text-gray-500">Account number</p><p className="mt-1 font-semibold text-gray-900">{bankAccount.accountNumber}</p></div></div> : <p className="mt-5 rounded-lg bg-orange-50 p-4 text-sm text-orange-800">No settlement account added yet. Add bank details to receive payouts.</p>}</Card>
      </div>
    </DashboardLayout>
  )
}

export default FinancialScreen