import React, { useState, useEffect } from 'react'
import { FileText, RefreshCw, Zap, Trash2, Download, Database, ChevronRight, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { generatorApi, rallyApi, llmApi } from '../services/api'

interface TestPlan {
  id: string
  name: string
  generatedAt: string
  status: 'draft' | 'finalized' | 'synced'
  testCases?: number
}

interface RallyStory {
  key: string
  title: string
  description: string
  notes?: string
  requirements?: string
  issueType: string
  status: string
  priority: string
}

const TestPlanGenerator: React.FC = () => {
  const [testPlans, setTestPlans] = useState<TestPlan[]>([])
  const [llmConfigs, setLlmConfigs] = useState<any[]>([])
  const [selectedLlmConfigId, setSelectedLlmConfigId] = useState('')
  const [rallyConfigs, setRallyConfigs] = useState<any[]>([])
  const [selectedRallyConfigId, setSelectedRallyConfigId] = useState('')

  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [fetching, setFetching] = useState(false)

  const [projectKey, setProjectKey] = useState('')
  const [additionalContext, setAdditionalContext] = useState('')
  const [fetchedIssues, setFetchedIssues] = useState<RallyStory[]>([])
  const [selectedIssue, setSelectedIssue] = useState<RallyStory | null>(null)
  const [showGeneratedModal, setShowGeneratedModal] = useState(false)
  const [generatedContent, setGeneratedContent] = useState<any>(null)
  const [errorModal, setErrorModal] = useState<{ title: string; detail: string } | null>(null)

  useEffect(() => {
    loadPrerequisites()
    loadHistory()
  }, [])

  const loadPrerequisites = async () => {
    try {
      const [llmRes, rallyRes] = await Promise.all([
        llmApi.getConfigs(),
        rallyApi.getConfigs()
      ])
      setLlmConfigs(llmRes.data)
      if (llmRes.data.length > 0) setSelectedLlmConfigId(llmRes.data[0].id)
      
      setRallyConfigs(rallyRes.data)
      if (rallyRes.data.length > 0) setSelectedRallyConfigId(rallyRes.data[0].id)
    } catch (e) {
      console.error(e)
    }
  }

  const loadHistory = async () => {
    try {
      const res = await generatorApi.getTestPlans()
      setTestPlans(res.data)
    } catch (e) {
      console.error(e)
    }
  }

  const handleFetchDetails = async () => {
    if (!projectKey.trim()) {
      toast.error('Please enter a Rally ID (e.g. US30890)')
      return
    }
    setFetching(true)
    setFetchedIssues([])
    setSelectedIssue(null)
    try {
      const res = await rallyApi.fetchRequirements({
        query: projectKey,
        rallyConfigId: selectedRallyConfigId
      })
      if (res.data?.success && res.data.requirements?.length > 0) {
        setFetchedIssues(res.data.requirements)
        setSelectedIssue(res.data.requirements[0])
        toast.success(`Fetched story from Rally`)
      } else {
        setErrorModal({ title: 'Fetch Failed', detail: res.data.message || 'Story not found in Rally.' })
      }
    } catch (error: any) {
      setErrorModal({ title: 'Connection Error', detail: error?.response?.data?.message || error?.message || 'Failed to fetch Rally details' })
    } finally {
      setFetching(false)
    }
  }

  const handleGenerateTestPlan = async () => {
    if (!additionalContext.trim() && !selectedIssue) {
      toast.error('Please fetch a Rally story or provide additional context')
      return
    }

    setGenerating(true)
    try {
      const stripHtml = (html: string) => html ? html.replace(/<[^>]*>?/gm, '').trim() : 'N/A';
      
      const res = await generatorApi.generateTestPlan({
        jiraIssueId: selectedIssue?.key || 'MANUAL',
        jiraRequirement: selectedIssue ? JSON.stringify(selectedIssue) : undefined,
        llmConfigId: selectedLlmConfigId || llmConfigs[0]?.id,
        context: `
Title: ${selectedIssue?.title || 'N/A'}
Description: ${stripHtml(selectedIssue?.description)}
Requirements: ${stripHtml(selectedIssue?.requirements)}
Notes: ${stripHtml(selectedIssue?.notes)}
Additional Context: ${additionalContext || 'N/A'}
`.trim()
      })

      setGeneratedContent(res.data)
      setShowGeneratedModal(true)
      toast.success('Test Plan Generated Successfully!')
      await loadHistory()
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to generate test plan.')
    } finally {
      setGenerating(false)
    }
  }

  const handleDeletePlan = async (id: string) => {
    if (window.confirm('Delete this test plan?')) {
      try {
        await generatorApi.deleteTestPlan(id)
        toast.success('Test plan deleted')
        await loadHistory()
      } catch (error) {
        toast.error('Failed to delete test plan')
      }
    }
  }

  const handleExportJson = () => {
    if (!generatedContent) return
    const blob = new Blob([JSON.stringify(generatedContent, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `test-plan-${Date.now()}.json`
    a.click()
    toast.success('Exported as JSON')
  }

  const handleExportExcel = () => {
    if (!generatedContent) return
    let content: any = {}
    try {
      content = JSON.parse(generatedContent.content)
    } catch {
      toast.error('Could not parse content for export')
      return
    }

    const headers = ['Section', 'Content']
    const rows = [
      ['Plan Name', generatedContent.name],
      ['Objectives', (content.objectives || []).join('; ')],
      ['Strategy', content.strategy || ''],
      ['Timeline', content.timeline || ''],
      ['Exit Criteria', (content.exitCriteria || []).join('; ')]
    ]

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${(cell || '').toString().replace(/"/g, '""')}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `test-plan-${selectedIssue?.key || 'export'}.csv`)
    link.click()
    toast.success('Exported to Excel (CSV)')
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] p-8 md:p-12">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden p-12">
          {/* Header */}
          <div className="flex items-center space-x-4 mb-10">
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
              <FileText size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-[#0f172a]">Test Plan Generator</h1>
              <p className="text-slate-500 mt-1 font-medium">Fetch Rally stories and generate an AI-powered test plan.</p>
            </div>
          </div>

          <div className="space-y-8">
            {/* Rally Instance Display */}
            {rallyConfigs.length > 1 ? (
              <div className="space-y-3">
                <label className="text-[11px] font-black text-slate-400 tracking-widest uppercase">Target Rally Workspace</label>
                <select 
                  value={selectedRallyConfigId}
                  onChange={(e) => setSelectedRallyConfigId(e.target.value)}
                  className="w-full h-16 px-6 bg-slate-50 border-2 border-slate-100 rounded-2xl text-slate-700 font-bold focus:border-emerald-500 appearance-none outline-none"
                >
                  {rallyConfigs.map(c => <option key={c.id} value={c.id}>{c.workspaceName || 'Default Workspace'} ({c.instanceUrl})</option>)}
                </select>
              </div>
            ) : (
              <div className="space-y-3">
                <label className="text-[11px] font-black text-slate-400 tracking-widest uppercase">Rally Connection</label>
                <div className="w-full h-16 px-6 bg-slate-50 border-2 border-slate-100 rounded-2xl flex items-center">
                  <span className="text-slate-700 font-bold whitespace-nowrap overflow-hidden text-ellipsis">
                    {rallyConfigs[0]?.workspaceName || 'Connected to Rally Enterprise'} ({rallyConfigs[0]?.instanceUrl || '...' })
                  </span>
                </div>
              </div>
            )}

            {/* Project/Workspace Context */}
            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-400 tracking-widest uppercase">Formatted ID (e.g. US30890)</label>
              <input
                type="text"
                value={projectKey}
                onChange={(e) => setProjectKey(e.target.value.toUpperCase())}
                placeholder="e.g. US30890"
                className="w-full h-16 px-6 bg-slate-50 border-2 border-slate-100 rounded-2xl text-slate-700 font-bold focus:border-emerald-500 focus:bg-white transition-all uppercase outline-none"
              />
            </div>

            {/* Additional Context */}
            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-400 tracking-widest uppercase text-emerald-600">Additional Context (Optional)</label>
              <textarea
                placeholder="e.g. Create a small test plan covering the login and registration flows"
                value={additionalContext}
                onChange={(e) => setAdditionalContext(e.target.value)}
                className="w-full h-32 px-6 py-4 bg-white border-2 border-emerald-500 rounded-2xl text-slate-700 font-medium focus:ring-4 focus:ring-emerald-100 transition-all resize-none shadow-sm outline-none"
              />
            </div>

            {/* Action Buttons — Same Size */}
            <div className="flex items-center space-x-6 pt-2">
              <button
                onClick={handleFetchDetails}
                disabled={fetching}
                className="flex-1 h-14 bg-emerald-500 text-white rounded-2xl font-black hover:bg-emerald-600 transition-all disabled:opacity-50 flex items-center justify-center space-x-3 shadow-lg shadow-emerald-100"
              >
                <RefreshCw size={20} className={fetching ? 'animate-spin' : ''} />
                <span>{fetching ? 'Fetching...' : 'Fetch Details'}</span>
              </button>
              <button
                onClick={handleGenerateTestPlan}
                disabled={generating}
                className="flex-1 h-14 bg-emerald-500 text-white rounded-2xl font-black hover:bg-emerald-600 transition-all disabled:opacity-50 shadow-lg shadow-emerald-100 flex items-center justify-center space-x-3"
              >
                <Zap size={22} className="fill-current" />
                <span>{generating ? 'Generating...' : 'Generate Test Plan'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Fetched Issues Preview */}
        {fetchedIssues.length > 0 && (
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl p-8 space-y-8">
            <div>
              <h2 className="text-xl font-black text-[#0f172a] mb-6">📋 Fetched Rally Stories ({fetchedIssues.length})</h2>
              <div className="space-y-4">
                {fetchedIssues.map(issue => (
                  <div
                    key={issue.key}
                    onClick={() => setSelectedIssue(issue)}
                    className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                      selectedIssue?.key === issue.key
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-slate-100 hover:border-emerald-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-black text-emerald-600 uppercase">{issue.key}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600 font-bold">{issue.issueType}</span>
                        <span className="text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 font-bold">{issue.status}</span>
                        <span className="text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-700 font-bold">{issue.priority}</span>
                      </div>
                    </div>
                    <p className="font-bold text-[#0f172a]">{issue.title}</p>
                  </div>
                ))}
              </div>
            </div>

            {selectedIssue && (
              <div className="bg-slate-50 rounded-3xl overflow-hidden border border-slate-100 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="bg-slate-900 p-6 text-white flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Database size={20} className="text-emerald-400" />
                    <h3 className="font-black tracking-tight uppercase text-sm">Story Content: {selectedIssue.key}</h3>
                  </div>
                </div>
                <div className="p-8 space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</label>
                    <div className="p-5 bg-white rounded-2xl border border-slate-100 text-sm text-slate-600 leading-relaxed font-medium max-h-60 overflow-y-auto shadow-sm" dangerouslySetInnerHTML={{ __html: selectedIssue.description || '<span class="italic opacity-50">No description</span>' }} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Technical Requirements</label>
                      <div className="p-5 bg-white rounded-2xl border border-slate-100 text-sm text-slate-600 leading-relaxed font-medium max-h-48 overflow-y-auto shadow-sm" dangerouslySetInnerHTML={{ __html: selectedIssue.requirements || '<span class="italic opacity-50">None</span>' }} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Notes</label>
                      <div className="p-5 bg-white rounded-2xl border border-slate-100 text-sm text-slate-600 leading-relaxed font-medium max-h-48 overflow-y-auto shadow-sm" dangerouslySetInnerHTML={{ __html: selectedIssue.notes || '<span class="italic opacity-50">None</span>' }} />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* History Section */}
        {testPlans.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-[#0f172a] mb-6 px-4">Recent Test Plans</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {testPlans.map(plan => (
                <div key={plan.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-[#0f172a]">{plan.name}</h3>
                      <p className="text-sm text-slate-500">{new Date(plan.generatedAt).toLocaleDateString()}</p>
                    </div>
                    <button onClick={() => handleDeletePlan(plan.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                      <Trash2 size={18} />
                    </button>
                  </div>
                  <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${
                    plan.status === 'finalized' ? 'bg-green-100 text-green-700' :
                    plan.status === 'synced' ? 'bg-emerald-100 text-emerald-700' :
                    'bg-slate-100 text-slate-600'
                  }`}>{plan.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Generated Test Plan Modal */}
      {showGeneratedModal && generatedContent && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-[#0f172a]">✅ Test Plan Generated</h2>
                <p className="text-slate-500 text-sm mt-1">{generatedContent.name}</p>
              </div>
              <button onClick={() => setShowGeneratedModal(false)} className="text-slate-400 hover:text-slate-600 text-2xl font-bold">✕</button>
            </div>
            <div className="p-8 overflow-y-auto flex-1 space-y-6">
              {generatedContent.content && (() => {
                try {
                  const c = JSON.parse(generatedContent.content)
                  return (
                    <>
                      {c.objectives && (
                        <div>
                          <h3 className="font-black text-slate-800 mb-2">🎯 Objectives</h3>
                          <ul className="list-disc list-inside space-y-1 text-slate-600">
                            {c.objectives.map((o: string, i: number) => <li key={i}>{o}</li>)}
                          </ul>
                        </div>
                      )}
                      {c.strategy && <div><h3 className="font-black text-slate-800 mb-1">📋 Strategy</h3><p className="text-slate-600">{c.strategy}</p></div>}
                      {c.timeline && <div><h3 className="font-black text-slate-800 mb-1">⏱ Timeline</h3><p className="text-slate-600">{c.timeline}</p></div>}
                      {c.exitCriteria && (
                        <div>
                          <h3 className="font-black text-slate-800 mb-2">✅ Exit Criteria</h3>
                          <ul className="list-disc list-inside space-y-1 text-slate-600">
                            {c.exitCriteria.map((e: string, i: number) => <li key={i}>{e}</li>)}
                          </ul>
                        </div>
                      )}
                    </>
                  )
                } catch {
                  return <pre className="whitespace-pre-wrap text-sm text-slate-700 font-mono bg-slate-50 p-6 rounded-2xl">{JSON.stringify(generatedContent, null, 2)}</pre>
                }
              })()}
            </div>
            <div className="p-8 bg-slate-50 flex gap-4">
              <button onClick={handleExportExcel} className="flex-1 h-12 bg-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-100">
                <Download size={18} /> Export Excel
              </button>
              <button onClick={handleExportJson} className="flex-1 h-12 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold flex items-center justify-center gap-2">
                <Download size={18} /> Export JSON
              </button>
              <button onClick={() => setShowGeneratedModal(false)} className="px-8 h-12 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold">Close</button>
            </div>
          </div>
        </div>
      )}

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
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1">Test Plan Generator · Rally</p>
                </div>
              </div>
              <div className="bg-red-50 border border-red-100 rounded-2xl p-5 mb-8">
                <p className="text-sm font-bold text-red-700 leading-relaxed">{errorModal?.detail}</p>
              </div>
              <div className="space-y-3 mb-8">
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">What to check</p>
                <ul className="space-y-2">
                  {[
                    'Ensure your Rally API Key is valid and hasn\'t expired',
                    'Verify the URL matches your Enterprise Rally environment',
                    'Check if the provided Formatted ID actually exists in the selected project',
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
                  onClick={() => { setErrorModal(null); window.location.href = '/connections/rally' }}
                  className="h-12 px-6 bg-white border-2 border-slate-200 text-slate-700 rounded-xl font-black hover:bg-slate-50 transition-all text-sm "
                >
                  Check Rally Config
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TestPlanGenerator
