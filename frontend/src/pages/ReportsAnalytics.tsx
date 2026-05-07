import React, { useState } from 'react'
import { BarChart3, TrendingUp, Activity, PieChart, Target, Calendar, Download } from 'lucide-react'

interface CoverageData {
  automated: number
  manual: number
  notTested: number
}

interface TrendData {
  month: string
  generated: number
  executed: number
}

const ReportsAnalytics: React.FC = () => {
  const [coverageData] = useState<CoverageData>({
    automated: 65,
    manual: 25,
    notTested: 10
  })

  const [trendData] = useState<TrendData[]>([
    { month: 'Jan', generated: 12, executed: 10 },
    { month: 'Feb', generated: 18, executed: 15 },
    { month: 'Mar', generated: 25, executed: 22 },
    { month: 'Apr', generated: 31, executed: 28 },
    { month: 'May', generated: 38, executed: 35 },
    { month: 'Jun', generated: 45, executed: 42 }
  ])

  const maxValue = Math.max(...trendData.map(d => Math.max(d.generated, d.executed)))

  return (
    <div className="min-h-screen bg-[#f8fafc] p-8 md:p-12">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Reports & Analytics</h1>
            <p className="text-slate-500 font-medium">Insights and testing velocity metrics from Rally requirements.</p>
          </div>
          <button className="flex items-center space-x-2 px-6 py-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm">
            <Download size={18} />
            <span>Download Report</span>
          </button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 group hover:border-emerald-200 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Test Cases</p>
                <p className="text-4xl font-black text-slate-900">342</p>
              </div>
              <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 transition-transform group-hover:scale-110">
                <BarChart3 size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 group hover:border-emerald-200 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Automated</p>
                <p className="text-4xl font-black text-emerald-600">223</p>
              </div>
              <div className="w-12 h-12 bg-emerald-100/50 rounded-xl flex items-center justify-center text-emerald-600 transition-transform group-hover:scale-110">
                <Activity size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 group hover:border-emerald-200 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Execution Rate</p>
                <p className="text-4xl font-black text-emerald-600">92%</p>
              </div>
              <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 transition-transform group-hover:scale-110">
                <TrendingUp size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 group hover:border-emerald-200 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Pass Rate</p>
                <p className="text-4xl font-black text-emerald-600">87%</p>
              </div>
              <div className="w-12 h-12 bg-emerald-100/50 rounded-xl flex items-center justify-center text-emerald-600 transition-transform group-hover:scale-110">
                <Target size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Coverage */}
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-10">
            <h2 className="text-xl font-black text-slate-900 mb-8">Test Coverage Breakdown</h2>
            <div className="space-y-8">
              <div>
                <div className="flex justify-between mb-3 text-sm font-black uppercase text-slate-500 tracking-wider">
                  <span>Automated (Rally)</span>
                  <span className="text-emerald-600 text-lg">{coverageData.automated}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-2xl h-5 p-1">
                  <div className="bg-emerald-500 h-full rounded-xl transition-all shadow-lg shadow-emerald-500/20" style={{ width: `${coverageData.automated}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-3 text-sm font-black uppercase text-slate-500 tracking-wider">
                  <span>Manual Verification</span>
                  <span className="text-slate-700 text-lg">{coverageData.manual}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-2xl h-5 p-1">
                  <div className="bg-slate-400 h-full rounded-xl transition-all shadow-lg shadow-slate-400/20" style={{ width: `${coverageData.manual}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-3 text-sm font-black uppercase text-slate-500 tracking-wider">
                  <span>Not Tested</span>
                  <span className="text-slate-400 text-lg">{coverageData.notTested}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-2xl h-5 p-1">
                  <div className="bg-slate-200 h-full rounded-xl transition-all" style={{ width: `${coverageData.notTested}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Trend */}
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-10">
            <h2 className="text-xl font-black text-slate-900 mb-8">Generation Trend</h2>
            <div className="flex items-end justify-between h-56 gap-4">
              {trendData.map((data, index) => (
                <div key={index} className="flex-1 flex flex-col items-center group">
                  <div className="relative w-full h-40 flex items-end justify-center space-x-1">
                    <div 
                      className="w-3 bg-emerald-200 rounded-t-full transition-all group-hover:bg-emerald-300"
                      style={{ height: `${(data.generated / maxValue) * 100}%` }}
                    ></div>
                    <div 
                      className="w-3 bg-emerald-500 rounded-t-full transition-all shadow-lg shadow-emerald-500/20"
                      style={{ height: `${(data.executed / maxValue) * 100}%` }}
                    ></div>
                  </div>
                  <span className="mt-4 text-xs font-black text-slate-400 uppercase">{data.month}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-center mt-10 space-x-8">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-emerald-200"></div>
                <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Generated</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Executed</span>
              </div>
            </div>
          </div>
        </div>

        {/* Insights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-slate-900 rounded-[2rem] p-8 text-white">
            <h3 className="text-[11px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-4">Quality Leader</h3>
            <p className="text-2xl font-black">Authentication Flow</p>
            <p className="text-slate-400 mt-2 font-medium">8.9/10 Quality Score</p>
          </div>
          <div className="bg-emerald-500 rounded-[2rem] p-8 text-white shadow-xl shadow-emerald-200">
            <h3 className="text-[11px] font-black text-emerald-100 uppercase tracking-[0.2em] mb-4">AI Velocity</h3>
            <p className="text-2xl font-black">+240% Speedup</p>
            <p className="text-emerald-50 mt-2 font-medium">vs Manual Generation</p>
          </div>
          <div className="bg-white border-2 border-slate-100 rounded-[2rem] p-8">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Sync Status</h3>
            <p className="text-2xl font-black text-slate-900">100% Rally Sync</p>
            <p className="text-emerald-500 mt-2 font-bold flex items-center space-x-1">
              <CheckCircle size={16} />
              <span>All systems healthy</span>
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}

const CheckCircle = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
)

export default ReportsAnalytics
