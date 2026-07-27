import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import Plot from 'react-plotly.js'
import { IndianRupee, PiggyBank, TrendingDown, TrendingUp } from 'lucide-react'
import { getTripAnalytics } from '@/services/analyticsApi'
import { EXPENSE_CATEGORIES } from '@/types/budget'
import type { TripAnalytics } from '@/types/analytics'

const CHART_COLORS = ['#0f4c81', '#2e8b57', '#d4a65a', '#63c5ea', '#b7a9e0', '#081c2d']

function categoryLabel(value: string) {
  return EXPENSE_CATEGORIES.find((c) => c.value === value)?.label ?? value
}

export function AnalyticsPage() {
  const { tripId } = useParams<{ tripId: string }>()
  const [data, setData] = useState<TripAnalytics | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!tripId) return
    getTripAnalytics(tripId)
      .then(setData)
      .catch(() => setError(true))
  }, [tripId])

  if (!tripId) return null

  if (error) {
    return <p className="px-6 py-8 text-sm text-slate">Could not load analytics for this trip.</p>
  }
  if (!data) {
    return <p className="px-6 py-8 text-sm text-slate">Loading…</p>
  }

  const hasExpenses = data.categoryBreakdown.length > 0
  const spentRatio = data.totalBudget > 0 ? Math.min(1, data.totalSpent / data.totalBudget) : 0

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-8">
      <div>
        <p className="text-sm font-semibold text-ink">Analytics</p>
        <p className="mt-1 text-xs text-slate">Real numbers from this trip&rsquo;s budget and expenses.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-mist p-5">
          <p className="flex items-center gap-1.5 text-xs font-medium text-slate">
            <PiggyBank className="h-3.5 w-3.5" />
            Total Budget
          </p>
          <p className="mt-2 flex items-center text-2xl font-bold text-ink">
            <IndianRupee className="h-4 w-4" />
            {data.totalBudget.toLocaleString('en-IN')}
          </p>
        </div>
        <div className="rounded-2xl border border-mist p-5">
          <p className="flex items-center gap-1.5 text-xs font-medium text-slate">
            <TrendingUp className="h-3.5 w-3.5" />
            Total Spent
          </p>
          <p className="mt-2 flex items-center text-2xl font-bold text-ink">
            <IndianRupee className="h-4 w-4" />
            {data.totalSpent.toLocaleString('en-IN')}
          </p>
        </div>
        <div className="rounded-2xl border border-mist p-5">
          <p className="flex items-center gap-1.5 text-xs font-medium text-slate">
            <TrendingDown className="h-3.5 w-3.5" />
            Remaining
          </p>
          <p className={`mt-2 flex items-center text-2xl font-bold ${data.remaining < 0 ? 'text-red-600' : 'text-ink'}`}>
            <IndianRupee className="h-4 w-4" />
            {data.remaining.toLocaleString('en-IN')}
          </p>
        </div>
        <div className="rounded-2xl border border-mist p-5">
          <p className="text-xs font-medium text-slate">Top Category</p>
          <p className="mt-2 text-2xl font-bold text-ink">
            {data.mostExpensiveCategory ? categoryLabel(data.mostExpensiveCategory) : '—'}
          </p>
        </div>
      </div>

      {data.totalBudget > 0 && (
        <div className="rounded-2xl border border-mist p-5">
          <p className="mb-3 text-sm font-semibold text-ink">Budget Used</p>
          <div className="h-3 w-full overflow-hidden rounded-full bg-mist">
            <div
              className={`h-full rounded-full transition-all ${spentRatio >= 1 ? 'bg-red-500' : spentRatio >= 0.8 ? 'bg-gold' : 'bg-sea'}`}
              style={{ width: `${spentRatio * 100}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-slate">{Math.round(spentRatio * 100)}% of budget used</p>
        </div>
      )}

      {!hasExpenses ? (
        <div className="rounded-2xl border border-dashed border-mist p-10 text-center text-sm text-slate">
          No expenses logged yet — charts will show up once there&rsquo;s real spending to analyze.
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-2xl border border-mist p-4">
            <p className="mb-2 text-sm font-semibold text-ink">Spending by Category</p>
            <Plot
              data={[
                {
                  type: 'pie',
                  labels: data.categoryBreakdown.map((c) => categoryLabel(c.category)),
                  values: data.categoryBreakdown.map((c) => c.amount),
                  marker: { colors: CHART_COLORS },
                  hole: 0.45,
                  textinfo: 'label+percent',
                },
              ]}
              layout={{
                margin: { t: 10, b: 10, l: 10, r: 10 },
                showlegend: false,
                height: 300,
                font: { family: 'Manrope, sans-serif', size: 12 },
              }}
              config={{ displayModeBar: false, responsive: true }}
              style={{ width: '100%' }}
            />
          </div>

          <div className="rounded-2xl border border-mist p-4">
            <p className="mb-2 text-sm font-semibold text-ink">Spending by Day</p>
            <Plot
              data={[
                {
                  type: 'bar',
                  x: data.dailySpending.map((d) => d.date),
                  y: data.dailySpending.map((d) => d.amount),
                  marker: { color: '#0f4c81' },
                },
              ]}
              layout={{
                margin: { t: 10, b: 40, l: 45, r: 10 },
                height: 300,
                font: { family: 'Manrope, sans-serif', size: 12 },
                xaxis: { title: { text: '' } },
                yaxis: { title: { text: '₹' } },
              }}
              config={{ displayModeBar: false, responsive: true }}
              style={{ width: '100%' }}
            />
          </div>

          <div className="rounded-2xl border border-mist p-4 lg:col-span-2">
            <p className="mb-2 text-sm font-semibold text-ink">Who Paid What</p>
            <Plot
              data={[
                {
                  type: 'bar',
                  orientation: 'h',
                  x: data.memberContributions.map((m) => m.amount),
                  y: data.memberContributions.map((m) => m.memberName),
                  marker: { color: '#2e8b57' },
                },
              ]}
              layout={{
                margin: { t: 10, b: 30, l: 120, r: 10 },
                height: Math.max(180, data.memberContributions.length * 50),
                font: { family: 'Manrope, sans-serif', size: 12 },
              }}
              config={{ displayModeBar: false, responsive: true }}
              style={{ width: '100%' }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
