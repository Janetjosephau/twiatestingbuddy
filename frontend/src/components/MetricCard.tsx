import React from 'react'
import { TrendingUp } from 'lucide-react'

interface MetricCardProps {
  label: string
  value: number
  icon: React.ReactNode
  color: string
  trend?: number
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, icon, color, trend }) => {
  return (
    <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-600 font-medium">{label}</p>
          <p className="text-4xl font-bold text-gray-900 mt-2">{value}</p>
          {trend && (
            <div className="flex items-center mt-2 text-green-600 text-sm font-medium">
              <TrendingUp size={16} className="mr-1" />
              +{trend} this month
            </div>
          )}
        </div>
        <div className={`${color} rounded-lg p-3 text-white`}>
          {icon}
        </div>
      </div>
    </div>
  )
}

export default MetricCard
