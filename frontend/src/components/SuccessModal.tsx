import React from 'react'
import { CheckCircle, X } from 'lucide-react'

interface SuccessModalProps {
  message: string
  onClose: () => void
}

const SuccessModal: React.FC<SuccessModalProps> = ({ message, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full mx-4 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <CheckCircle size={32} className="text-green-500" />
            <h2 className="text-xl font-bold text-gray-900">Success!</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>
        <p className="text-gray-600 mb-6">{message}</p>
        <button
          onClick={onClose}
          className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  )
}

export default SuccessModal
