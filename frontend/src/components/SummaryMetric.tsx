import React from 'react'
import { LucideIcon } from 'lucide-react'

interface SummaryMetricProps {
  label: string
  value: string | number
  icon: LucideIcon
  colorClass: string
  trend?: {
    value: number
    label: string
  }
}

const SummaryMetric: React.FC<SummaryMetricProps> = ({ 
  label, 
  value, 
  icon: Icon, 
  colorClass,
  trend 
}) => {
  return (
    <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
      {/* Background Decor */}
      <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full opacity-[0.03] group-hover:scale-110 transition-transform ${colorClass.replace('text-', 'bg-')}`} />
      
      <div className="flex items-start justify-between">
        <div className="space-y-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${colorClass.replace('text-', 'bg- opacity-10')} ${colorClass}`}>
            <Icon size={28} />
          </div>
          <div>
            <p className="text-[11px] font-black text-slate-400 tracking-widest uppercase mb-1">{label}</p>
            <h3 className="text-4xl font-black text-[#0f172a]">{value}</h3>
          </div>
        </div>
        
        {trend && (
          <div className="mt-1 flex flex-col items-end">
            <span className={`text-xs font-bold px-2 py-1 rounded-lg ${trend.value >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
              {trend.value >= 0 ? '+' : ''}{trend.value}%
            </span>
            <span className="text-[10px] text-slate-400 font-medium mt-1">{trend.label}</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default SummaryMetric
