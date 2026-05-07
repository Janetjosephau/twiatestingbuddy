import React, { useState, useEffect } from 'react'
import { 
  FileText, 
  Zap, 
  RefreshCw, 
  Clock, 
  CheckCircle2, 
  ArrowRight, 
  PlusCircle, 
  BarChart3,
  Search,
  LayoutDashboard
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { dashboardApi } from '../services/api'
import SummaryMetric from '../components/SummaryMetric'
import ConnectionStatus from '../components/ConnectionStatus'

interface DashboardMetrics {
  totalTestPlans: number
  totalTestCases: number
  activeLLMs: number
  activeRally: number
  generatedToday: number
  coverage: {
    coverage_percentage: number
  }
}

interface Activity {
  id: string
  type: string
  title: string
  timestamp: string
  status: 'success' | 'pending' | 'failed'
}

const Dashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const res = await dashboardApi.getOverview()
      setMetrics(res.data.metrics)
      setActivities(res.data.activity)
    } catch (error) {
      console.error('Failed to fetch dashboard data', error)
    } finally {
      setLoading(false)
    }
  }

  // Remove full-page loading for better perceived performance
  // if (loading) { ... }

  return (
    <div className="min-h-screen bg-[#f8fafc] p-8 lg:p-12">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                <LayoutDashboard size={18} />
              </div>
              <h1 className="text-3xl font-black text-[#0f172a] tracking-tight">Intelligence Overview</h1>
            </div>
            <p className="text-slate-500 font-medium">Testing Buddy AI is active and monitoring your workspace.</p>
          </div>
          
          <ConnectionStatus 
            llmCount={metrics?.activeLLMs || 0} 
            rallyCount={metrics?.activeRally || 0} 
          />
        </div>

        {/* Primary Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <SummaryMetric 
            label="Total Test Plans" 
            value={loading ? "..." : (metrics?.totalTestPlans || 0)} 
            icon={FileText} 
            colorClass="text-emerald-600"
            trend={loading ? undefined : { value: 12, label: "vs last month" }}
          />
          <SummaryMetric 
            label="Total Test Cases" 
            value={loading ? "..." : (metrics?.totalTestCases || 0)} 
            icon={CheckCircle2} 
            colorClass="text-blue-600"
            trend={loading ? undefined : { value: 5, label: "this week" }}
          />
          <SummaryMetric 
            label="AI Sync Accuracy" 
            value={loading ? "..." : `${metrics?.coverage.coverage_percentage || 100}%`} 
            icon={Zap} 
            colorClass="text-amber-500"
          />
          <SummaryMetric 
            label="Active Connections" 
            value={loading ? "..." : ((metrics?.activeLLMs || 0) + (metrics?.activeRally || 0))} 
            icon={RefreshCw} 
            colorClass="text-rose-500"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* Recent Activity Feed */}
          <div className="lg:col-span-2 space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black text-[#0f172a]">Recent AI Insights</h2>
              <button onClick={fetchDashboardData} className="p-2 text-slate-400 hover:text-emerald-600 transition-colors">
                <RefreshCw size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {loading ? (
                // Skeleton Activity
                [1, 2, 3].map(i => (
                  <div key={i} className="bg-white rounded-3xl border border-slate-100 p-6 flex items-center justify-between animate-pulse">
                    <div className="flex items-center space-x-5">
                      <div className="w-12 h-12 bg-slate-50 rounded-2xl" />
                      <div className="space-y-2">
                        <div className="h-4 w-48 bg-slate-100 rounded" />
                        <div className="h-3 w-24 bg-slate-50 rounded" />
                      </div>
                    </div>
                  </div>
                ))
              ) : activities.length > 0 ? (
                activities.map((activity, idx) => (
                  <div 
                    key={activity.id || idx} 
                    className="bg-white rounded-3xl border border-slate-100 p-6 flex items-center justify-between group hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-500/5 transition-all animate-in fade-in slide-in-from-bottom-2 duration-500"
                  >
                    <div className="flex items-center space-x-5">
                      <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                        <Clock size={22} />
                      </div>
                      <div>
                        <h3 className="font-bold text-[#0f172a] group-hover:text-emerald-700 transition-colors">{activity.title}</h3>
                        <p className="text-sm text-slate-400 font-medium">
                          {new Date(activity.timestamp).toLocaleString()} • <span className="text-emerald-500">Completed</span>
                        </p>
                      </div>
                    </div>
                    <ChevronRightIcon className="text-slate-300 group-hover:text-emerald-400 transition-all group-hover:translate-x-1" />
                  </div>
                ))
              ) : (
                <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-200">
                   <p className="text-slate-400 font-medium italic">No recent activity detected. Start generating to see results!</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Launches Sidebar */}
          <div className="space-y-8">
            <h2 className="text-2xl font-black text-[#0f172a]">Quick Launch</h2>
            <div className="space-y-4 w-3/4">
              <Link to="/generator/test-plan" className="block p-6 bg-emerald-500 border-2 border-emerald-400 rounded-3xl hover:bg-emerald-600 transition-all group shadow-lg shadow-emerald-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white">
                    <FileText size={20} />
                  </div>
                  <PlusCircle size={20} className="text-white/40 group-hover:text-white transition-colors" />
                </div>
                <h4 className="text-white font-bold text-lg mb-1">Create Test Plan</h4>
                <p className="text-emerald-50 text-sm font-medium">Generate comprehensive plans from Rally stories.</p>
              </Link>

              <Link to="/generator/test-case" className="block p-6 bg-emerald-500 border-2 border-emerald-400 rounded-3xl hover:bg-emerald-600 transition-all group shadow-lg shadow-emerald-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white">
                    <BarChart3 size={20} />
                  </div>
                  <PlusCircle size={20} className="text-white/40 group-hover:text-white transition-colors" />
                </div>
                <h4 className="text-white font-bold text-lg mb-1">Create Test Cases</h4>
                <p className="text-emerald-50 text-sm font-medium">Create test cases with AI precision.</p>
              </Link>
              
              <div className="p-8 bg-emerald-500 border-2 border-emerald-400 rounded-3xl text-white relative overflow-hidden shadow-lg shadow-emerald-100">
                 <Zap size={80} className="absolute -right-4 -bottom-4 text-white/10 rotate-12" />
                 <h4 className="font-black text-xl mb-2 relative z-10">AI Power Tip</h4>
                 <p className="text-emerald-50 text-sm font-medium relative z-10 leading-relaxed">
                   Sync your generated test cases directly back to Rally US/Stories to maintain a live source of truth.
                 </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

const ChevronRightIcon = ({ className }: { className?: string }) => (
  <svg className={`w-5 h-5 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
)

export default Dashboard
