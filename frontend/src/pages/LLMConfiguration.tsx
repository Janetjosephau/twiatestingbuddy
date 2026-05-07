import React, { useState, useEffect } from 'react'
import { Save, Edit2, Trash2, CheckCircle, AlertCircle, Settings, ChevronDown, RefreshCw , XCircle} from 'lucide-react'
import toast from 'react-hot-toast'
import { llmApi } from '../services/api'

interface LLMConfig {
  id: string
  provider: string
  name: string
  model: string
  temperature: number
  maxTokens: number
  testStatus: 'untested' | 'connected' | 'failed'
  lastTestedAt?: string
  testError?: string
}

const LLMConfiguration: React.FC = () => {
  const [configs, setConfigs] = useState<LLMConfig[]>([])
  const [errorModal, setErrorModal] = useState<{ title: string; detail: string } | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [testing, setTesting] = useState(false)

  const [formData, setFormData] = useState({
    provider: 'ollama',
    name: '',
    apiKey: '',
    apiUrl: 'http://localhost:11434',
    model: 'llama3',
    temperature: 0.7,
    maxTokens: 2048
  })

  const providers = [
    {
      name: 'ollama',
      label: 'Ollama (Self-Hosted)',
      models: ['llama3', 'llama2', 'mistral', 'neural-chat'],
      requiresUrl: true
    },
    {
      name: 'gemini',
      label: 'Google Gemini',
      models: ['gemini-1.5-pro', 'gemini-1.5-flash'],
      requiresUrl: false
    },
    {
      name: 'openai',
      label: 'OpenAI',
      models: ['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'],
      requiresUrl: false
    },
    {
      name: 'groq',
      label: 'Groq',
      models: ['llama-3.3-70b-versatile', 'llama-3.1-70b', 'mixtral-8x7b'],
      requiresUrl: false
    }
  ]

  const selectedProvider = providers.find(p => p.name === formData.provider)

  useEffect(() => {
    fetchConfigs()
  }, [])

  const fetchConfigs = async () => {
    try {
      const response = await llmApi.getConfigs()
      setConfigs(response.data)
    } catch (error) {
      toast.error('Failed to load configurations')
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'temperature' || name === 'maxTokens' ? parseFloat(value) : value
    }))
  }

  const handleTestConnection = async () => {
    setTesting(true)
    try {
      const { name, ...testData } = formData
      const response = await llmApi.testConnection(testData)
      
      if (response.data?.status === 'connected' || response.data?.success) {
        toast.success(response.data.message || 'Connection Successful')
      } else {
        toast.error(response.data.message || 'Connection failed')
      }
    } catch (error: any) {
      setErrorModal({ title: 'Operation Failed', detail: error?.response?.data?.message || 'Connection failed. Please check your credentials.' })
    } finally {
      setTesting(false)
    }
  }

  const handleSaveConfiguration = async () => {
    if (!formData.name) {
      toast.error('Please fill in configuration name')
      return
    }

    setLoading(true)
    try {
      if (editingId) {
        await llmApi.updateConfig(editingId, formData)
        toast.success('Configuration Updated')
      } else {
        const response = await llmApi.saveConfig(formData)
        toast.success(response.data.message || 'Configuration Saved')
      }
      
      await fetchConfigs()
      resetForm()
    } catch (error: any) {
      setErrorModal({ title: 'Operation Failed', detail: error?.response?.data?.message || 'Failed to save configuration' })
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (config: LLMConfig) => {
    setEditingId(config.id)
    setFormData({
      provider: config.provider,
      name: config.name,
      apiKey: '',
      apiUrl: (config as any).apiUrl || 'http://localhost:11434',
      model: config.model,
      temperature: config.temperature,
      maxTokens: config.maxTokens
    })
  }

  const handleDelete = (id: string) => {
    setDeleteConfirmId(id)
  }

  const confirmDelete = async () => {
    if (!deleteConfirmId) return
    try {
      await llmApi.deleteConfig(deleteConfirmId)
      toast.success('Configuration Deleted')
      await fetchConfigs()
    } catch (error: any) {
      setErrorModal({ title: 'Operation Failed', detail: error?.response?.data?.message || 'Failed to delete configuration' })
    } finally {
      setDeleteConfirmId(null)
    }
  }

  const resetForm = () => {
    setFormData({
      provider: 'ollama',
      name: '',
      apiKey: '',
      apiUrl: 'http://localhost:11434',
      model: 'llama3',
      temperature: 0.7,
      maxTokens: 2048
    })
    setEditingId(null)
  }

  const getStatusBadge = (status: string) => {
    if (status === 'connected') {
      return <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-emerald-100 text-emerald-800"><CheckCircle size={14} className="mr-1" /> Connected</span>
    }
    if (status === 'failed') {
      return <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800"><AlertCircle size={14} className="mr-1" /> Failed</span>
    }
    return <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-slate-100 text-slate-800">Untested</span>
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] p-8 md:p-12">
      <div className="max-w-6xl mx-auto space-y-12">
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden">
          {/* Header */}
          <div className="p-10 pb-0 flex items-start space-x-4">
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
              <Settings size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-[#0f172a]">LLM Configuration</h1>
              <p className="text-slate-500 mt-1 font-medium">Configure your AI Provider for generating test plans and cases.</p>
            </div>
          </div>

          <div className="p-12 space-y-10">
            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-400 tracking-widest uppercase">Configuration Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g. Primary Ollama / Gemini Pro"
                className="w-full h-16 px-6 bg-slate-50 border-2 border-slate-100 rounded-2xl text-slate-700 font-bold focus:border-emerald-500 focus:bg-white transition-all outline-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-3">
                <label className="text-[11px] font-black text-slate-400 tracking-widest uppercase">Provider</label>
                <div className="relative">
                  <select
                    name="provider"
                    value={formData.provider}
                    onChange={handleInputChange}
                    className="w-full h-16 px-6 bg-slate-50 border-2 border-slate-100 rounded-2xl text-slate-700 font-bold focus:border-emerald-500 appearance-none outline-none"
                  >
                    {providers.map(p => <option key={p.name} value={p.name}>{p.label}</option>)}
                  </select>
                  <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-black text-slate-400 tracking-widest uppercase">Model ID</label>
                  {formData.provider === 'ollama' && (
                    <button onClick={handleTestConnection} className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                      <RefreshCw size={12} className={testing ? 'animate-spin' : ''} /> Fetch Models
                    </button>
                  )}
                </div>
                <div className="relative">
                  <select
                    name="model"
                    value={formData.model}
                    onChange={handleInputChange}
                    className="w-full h-16 px-6 bg-slate-50 border-2 border-slate-100 rounded-2xl text-slate-700 font-bold focus:border-emerald-500 appearance-none outline-none"
                  >
                    {selectedProvider?.models.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {selectedProvider?.requiresUrl && (
              <div className="space-y-3">
                <label className="text-[11px] font-black text-slate-400 tracking-widest uppercase">Endpoint URL</label>
                <input
                  type="text"
                  name="apiUrl"
                  value={formData.apiUrl}
                  onChange={handleInputChange}
                  placeholder="http://localhost:11434"
                  className="w-full h-16 px-6 bg-slate-50 border-2 border-slate-100 rounded-2xl text-slate-700 font-bold outline-none focus:border-emerald-500"
                />
              </div>
            )}

            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-400 tracking-widest uppercase">API Key / Token</label>
              <input
                type="password"
                name="apiKey"
                value={formData.apiKey}
                onChange={handleInputChange}
                placeholder="••••••••••••••••••••••••••••"
                className="w-full h-16 px-6 bg-slate-50 border-2 border-slate-100 rounded-2xl text-slate-700 font-medium outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center space-x-6 pt-6">
              <button
                onClick={handleTestConnection}
                disabled={testing}
                className="flex-1 h-14 bg-emerald-500 text-white rounded-2xl font-black hover:bg-emerald-600 transition-all disabled:opacity-50 shadow-lg shadow-emerald-100 flex items-center justify-center space-x-3"
              >
                <RefreshCw size={20} className={testing ? 'animate-spin' : ''} />
                <span>{testing ? 'Probing...' : 'Test Connection'}</span>
              </button>
              <button
                onClick={handleSaveConfiguration}
                disabled={loading}
                className="flex-1 h-14 bg-emerald-500 text-white rounded-2xl font-black hover:bg-emerald-600 shadow-lg shadow-emerald-100 transition-all disabled:opacity-50 flex items-center justify-center space-x-3"
              >
                <Save size={20} />
                <span>{editingId ? 'Update Connection' : 'Save Connection'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* List of Saved Connections */}
        <div className="space-y-6">
          <h2 className="text-xl font-black text-slate-900 flex items-center space-x-3 px-4">
            <span className="w-8 h-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-sm shadow-sm">{configs.length}</span>
            <span>Saved AI Connections</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {configs.map((config, index) => (
              <div key={config.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xs uppercase bg-emerald-50 text-emerald-600`}>
                      {config.provider.substring(0, 3)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-black text-slate-900">{config.name}</h3>
                        {index === 0 && (
                          <span className="text-[9px] font-black bg-emerald-500 text-white px-2 py-0.5 rounded-full uppercase tracking-tighter shadow-sm animate-pulse">
                            Currently Used
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-bold text-slate-400">{config.model} • {config.provider}</p>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <button onClick={() => handleEdit(config)} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(config.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                
                <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between">
                  {getStatusBadge(config.testStatus)}
                  <button 
                    onClick={() => {
                      setFormData({
                        provider: config.provider,
                        name: config.name,
                        apiKey: '',
                        apiUrl: (config as any).apiUrl || 'http://localhost:11434',
                        model: config.model,
                        temperature: config.temperature || 0.7,
                        maxTokens: config.maxTokens || 2048
                      });
                      handleTestConnection();
                    }}
                    className="text-[11px] font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest flex items-center space-x-2"
                  >
                    <RefreshCw size={12} />
                    <span>Re-Test</span>
                  </button>
                </div>
              </div>
            ))}
            {configs.length === 0 && (
              <div className="md:col-span-2 p-12 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem]">
                <p className="text-slate-400 font-bold italic">No active connections found. Configure your first provider above!</p>
              </div>
            )}
          </div>
        </div>
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
              <h2 className="text-2xl font-black text-slate-900 mb-2">Delete AI Connection?</h2>
              <p className="text-slate-500 font-medium mb-8">This will permanently remove this LLM configuration. This action cannot be undone.</p>
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
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1">LLM Configuration · Error</p>
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

export default LLMConfiguration
