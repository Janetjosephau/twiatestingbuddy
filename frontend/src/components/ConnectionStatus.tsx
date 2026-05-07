import React from 'react'
import { Zap, Target, CheckCircle2, XCircle } from 'lucide-react'

interface ConnectionStatusProps {
  llmCount: number
  rallyCount: number
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ llmCount, rallyCount }) => {
  return (
    <div className="flex flex-wrap gap-4">
      <div className={`flex items-center space-x-3 px-5 py-3 rounded-2xl border-2 transition-all ${
        llmCount > 0 ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-slate-50 border-slate-100 text-slate-400'
      }`}>
        <Zap size={18} className={llmCount > 0 ? 'fill-emerald-500' : ''} />
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">LLM Status</p>
          <div className="flex items-center space-x-2">
            <span className="font-bold text-sm">{llmCount > 0 ? `${llmCount} Configured` : 'Disconnected'}</span>
            {llmCount > 0 ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
          </div>
        </div>
      </div>

      <div className={`flex items-center space-x-3 px-5 py-3 rounded-2xl border-2 transition-all ${
        rallyCount > 0 ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-slate-50 border-slate-100 text-slate-400'
      }`}>
        <Target size={18} />
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">Rally Status</p>
          <div className="flex items-center space-x-2">
            <span className="font-bold text-sm">{rallyCount > 0 ? `${rallyCount} Active` : 'Offline'}</span>
            {rallyCount > 0 ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConnectionStatus
