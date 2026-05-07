import React, { useState, useEffect } from 'react'
import {
  Download, RefreshCw, Zap, Eye, Trash2, Upload,
  Database, Loader, FileText, FileCheck, Search,
  Settings, ChevronRight, CheckCircle2, AlertCircle,
  FileDown, FileUp, Edit3, Save, X, XCircle, Check
} from 'lucide-react'
import toast from 'react-hot-toast'
import { generatorApi, rallyApi, llmApi } from '../services/api'

interface TestCase {
  id: string
  caseId: string
  title: string
  preconditions: string[]
  steps: { action: string; expectedResult: string }[]
  postconditions: string[]
  priority: string
  status: string
  testData?: string
  method?: string
  type?: string
  workProduct?: string
}

interface RallyRequirement {
  key: string
  title: string
  description: string
  notes?: string
  requirements?: string
  issueType: string
  status: string
  priority: string
}

const TestCaseGenerator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'fetch' | 'generate' | 'review' | 'upload'>('fetch')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [uploading, setUploading] = useState(false)

  // Tab 1: Fetch State
  const [rallyConfigs, setRallyConfigs] = useState<any[]>([])
  const [selectedRallyId, setSelectedRallyId] = useState('')
  const [projectKey, setProjectKey] = useState('')
  const [fetchedIssues, setFetchedIssues] = useState<RallyRequirement[]>([])
  const [selectedIssue, setSelectedIssue] = useState<RallyRequirement | null>(null)

  // Tab 2/3: Generation & Review State
  const [llmConfigs, setLlmConfigs] = useState<any[]>([])
  const [selectedLlmId, setSelectedLlmId] = useState('')
  const [additionalContext, setAdditionalContext] = useState('')
  const [generatedTestCases, setGeneratedTestCases] = useState<TestCase[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string; errors?: string[] } | null>(null)
  const [errorModal, setErrorModal] = useState<{ title: string; detail: string } | null>(null)

  // Batch Edit Fields
  const [batchWorkProduct, setBatchWorkProduct] = useState('')
  const [batchTestFolder, setBatchTestFolder] = useState('')

  useEffect(() => {
    loadPrerequisites()
  }, [])

  useEffect(() => {
    if (selectedIssue) {
      setBatchWorkProduct(selectedIssue.key)
    }
  }, [selectedIssue])

  const loadPrerequisites = async () => {
    try {
      const [llmRes, rallyRes] = await Promise.all([
        llmApi.getConfigs(),
        rallyApi.getConfigs()
      ])
      setLlmConfigs(llmRes.data)
      if (llmRes.data.length > 0) setSelectedLlmId(llmRes.data[0].id)

      setRallyConfigs(rallyRes.data)
      if (rallyRes.data.length > 0) setSelectedRallyId(rallyRes.data[0].id)
    } catch (e) {
      console.error('Failed to load configs')
    }
  }

  const handleFetchRequirements = async () => {
    if (!projectKey.trim()) {
      toast.error('Please enter a Rally Formatted ID (e.g. US31488)')
      return
    }
    setFetching(true)
    try {
      const res = await rallyApi.fetchRequirements({
        query: projectKey,
        rallyConfigId: selectedRallyId
      })
      if (res.data.success) {
        setFetchedIssues(res.data.requirements)
        setSelectedIssue(res.data.requirements[0] || null)
        toast.success(`Fetched requirement from Rally`)
      } else {
        setErrorModal({ title: 'Fetch Failed', detail: res.data.message || 'Requirement not found' })
      }
    } catch (e: any) {
      setErrorModal({ title: 'Connection Error', detail: e?.response?.data?.message || e?.message || 'Failed to connect to Rally' })
    } finally {
      setFetching(false)
    }
  }

  const handleGenerateCases = async () => {
    if (!selectedIssue) {
      toast.error('Please select a requirement first')
      return
    }
    setGenerating(true)
    setErrorModal(null)
    try {
      const stripHtml = (html: string) => html ? html.replace(/<[^>]*>?/gm, '').trim() : 'N/A';
      
      const res = await generatorApi.generateTestCases({
        testPlanId: 'manual-gen',
        llmConfigId: selectedLlmId,
        additionalInstructions: additionalContext,
        requirementBody: `
Title: ${selectedIssue.title}
Description: ${stripHtml(selectedIssue.description)}
Requirements: ${stripHtml(selectedIssue.requirements)}
Notes: ${stripHtml(selectedIssue.notes)}
`.trim()
      })

      if (res.data.success) {
        // Initialize fields that aren't provided by AI or need defaults
        const initializedCases = res.data.testCases.map((tc: any) => ({
          ...tc,
          method: 'Manual',
          type: 'Functional',
          status: tc.status || 'New',
          priority: tc.priority || 'Medium'
        }))
        setGeneratedTestCases(initializedCases)
        // Auto-select all by default
        setSelectedIds(new Set(initializedCases.map((tc: any) => tc.id)))
        setActiveTab('review')
        toast.success('Test cases generated!')
      } else {
        setErrorModal({
          title: 'Generation Failed',
          detail: res.data.message || 'The AI could not generate test cases. Please check your LLM connection and try again.'
        })
      }
    } catch (e: any) {
      const detail =
        e?.response?.data?.message ||
        e?.message ||
        'An unexpected error occurred. Please verify your LLM configuration and try again.'
      setErrorModal({
        title: 'Generation Error',
        detail
      })
    } finally {
      setGenerating(false)
    }
  }

  const handleExport = () => {
    const toExport = generatedTestCases.filter(tc => selectedIds.has(tc.id))
    if (toExport.length === 0) {
      toast.error('Please select at least one test case')
      return
    }

    const blob = new Blob([JSON.stringify(toExport, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `test-cases-${selectedIssue?.key || 'export'}.json`
    link.click()
    toast.success(`Exported ${toExport.length} cases to JSON`)
  }

  const handleExportExcel = () => {
    const toExport = generatedTestCases.filter(tc => selectedIds.has(tc.id))
    if (toExport.length === 0) {
      toast.error('Please select at least one test case')
      return
    }

    const headers = ['ID', 'Title', 'Priority', 'Preconditions', 'Steps', 'Expected Results', 'Postconditions']
    const csvContent = [
      headers.join(','),
      ...toExport.map(tc => {
        const preconditions = `"${tc.preconditions.join('; ').replace(/"/g, '""')}"`
        const steps = `"${tc.steps.map(s => s.action).join('; ').replace(/"/g, '""')}"`
        const expected = `"${tc.steps.map(s => s.expectedResult).join('; ').replace(/"/g, '""')}"`
        const postconditions = `"${tc.postconditions.join('; ').replace(/"/g, '""')}"`

        return [
          tc.caseId,
          `"${tc.title.replace(/"/g, '""')}"`,
          tc.priority,
          preconditions,
          steps,
          expected,
          postconditions
        ].join(',')
      })
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `test-cases-${selectedIssue?.key || 'export'}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success(`Exported ${toExport.length} cases to Excel (CSV)`)
  }

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) newSelected.delete(id)
    else newSelected.add(id)
    setSelectedIds(newSelected)
  }

  const toggleAll = () => {
    if (selectedIds.size === generatedTestCases.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(generatedTestCases.map(tc => tc.id)))
    }
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string)
        setGeneratedTestCases(imported)
        toast.success('Test cases imported')
      } catch (err) {
        toast.error('Invalid JSON file')
      }
    }
    reader.readAsText(file)
  }

  const updateTestCase = (id: string, updates: Partial<TestCase>) => {
    setGeneratedTestCases(prev => prev.map(tc => tc.id === id ? { ...tc, ...updates } : tc))
  }

  const handleUploadToRally = async () => {
    const toUpload = generatedTestCases
      .filter(tc => selectedIds.has(tc.id))
      .map(tc => ({
        ...tc,
        // Individual fields are now the primary source of truth
        method: tc.method || 'Manual',
        status: tc.status || 'New',
        priority: tc.priority || 'Medium',
        type: tc.type || 'Functional',
        workProduct: tc.workProduct || batchWorkProduct,
        testFolder: tc.testFolder || batchTestFolder
      }))

    if (toUpload.length === 0) {
      toast.error('Please select cases to sync')
      return
    }

    setUploading(true)
    setSyncResult(null)
    try {
      const res = await rallyApi.upload({
        testCases: toUpload,
        storyKey: batchWorkProduct || selectedIssue?.key,
        rallyConfigId: selectedRallyId
      })

      setSyncResult(res.data)
      if (res.data.success) toast.success(`Synced ${toUpload.length} cases to Rally`)
      else toast.error('Upload failed')
    } catch (e: any) {
      toast.error('Rally connection error')
    } finally {
      setUploading(false)
    }
  }

  return (
    <>
      <div className="min-h-screen bg-[#f8fafc] p-8 md:p-12">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-2xl overflow-hidden min-h-[700px] flex flex-col">

            <div className="bg-white p-8 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                  <Zap size={28} className="fill-current" />
                </div>
                <div>
                  <h1 className="text-2xl font-black tracking-tight text-slate-900">Test Case Generator</h1>
                  <p className="text-slate-500 text-sm font-medium">Draft, review, and sync test cases with AI precision.</p>
                </div>
              </div>
              <div className="flex items-center space-x-2 bg-slate-50 p-1 rounded-xl border border-slate-100">
                {['fetch', 'generate', 'review', 'upload'].map((tab, idx) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${activeTab === tab ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-400'}`}
                  >
                    {idx + 1}. {tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 p-8 overflow-y-auto">
              {activeTab === 'fetch' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="max-w-xl mx-auto space-y-6">
                    {rallyConfigs.length > 1 && (
                      <div className="space-y-2">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Target Rally Workspace</label>
                        <select
                          value={selectedRallyId}
                          onChange={(e) => setSelectedRallyId(e.target.value)}
                          className="w-full h-14 px-5 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold outline-none focus:border-emerald-500"
                        >
                          {rallyConfigs.map(c => <option key={c.id} value={c.id}>{c.workspaceName || 'Default Workspace'} ({c.instanceUrl})</option>)}
                        </select>
                      </div>
                    )}
                    <div className="space-y-3">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Rally Formatted ID (e.g. US31488)</label>
                      <input
                        type="text"
                        placeholder="Enter ID..."
                        value={projectKey}
                        onChange={(e) => setProjectKey(e.target.value.toUpperCase())}
                        className="w-full h-14 px-5 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold outline-none focus:border-emerald-500 transition-all uppercase"
                      />
                    </div>
                    <button
                      onClick={handleFetchRequirements}
                      disabled={fetching}
                      className="w-full h-14 bg-emerald-500 text-white rounded-xl font-black hover:bg-emerald-600 transition-all flex items-center justify-center space-x-3 shadow-xl shadow-emerald-100"
                    >
                      {fetching ? <RefreshCw className="animate-spin" size={20} /> : <Search size={20} />}
                      <span>Fetch Requirement</span>
                    </button>
                  </div>

                  {fetchedIssues.length > 0 && (
                    <div className="pt-8 space-y-6">
                      <div>
                        <h3 className="text-sm font-black text-slate-700 mb-4 flex items-center space-x-2">
                          <FileCheck size={18} className="text-emerald-500" />
                          <span>SELECT REQUIREMENT</span>
                        </h3>
                        <div className="grid grid-cols-1 gap-3">
                          {fetchedIssues.map((issue) => (
                            <div
                              key={issue.key}
                              onClick={() => setSelectedIssue(issue)}
                              className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between ${selectedIssue?.key === issue.key ? 'border-emerald-500 bg-emerald-50' : 'border-slate-50 hover:border-slate-200'}`}
                            >
                              <div className="flex items-center space-x-4">
                                <span className="text-xs font-black text-emerald-600 bg-white px-2 py-1 rounded-md border border-emerald-100">{issue.key}</span>
                                <span className="font-bold text-slate-700">{issue.title}</span>
                              </div>
                              {selectedIssue?.key === issue.key && <CheckCircle2 className="text-emerald-500" size={20} />}
                            </div>
                          ))}
                        </div>
                      </div>

                      {selectedIssue && (
                        <div className="pt-4 flex justify-end">
                          <button
                            onClick={() => setActiveTab('generate')}
                            className="px-8 py-3 bg-emerald-500 text-white rounded-xl font-black hover:bg-emerald-600 transition-all flex items-center space-x-2 shadow-lg shadow-emerald-100"
                          >
                            <span>Proceed to Generation</span>
                            <ChevronRight size={18} />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'generate' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-3xl mx-auto">
                  <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-2xl flex items-start space-x-4">
                    <AlertCircle className="text-emerald-600 mt-1" size={24} />
                    <div>
                      <h3 className="font-black text-emerald-900">Step 2: AI Configuration</h3>
                      <p className="text-emerald-700 text-sm mt-1">Select your model and provide any custom guidance for the generator.</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Selected Story</label>
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 font-bold text-slate-700">
                        {selectedIssue ? `${selectedIssue.key}: ${selectedIssue.title}` : 'None selected'}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Select AI Model</label>
                      <select
                        value={selectedLlmId}
                        onChange={(e) => setSelectedLlmId(e.target.value)}
                        className="w-full h-14 px-5 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold outline-none focus:border-emerald-500"
                      >
                        {llmConfigs.map(config => (
                          <option key={config.id} value={config.id}>{config.name} ({config.model})</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Personalize instructions (Optional)</label>
                      <textarea
                        value={additionalContext}
                        onChange={(e) => setAdditionalContext(e.target.value)}
                        placeholder="e.g. Include negative cases and focus on API boundary testing."
                        className="w-full h-40 p-5 bg-white border-2 border-emerald-500 rounded-2xl font-medium outline-none focus:ring-4 focus:ring-emerald-50 transition-all shadow-sm"
                      />
                    </div>

                    <button
                      onClick={handleGenerateCases}
                      disabled={generating || !selectedIssue}
                      className="w-full h-16 bg-emerald-500 text-white rounded-2xl font-black text-lg hover:bg-emerald-600 transition-all flex items-center justify-center space-x-3 shadow-xl shadow-emerald-200 disabled:opacity-50"
                    >
                      {generating ? <RefreshCw className="animate-spin" size={24} /> : <Zap size={24} className="fill-current" />}
                      <span>{generating ? 'Generating...' : 'Generate Test Cases'}</span>
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'review' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <h2 className="text-xl font-black text-slate-900">Review Results ({generatedTestCases.length})</h2>
                      <div className="h-6 w-px bg-slate-200" />
                      <button
                        onClick={toggleAll}
                        className="flex items-center space-x-2 text-xs font-black text-emerald-600 hover:text-emerald-700 transition-colors uppercase tracking-wider"
                      >
                        {selectedIds.size === generatedTestCases.length ? '( Deselect All )' : '( Select All )'}
                      </button>
                      <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-2 py-1 rounded tracking-widest">{selectedIds.size} SELECTED</span>
                    </div>
                    <div className="flex space-x-3">
                      <button
                        onClick={handleExportExcel}
                        disabled={selectedIds.size === 0}
                        className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all font-bold text-xs shadow-lg shadow-emerald-100 disabled:opacity-50"
                      >
                        <FileUp size={16} /> <span>Export Excel</span>
                      </button>
                      <button
                        onClick={handleExport}
                        disabled={selectedIds.size === 0}
                        className="flex items-center space-x-2 px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all font-bold text-xs text-slate-600 disabled:opacity-50"
                      >
                        <FileDown size={16} /> <span>Export JSON</span>
                      </button>
                    </div>
                  </div>


                  <div className="grid grid-cols-1 gap-6">
                    {generatedTestCases.map((tc, idx) => (
                      <div
                        key={tc.id}
                        className={`bg-white border-2 rounded-2xl overflow-hidden transition-all ${selectedIds.has(tc.id) ? 'border-emerald-500 shadow-lg shadow-emerald-50' : 'border-slate-50 hover:border-slate-200'}`}
                      >
                        <div
                          className={`p-4 border-b flex items-center justify-between cursor-pointer ${selectedIds.has(tc.id) ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100'}`}
                          onClick={() => toggleSelect(tc.id)}
                        >
                          <div className="flex items-center space-x-4">
                            <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${selectedIds.has(tc.id) ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-300 shadow-inner'}`}>
                              {selectedIds.has(tc.id) && <Check size={14} strokeWidth={4} />}
                            </div>
                            <div className="flex items-center space-x-3">
                              <span className="text-xs font-black text-slate-400">{tc.caseId}</span>
                              <h4 className="font-black text-slate-800">{tc.title}</h4>
                            </div>
                          </div>
                          <div className="flex items-center space-x-6">
                            <span className="px-2 py-1 bg-white border border-slate-200 text-[10px] font-black rounded uppercase text-slate-500">{tc.priority}</span>
                            <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-black rounded uppercase">{tc.status || 'NEW'}</span>
                          </div>
                        </div>
                        <div className="p-6 space-y-6">
                          {/* Inline Editable Fields */}
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pb-6 border-b border-slate-100">
                            <div className="space-y-1">
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Method</label>
                              <select
                                value={tc.method || 'Manual'}
                                onChange={(e) => updateTestCase(tc.id, { method: e.target.value })}
                                className="w-full h-8 px-2 bg-slate-50 border border-slate-200 rounded text-xs font-bold outline-none focus:border-emerald-500"
                              >
                                <option value="Manual">Manual</option>
                                <option value="Automate">Automate</option>
                              </select>
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Status</label>
                              <select
                                value={tc.status || 'New'}
                                onChange={(e) => updateTestCase(tc.id, { status: e.target.value })}
                                className="w-full h-8 px-2 bg-slate-50 border border-slate-200 rounded text-xs font-bold outline-none focus:border-emerald-500"
                              >
                                <option value="New">New</option>
                                <option value="In review">In review</option>
                                <option value="Approved">Approved</option>
                                <option value="Retired">Retired</option>
                              </select>
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Priority</label>
                              <select
                                value={tc.priority || 'Medium'}
                                onChange={(e) => updateTestCase(tc.id, { priority: e.target.value })}
                                className="w-full h-8 px-2 bg-slate-50 border border-slate-200 rounded text-xs font-bold outline-none focus:border-emerald-500"
                              >
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                              </select>
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Type</label>
                              <select
                                value={tc.type || 'Functional'}
                                onChange={(e) => updateTestCase(tc.id, { type: e.target.value })}
                                className="w-full h-8 px-2 bg-slate-50 border border-slate-200 rounded text-xs font-bold outline-none focus:border-emerald-500"
                              >
                                <option value="Functional">Functional</option>
                                <option value="Performance">Performance</option>
                              </select>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                              <div>
                                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Preconditions</h5>
                                <ul className="space-y-1">
                                  {tc.preconditions.map((p, i) => <li key={i} className="text-sm font-medium text-slate-600 flex items-center space-x-2"><div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" /> <span>{p}</span></li>)}
                                </ul>
                              </div>
                              {tc.testData !== undefined && (
                                <div>
                                  <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Test Data</h5>
                                  <textarea
                                    value={typeof tc.testData === 'string' ? tc.testData : JSON.stringify(tc.testData, null, 2)}
                                    onChange={(e) => updateTestCase(tc.id, { testData: e.target.value })}
                                    className="w-full h-24 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:border-emerald-500 resize-none"
                                    placeholder="Enter test data required..."
                                  />
                                </div>
                              )}
                            </div>
                            <div className="space-y-6">
                              <div>
                                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Steps</h5>
                                <div className="space-y-3">
                                  {tc.steps.map((s, i) => (
                                    <div key={i} className="text-xs p-3 bg-slate-50 rounded-lg border border-slate-100">
                                      <p className="font-black text-slate-800">{i + 1}. {s.action}</p>
                                      <p className="text-emerald-600 font-bold mt-1">Expected: {s.expectedResult}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'upload' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-3xl mx-auto py-12 text-center">
                  <div className="w-24 h-24 bg-emerald-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-emerald-600 border-2 border-emerald-100 shadow-inner">
                    <Database size={48} />
                  </div>
                  <h2 className="text-3xl font-black text-slate-900">Synchronize to Rally</h2>
                  <p className="text-slate-500 font-medium text-lg leading-relaxed">
                    Upload <span className="text-emerald-600 font-black">{selectedIds.size} selected</span> test cases directly to Rally story <span className="font-black text-slate-900">{selectedIssue?.key}</span>.
                  </p>

                  {selectedIds.size === 0 && (
                    <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl text-orange-800 font-bold text-sm">
                      ⚠️ No test cases selected. Please go back to the Review tab to select cases to sync.
                    </div>
                  )}

                  <div className="bg-slate-50 border-2 border-slate-100 rounded-3xl p-8 grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Target Work Product (Story ID)</label>
                      <input
                        type="text"
                        value={batchWorkProduct}
                        onChange={(e) => setBatchWorkProduct(e.target.value)}
                        className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl font-bold text-base outline-none focus:border-emerald-500 transition-all shadow-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Target Test Folder (ID or Name)</label>
                      <input
                        type="text"
                        value={batchTestFolder}
                        onChange={(e) => setBatchTestFolder(e.target.value)}
                        placeholder="e.g. TF5375"
                        className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl font-bold text-base outline-none focus:border-emerald-500 transition-all shadow-sm"
                      />
                    </div>
                  </div>

                  {syncResult && (
                    <div className={`p-6 rounded-2xl border-2 ${syncResult.success ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-red-50 border-red-100 text-red-800'}`}>
                      <div className="flex items-center space-x-3 mb-2">
                        {syncResult.success ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
                        <h4 className="font-black text-lg">{syncResult.success ? 'Success' : 'Failed'}</h4>
                      </div>
                      <p className="font-bold mb-4">{syncResult.message}</p>

                      {syncResult.errors && syncResult.errors.length > 0 && (
                        <div className="mt-4 text-left bg-white/50 rounded-xl p-4 space-y-2 border border-black/5">
                          <p className="text-[10px] font-black uppercase tracking-widest opacity-50">Detailed Error Logs</p>
                          <ul className="space-y-1">
                            {syncResult.errors.map((err: string, i: number) => (
                              <li key={i} className="text-xs font-bold font-mono break-all">• {err}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    onClick={handleUploadToRally}
                    disabled={uploading || generatedTestCases.length === 0}
                    className="w-full h-20 bg-emerald-600 text-white rounded-3xl font-black text-xl hover:bg-emerald-700 transition-all flex items-center justify-center space-x-4 shadow-2xl shadow-emerald-200 disabled:opacity-50"
                  >
                    {uploading ? <Loader className="animate-spin" size={28} /> : <Upload size={28} />}
                    <span>{uploading ? 'Syncing...' : 'Confirm Upload to Rally'}</span>
                  </button>
                </div>
              )}
            </div>

            <div className="p-8 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <button
                onClick={() => {
                  if (activeTab === 'upload') setActiveTab('review')
                  else if (activeTab === 'review') setActiveTab('generate')
                  else if (activeTab === 'generate') setActiveTab('fetch')
                }}
                disabled={activeTab === 'fetch'}
                className="px-6 py-3 bg-white border border-slate-200 rounded-xl font-black text-slate-600 hover:bg-slate-50 disabled:opacity-30 transition-all"
              >
                Previous
              </button>
              <div className="flex items-center space-x-2">
                {[1, 2, 3, 4].map(n => <div key={n} className={`w-2 h-2 rounded-full ${activeTab === ['fetch', 'generate', 'review', 'upload'][n - 1] ? 'w-8 bg-emerald-500' : 'bg-slate-300'} transition-all`} />)}
              </div>
              <button
                onClick={() => {
                  if (activeTab === 'fetch') setActiveTab('generate')
                  else if (activeTab === 'generate') setActiveTab('review')
                  else if (activeTab === 'review') setActiveTab('upload')
                }}
                disabled={activeTab === 'upload' || (activeTab === 'fetch' && !selectedIssue) || (activeTab === 'generate' && generatedTestCases.length === 0)}
                className="px-8 py-3 bg-slate-900 text-white rounded-xl font-black hover:bg-slate-800 disabled:opacity-30 flex items-center space-x-2 transition-all"
              >
                <span>Next</span>
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Modal — waits for user to dismiss */}
      {errorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setErrorModal(null)}
          />
          <div className="relative w-full max-w-lg bg-white rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-300">
            <div className="h-2 w-full bg-gradient-to-r from-red-500 to-rose-500" />
            <div className="p-10">
              <div className="flex items-start space-x-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-red-50 border-2 border-red-100 flex items-center justify-center flex-shrink-0">
                  <XCircle size={32} className="text-red-500" />
                </div>
                <div className="pt-1">
                  <h2 className="text-xl font-black text-slate-900">{errorModal?.title}</h2>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1">Test Case Generator · Rally</p>
                </div>
              </div>
              <div className="bg-red-50 border border-red-100 rounded-2xl p-5 mb-8">
                <p className="text-sm font-bold text-red-700 leading-relaxed">{errorModal?.detail}</p>
              </div>
              <div className="space-y-3 mb-8">
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">What to check</p>
                <ul className="space-y-2">
                  {[
                    'Verify your LLM connection is active (AI Configuration page)',
                    'Ensure the Ollama service is running and reachable via Ngrok',
                    'Confirm OLLAMA_ORIGINS=* is set on your local machine',
                    'Check that a valid Rally story was fetched before generating'
                  ].map((tip, i) => (
                    <li key={i} className="flex items-start space-x-2 text-sm text-slate-600 font-medium">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2 flex-shrink-0" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={() => setErrorModal(null)}
                  className="flex-1 h-12 bg-slate-900 text-white rounded-xl font-black hover:bg-slate-800 transition-all"
                >
                  Close &amp; Retry
                </button>
                <button
                  onClick={() => { setErrorModal(null); window.location.href = '/connections/llm' }}
                  className="h-12 px-6 bg-white border-2 border-slate-200 text-slate-700 rounded-xl font-black hover:bg-slate-50 transition-all text-sm"
                >
                  Check LLM Config
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default TestCaseGenerator
