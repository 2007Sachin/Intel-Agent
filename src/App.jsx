import { useState, useEffect, useMemo } from 'react'
import { supabase } from './lib/supabase'
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Zap,
  FileText,
  Clock,
  AlertTriangle,
  BarChart3,
  RefreshCw
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell
} from 'recharts'
import { clsx } from 'clsx'

// ============================================================================
// MOCK DATA (matches schema: id, summary, sentiment_score, category, is_significant, created_at)
// ============================================================================
const mockData = [
  {
    id: 1,
    summary: "TechRival Inc launched a new AI-powered analytics dashboard with real-time insights.",
    sentiment_score: 0.75,
    category: "Product Launch",
    is_significant: true,
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 2,
    summary: "DataCorp Solutions announced 15% price reduction across all enterprise plans.",
    sentiment_score: -0.3,
    category: "Pricing",
    is_significant: true,
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 3,
    summary: "CloudFirst Systems updated website with refreshed branding. No product changes.",
    sentiment_score: 0.1,
    category: "Marketing",
    is_significant: false,
    created_at: new Date().toISOString()
  },
  {
    id: 4,
    summary: "InnovateTech acquired AI startup for $50M to integrate ML into core product.",
    sentiment_score: 0.85,
    category: "M&A",
    is_significant: true,
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 5,
    summary: "TechRival key engineering lead departed for competitor. May signal internal issues.",
    sentiment_score: -0.5,
    category: "Leadership",
    is_significant: true,
    created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
  }
]

// ============================================================================
// STATS CARD COMPONENT
// ============================================================================
function StatsCard({ icon: Icon, label, value, subtext, color = 'violet' }) {
  const colorClasses = {
    violet: 'from-violet-500 to-purple-600 shadow-violet-500/20',
    emerald: 'from-emerald-500 to-teal-600 shadow-emerald-500/20',
    amber: 'from-amber-500 to-orange-600 shadow-amber-500/20',
    rose: 'from-rose-500 to-pink-600 shadow-rose-500/20'
  }

  return (
    <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-300 group">
      <div className="flex items-center justify-between mb-4">
        <span className="text-slate-400 text-sm font-medium">{label}</span>
        <div className={clsx(
          'p-2 rounded-lg bg-gradient-to-br shadow-lg',
          colorClasses[color]
        )}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      <div className="flex items-end gap-2">
        <span className="text-4xl font-bold text-slate-100">{value}</span>
        {subtext && <span className="text-slate-500 text-sm mb-1">{subtext}</span>}
      </div>
    </div>
  )
}

// ============================================================================
// CHART SECTION COMPONENT
// ============================================================================
function ChartSection({ data }) {
  const chartData = useMemo(() => {
    const categoryCount = {}
    data.forEach(item => {
      const cat = item.category || 'Uncategorized'
      categoryCount[cat] = (categoryCount[cat] || 0) + 1
    })
    return Object.entries(categoryCount).map(([name, count]) => ({ name, count }))
  }, [data])

  const colors = ['#8b5cf6', '#06b6d4', '#f59e0b', '#10b981', '#f43f5e', '#6366f1']

  return (
    <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-6">
      <div className="flex items-center gap-2 mb-6">
        <BarChart3 className="w-5 h-5 text-violet-400" />
        <h3 className="text-lg font-semibold text-slate-100">Updates by Category</h3>
      </div>

      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <XAxis
              dataKey="name"
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              axisLine={{ stroke: '#334155' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              axisLine={{ stroke: '#334155' }}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                color: '#f1f5f9'
              }}
              cursor={{ fill: 'rgba(255,255,255,0.05)' }}
            />
            <Bar dataKey="count" radius={[6, 6, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-[250px] flex items-center justify-center text-slate-500">
          No data available
        </div>
      )}
    </div>
  )
}

// ============================================================================
// FEED ITEM COMPONENT (uses 'summary' field from schema)
// ============================================================================
function FeedItem({ item }) {
  const sentimentScore = item.sentiment_score ?? 0

  const getSentimentBadge = () => {
    if (sentimentScore > 0.5) {
      return {
        icon: TrendingUp,
        label: 'Positive',
        className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
      }
    } else if (sentimentScore < 0) {
      return {
        icon: TrendingDown,
        label: 'Negative',
        className: 'bg-rose-500/20 text-rose-400 border-rose-500/30'
      }
    }
    return {
      icon: Activity,
      label: 'Neutral',
      className: 'bg-amber-500/20 text-amber-400 border-amber-500/30'
    }
  }

  const sentiment = getSentimentBadge()
  const SentimentIcon = sentiment.icon

  const formatTime = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffHours < 1) return 'Just now'
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div className={clsx(
      'backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-5',
      'hover:bg-white/10 transition-all duration-300 group',
      item.is_significant && 'ring-1 ring-amber-500/40'
    )}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-700/50 rounded-lg group-hover:bg-slate-700 transition-colors">
            <FileText className="w-4 h-4 text-slate-300" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-sm">
              {item.category && (
                <span className="font-semibold text-violet-400">{item.category}</span>
              )}
              <span className="text-slate-500">•</span>
              <span className="text-slate-500 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatTime(item.created_at)}
              </span>
            </div>
          </div>
        </div>

        {item.is_significant && (
          <span className="flex items-center gap-1 px-2 py-1 bg-amber-500/20 text-amber-400 text-xs font-medium rounded-full border border-amber-500/30">
            <Zap className="w-3 h-3" />
            Key
          </span>
        )}
      </div>

      {/* Summary */}
      <p className="text-slate-300 text-sm leading-relaxed mb-4">
        {item.summary}
      </p>

      {/* Sentiment Badge */}
      <div className={clsx(
        'inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium',
        sentiment.className
      )}>
        <SentimentIcon className="w-4 h-4" />
        <span>{sentiment.label}</span>
        <span className="opacity-70">({sentimentScore.toFixed(2)})</span>
      </div>
    </div>
  )
}

