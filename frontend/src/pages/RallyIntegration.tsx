import React, { useState, useEffect } from 'react'
import { Save, Trash2, CheckCircle, AlertCircle, ChevronDown, Target, XCircle, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import { rallyApi } from '../services/api'

interface RallyConfig {
  id: string
  instanceUrl: string
  workspaceName?: string
  projectName?: string
  testStatus: 'untested' | 'connected' | 'failed'
  lastTestedAt?: string
}

const RallyIntegration: React.FC = () => {
  const [configs, setConfigs] = useState<RallyConfig[]>([])
  const [errorModal, setErrorModal] = useState<{ title: string; detail: string } | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [testing, setTesting] = useState(false)

  const [formData, setFormData] = useState({
    instanceUrl: 'https://rally1.rallydev.com',
    apiKey: '',
    workspaceName: '',
    projectName: '',
  })

  useEffect(() => {
    fetchConfigs()
  }, [])

  const fetchConfigs = async () => {
    try {
      const res = await rallyApi.getConfigs()
      setConfigs(res.data)
    } catch {
      toast.error('Failed to load Rally configurations')
    }
  }

  const handleTestConnection = async () => {
    if (!formData.apiKey) {
      toast.error('Please enter your Rally API Key')
      return
    }
    setTesting(true)
    try {
      console.log('Testing Rally connection with URL:', formData.instanceUrl)
      const response = await rallyApi.testConnection(formData)
      console.log('Rally response:', response.data)
      
      if (response.data && (response.data.success || response.data.status === 'connected')) {
        toast.success(response.data.message || 'Rally Connection Successful!')
      } else {
        const errorMsg = response.data?.message || 'Rally connection failed'
        toast.error(errorMsg)
        setErrorModal({ title: 'Connection Refused', detail: errorMsg })
      }
    } catch (error: any) {
      console.error('Rally test error:', error)
      const errorMessage = error?.response?.data?.message || error.message || 'Rally connection failed. Please check your credentials.'
      setErrorModal({ title: 'Operation Failed', detail: errorMessage })
    } finally {
      setTesting(false)
    }
  }

  const handleSaveConfiguration = async () => {
    if (!formData.apiKey) {
      toast.error('Please enter your Rally API Key')
      return
    }
    setLoading(true)
    try {
      const response = await rallyApi.saveConfig(formData)
      toast.success(response.data.message || 'Rally Configuration saved successfully!')
      await fetchConfigs()
      setFormData({ instanceUrl: 'https://rally1.rallydev.com', apiKey: '', workspaceName: '', projectName: '' })
    } catch (error: any) {
      setErrorModal({ title: 'Operation Failed', detail: error?.response?.data?.message || 'Failed to save Rally configuration' })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = (id: string) => {
    setDeleteConfirmId(id)
  }

  const confirmDelete = async () => {
    if (!deleteConfirmId) return
    try {
      await rallyApi.deleteConfig(deleteConfirmId)
      toast.success('Rally configuration deleted')
      await fetchConfigs()
    } catch (error: any) {
      setErrorModal({ title: 'Operation Failed', detail: error?.response?.data?.message || 'Failed to delete Rally configuration' })
    } finally {
      setDeleteConfirmId(null)
    }
  }

  const getStatusBadge = (status: string) => {
    if (status === 'connected') return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
        <CheckCircle size={14} className="mr-1" /> Connected
      </span>
    )
    if (status === 'failed') return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
        <AlertCircle size={14} className="mr-1" /> Failed
      </span>
    )
    return <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">Untested</span>
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] p-8 md:p-12">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden p-12">
          {/* Header */}
          <div className="flex items-center space-x-4 mb-10">
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
              <Target size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-[#0f172a]">Rally Connection</h1>
              <p className="text-slate-500 mt-1 font-medium text-lg">Connect to Rally (CA Agile Central) to sync your test cases.</p>
            </div>
          </div>

          <div className="space-y-8">
            {/* Instance URL */}
            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-400 tracking-widest uppercase">Rally Instance URL</label>
              <input
                type="text"
                value={formData.instanceUrl}
                onChange={(e) => setFormData({ ...formData, instanceUrl: e.target.value })}
                placeholder="https://rally1.rallydev.com"
                className="w-full h-16 px-6 bg-slate-50 border-2 border-slate-100 rounded-2xl text-slate-700 font-medium focus:border-emerald-500 focus:bg-white transition-all"
              />
              <p className="text-[10px] text-slate-400 font-medium px-2">Default is https://rally1.rallydev.com for cloud instances.</p>
            </div>

            {/* API Key */}
            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-400 tracking-widest uppercase">API Key *</label>
              <input
                type="password"
                value={formData.apiKey}
                onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                placeholder="••••••••••••••••••••••••••••••••••••••••"
                className="w-full h-16 px-6 bg-slate-50 border-2 border-slate-100 rounded-2xl text-slate-700 font-medium focus:border-emerald-500 focus:bg-white transition-all"
              />
              <p className="text-[10px] text-slate-400 italic font-medium px-2">Generate your API Key from Rally: My Profile → API Keys.</p>
            </div>

            {/* Workspace and Project Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[11px] font-black text-slate-400 tracking-widest uppercase">Workspace Name (Optional)</label>
                <input
                  type="text"
                  value={formData.workspaceName}
                  onChange={(e) => setFormData({ ...formData, workspaceName: e.target.value })}
                  placeholder="e.g., My Workspace"
                  className="w-full h-16 px-6 bg-slate-50 border-2 border-slate-100 rounded-2xl text-slate-700 font-medium focus:border-emerald-500 focus:bg-white transition-all"
                />
              </div>
              <div className="space-y-3">
                <label className="text-[11px] font-black text-slate-400 tracking-widest uppercase">Project Name (Optional)</label>
                <input
                  type="text"
                  value={formData.projectName}
                  onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                  placeholder="e.g., QA Automation Project"
                  className="w-full h-16 px-6 bg-slate-50 border-2 border-slate-100 rounded-2xl text-slate-700 font-medium focus:border-emerald-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-6 pt-6">
              <button
                onClick={handleTestConnection}
                disabled={testing}
                className="flex-1 h-14 bg-emerald-500 text-white rounded-2xl font-black hover:bg-emerald-600 transition-all disabled:opacity-50 shadow-lg shadow-emerald-100 flex items-center justify-center space-x-3"
              >
                <RefreshCw size={20} className={testing ? 'animate-spin' : ''} />
                <span>{testing ? 'Checking...' : 'Test Connection'}</span>
              </button>
              <button
                onClick={handleSaveConfiguration}
                disabled={loading}
                className="flex-1 h-14 bg-emerald-500 text-white rounded-2xl font-black hover:bg-emerald-600 shadow-lg shadow-emerald-100 transition-all disabled:opacity-50 flex items-center justify-center space-x-3"
              >
                <Save size={20} />
                <span>Save Connection</span>
              </button>
            </div>
          </div>
        </div>

        {/* Saved Configurations */}
        {configs.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-[#0f172a] mb-6 px-4">Saved Configurations</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {configs.map((config, index) => (
                <div key={config.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center space-x-3 mb-1">
                        <h3 className="font-bold text-[#0f172a]">{config.projectName || config.workspaceName || 'Rally Config'}</h3>
                        {index === 0 && (
                          <span className="text-[9px] font-black bg-emerald-500 text-white px-2 py-0.5 rounded-full uppercase tracking-tighter shadow-sm">
                            Currently Used
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500">{config.instanceUrl}</p>
                    </div>
                    <button onClick={() => handleDelete(config.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </div>
                  <div>{getStatusBadge(config.testStatus)}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setDeleteConfirmId(null)} />
          <div className="relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-300">
            <div className="p-10 text-center">
              <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 size={40} />
              </div>
              <h2 className="text-2xl font-black text-slate-900 mb-2">Delete Rally Configuration?</h2>
              <p className="text-slate-500 font-medium mb-8">This action cannot be undone. Are you sure you want to permanently delete this?</p>
              <div className="flex space-x-4">
                <button onClick={() => setDeleteConfirmId(null)} className="flex-1 h-14 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-all">Cancel</button>
                <button onClick={confirmDelete} className="flex-1 h-14 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 shadow-lg shadow-red-500/20 transition-all">Yes, Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {errorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setErrorModal(null)} />
          <div className="relative w-full max-w-lg bg-white rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-300">
            <div className="h-2 w-full bg-gradient-to-r from-red-500 to-rose-500" />
            <div className="p-10">
              <div className="flex items-start space-x-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-red-50 border-2 border-red-100 flex items-center justify-center flex-shrink-0">
                  <XCircle size={32} className="text-red-500" />
                </div>
                <div className="pt-1">
                  <h2 className="text-xl font-black text-slate-900">{errorModal?.title}</h2>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1">Rally Integration · Error</p>
                </div>
              </div>
              <div className="bg-red-50 border border-red-100 rounded-2xl p-5 mb-8">
                <p className="text-sm font-bold text-red-700 leading-relaxed">{errorModal?.detail}</p>
              </div>
              <button
                onClick={() => setErrorModal(null)}
                className="w-full h-12 bg-slate-900 text-white rounded-xl font-black hover:bg-slate-800 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default RallyIntegration