// ============================================================================
// MAIN APP COMPONENT
// ============================================================================
function App() {
  const [updates, setUpdates] = useState([])
  const [loading, setLoading] = useState(true)
  const [usingMock, setUsingMock] = useState(false)

  const fetchUpdates = async () => {
    setLoading(true)

    try {
      const { data, error } = await supabase
        .from('competitor_updates')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      if (data && data.length > 0) {
        const normalized = data.map(item => ({
          ...item,
          sentiment_score: item.sentiment_score ?? 0
        }))
        setUpdates(normalized)
        setUsingMock(false)
      } else {
        setUpdates(mockData)
        setUsingMock(true)
      }
    } catch (err) {
      console.warn('Using mock data:', err.message)
      setUpdates(mockData)
      setUsingMock(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUpdates()
  }, [])

  const stats = useMemo(() => {
    const total = updates.length
    const avgSentiment = total > 0
      ? updates.reduce((sum, u) => sum + (u.sentiment_score ?? 0), 0) / total
      : 0
    const highImpact = updates.filter(u => u.is_significant).length

    return { total, avgSentiment, highImpact }
  }, [updates])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 text-white">
      {/* Background accent */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">

        {/* Header */}
        <header className="mb-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl shadow-lg shadow-violet-500/30">
                <Activity className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-100">Intel-Agent</h1>
                <p className="text-slate-400 text-sm">Competitive Intelligence Dashboard</p>
              </div>
            </div>

            <button
              onClick={fetchUpdates}
              disabled={loading}
              className={clsx(
                'flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200',
                'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-violet-500/50',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              <RefreshCw className={clsx('w-4 h-4', loading && 'animate-spin')} />
              <span className="text-sm font-medium">Refresh</span>
            </button>
          </div>

          {usingMock && !loading && (
            <div className="mt-4 flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400 text-sm">
              <AlertTriangle className="w-4 h-4" />
              <span>Displaying mock data. Add data to Supabase to see live updates.</span>
            </div>
          )}
        </header>

        {/* Loading State */}
        {loading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-6 animate-pulse">
                  <div className="h-4 bg-slate-700 rounded w-1/2 mb-4" />
                  <div className="h-10 bg-slate-700 rounded w-3/4" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              <StatsCard
                icon={Activity}
                label="Total Updates"
                value={stats.total}
                subtext="tracked"
                color="violet"
              />
              <StatsCard
                icon={stats.avgSentiment >= 0 ? TrendingUp : TrendingDown}
                label="Avg Sentiment"
                value={(stats.avgSentiment >= 0 ? '+' : '') + stats.avgSentiment.toFixed(2)}
                subtext="score"
                color={stats.avgSentiment >= 0 ? 'emerald' : 'rose'}
              />
              <StatsCard
                icon={Zap}
                label="High Impact Events"
                value={stats.highImpact}
                subtext="require attention"
                color="amber"
              />
            </div>

            {/* Chart Section */}
            <div className="mb-10">
              <ChartSection data={updates} />
            </div>

            {/* Feed Section */}
            <section>
              <div className="flex items-center gap-2 mb-6">
                <Clock className="w-5 h-5 text-slate-400" />
                <h2 className="text-xl font-semibold text-slate-100">Recent Updates</h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {updates.map(item => (
                  <FeedItem key={item.id} item={item} />
                ))}
              </div>

              {updates.length === 0 && (
                <div className="text-center py-16">
                  <Activity className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-slate-400 mb-2">No updates yet</h3>
                  <p className="text-slate-500">Competitor updates will appear here once data is available.</p>
                </div>
              )}
            </section>
          </>
        )}

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-slate-800 text-center">
          <p className="text-slate-500 text-sm">
            Intel-Agent Dashboard • Built with React + Vite + Tailwind + Recharts
          </p>
        </footer>
      </div>
    </div>
  )
}

export default App
