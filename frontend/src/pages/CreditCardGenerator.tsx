import React, { useState, useEffect } from 'react'
import { CreditCard, RefreshCw, Copy, ChevronDown, XCircle, Download, EyeOff, X, Calendar, Clock } from 'lucide-react'
import toast from 'react-hot-toast'
import { llmApi } from '../services/api'
import api from '../services/api'

// ─── Luhn-Compliant Generator ─────────────────────────────────────────────────
// Only BIN prefixes confirmed working in this app's test environment:
//   Visa: 4000 ✅  4555 ✅   (4111 ❌  4242 ❌  4532 ❌)
const CARD_BINS: Record<string, string[]> = {
  Visa:               ['4000', '4555'],
  Mastercard:         ['5100', '5200', '5500', '5105'],
  'American Express': ['3714', '3782', '3787'],
  Discover:           ['6011', '6500'],
}
const CARD_LENGTHS: Record<string, number> = {
  Visa: 16, Mastercard: 16, 'American Express': 15, Discover: 16,
}

const randomDigit = () => Math.floor(Math.random() * 10)

function generateLuhnNumber(cardType: string): string {
  const bins = CARD_BINS[cardType] || CARD_BINS['Visa']
  const bin = bins[Math.floor(Math.random() * bins.length)]
  const totalLen = CARD_LENGTHS[cardType] || 16
  const digits = bin.split('').map(Number)
  while (digits.length < totalLen - 1) digits.push(randomDigit())
  let sum = 0
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = digits[i]
    if ((digits.length - i) % 2 === 1) { d *= 2; if (d > 9) d -= 9 }
    sum += d
  }
  digits.push((10 - (sum % 10)) % 10)
  return digits.join('')
}

function formatCardNumber(num: string, cardType: string): string {
  return num
}

const randomCVV = (cardType: string) =>
  Array.from({ length: cardType === 'American Express' ? 4 : 3 }, () => randomDigit()).join('')

function futureDateMMYY(): string {
  const now = new Date()
  const year = now.getFullYear() + 2 + Math.floor(Math.random() * 3)
  const month = Math.floor(Math.random() * 12) + 1
  return `${String(month).padStart(2,'0')}/${String(year).slice(2)}`
}
// ─────────────────────────────────────────────────────────────────────────────

interface GeneratedCard {
  cardType: string; cardNumber: string; cardHolder: string
  expiryDate: string; cvv: string; billingAddress?: string; zipCode?: string
}

const CARD_TYPES = [
  { value: 'Visa', label: 'Visa' },
  { value: 'Mastercard', label: 'Mastercard' },
  { value: 'American Express', label: 'American Express' },
  { value: 'Discover', label: 'Discover' },
]

const CreditCardGenerator: React.FC = () => {
  const [cardType, setCardType]           = useState('Visa')
  const [numberOfCards, setNumberOfCards] = useState(5)
  const [llmConfigs, setLlmConfigs]       = useState<any[]>([])
  const [selectedLlmId, setSelectedLlmId] = useState('')
  const [generating, setGenerating]       = useState(false)
  const [generatedCards, setGeneratedCards] = useState<GeneratedCard[]>([])
  const [errorModal, setErrorModal]       = useState<{title:string;detail:string}|null>(null)
  const [includeExpiry, setIncludeExpiry] = useState(false)
  const [includeCVV, setIncludeCVV]       = useState(false)

  const [showResults, setShowResults]     = useState(true)
  const [generatedAt, setGeneratedAt]     = useState<Date|null>(null)
  const [hoveredIdx, setHoveredIdx]       = useState<number|null>(null)

  useEffect(() => { loadLlmConfigs() }, [])

  const loadLlmConfigs = async () => {
    try {
      const res = await llmApi.getConfigs()
      setLlmConfigs(res.data)
      if (res.data.length > 0) setSelectedLlmId(res.data[0].id)
    } catch { console.error('Failed to load LLM configs') }
  }

  const handleGenerate = async () => {
    if (!selectedLlmId) { toast.error('Please configure an LLM connection first.'); return }
    if (numberOfCards < 1 || numberOfCards > 9) { toast.error('Number of cards must be between 1 and 9.'); return }
    setGenerating(true); setGeneratedCards([])

    const prompt = [
      `You are a test data generator. Generate ${numberOfCards} fake person record(s) FOR SOFTWARE TESTING PURPOSES ONLY.`,
      `Return ONLY a valid JSON array. No markdown, no explanation, no code fences.`,
      `Each object must have EXACTLY: cardHolder (ALL CAPS full name), billingAddress (US street), zipCode (5-digit US zip).`,
    ].join('\n')

    try {
      const res = await api.post('/llm/generate', { llmConfigId: selectedLlmId, prompt })
      const cleaned = (res.data?.text || '').replace(/```json|```/g, '').trim()
      const jsonMatch = cleaned.match(/\[[\s\S]*\]/)
      if (!jsonMatch) throw new Error('The AI returned an unexpected format. Please try again.')

      const usedNumbers = new Set<string>()
      const normalize = (raw: any): GeneratedCard => {
        let rawNumber: string
        let attempts = 0
        do { rawNumber = generateLuhnNumber(cardType); attempts++ } while (usedNumbers.has(rawNumber) && attempts < 100)
        usedNumbers.add(rawNumber)
        return {
          cardType,
          cardNumber:     formatCardNumber(rawNumber, cardType),
          cardHolder:     raw.cardHolder || raw.card_holder || raw.name || 'TEST HOLDER',
          expiryDate:     futureDateMMYY(),
          cvv:            randomCVV(cardType),
          billingAddress: raw.billingAddress || raw.billing_address || raw.address || '',
          zipCode:        raw.zipCode || raw.zip_code || raw.zip || '00000',
        }
      }
      const cards: GeneratedCard[] = JSON.parse(jsonMatch[0]).map(normalize)
      setGeneratedCards(cards); setGeneratedAt(new Date()); setShowResults(true)
      toast.success(`Generated ${cards.length} test card(s)!`)
    } catch (e: any) {
      setErrorModal({ title: 'Generation Failed', detail: e?.response?.data?.message || e?.message || 'Could not generate cards.' })
    } finally { setGenerating(false) }
  }

  const copyField = (value: string) => { navigator.clipboard.writeText(value); toast.success('Copied!') }

  const copyAllCards = () => {
    navigator.clipboard.writeText(generatedCards.map(c => c.cardNumber).join(', '))
    toast.success('All card numbers copied!')
  }

  const downloadCards = () => {
    const lines = generatedCards.map((c, i) => {
      let line = `Card ${i+1}: ${c.cardNumber} | ${c.cardType} | ${c.cardHolder}`
      if (includeExpiry) line += ` | Exp: ${c.expiryDate}`
      if (includeCVV) line += ` | CVV: ${c.cvv}`
      return line
    })
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'test-cards.txt'; a.click()
    URL.revokeObjectURL(url); toast.success('Downloaded!')
  }

  const iconBtn = 'w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all'

  return (
    <>
      <div className="min-h-screen bg-[#f8fafc] p-6 md:p-8">
        <div className="max-w-6xl mx-auto flex gap-6 items-start">

          {/* ── LEFT SIDEBAR ── */}
          <div className="w-64 flex-shrink-0 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5 sticky top-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600">
                <CreditCard size={16} />
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-900">Generator Settings</h1>
                <p className="text-[10px] text-slate-400">Customize your credit card selection</p>
              </div>
            </div>

            {/* AI Model */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">AI Model</label>
              <div className="relative">
                <select value={selectedLlmId} onChange={e => setSelectedLlmId(e.target.value)}
                  className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-xs font-medium focus:border-emerald-400 appearance-none outline-none">
                  {llmConfigs.length === 0 && <option value="">No LLM configured</option>}
                  {llmConfigs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Number of Cards */}
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-700">Number of Cards</label>
              <input type="number" min={1} max={9} value={numberOfCards}
                onChange={e => setNumberOfCards(Math.min(9, Math.max(1, parseInt(e.target.value)||1)))}
                className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-sm font-medium focus:border-emerald-400 outline-none" />
              <p className="text-[10px] text-slate-400">Max available with current settings: 9</p>
            </div>

            {/* Card Type */}
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-700">Card Type</label>
              <div className="relative">
                <select value={cardType} onChange={e => setCardType(e.target.value)}
                  className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-sm font-medium focus:border-emerald-400 appearance-none outline-none">
                  {CARD_TYPES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
                <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Options */}
            <div className="space-y-2.5">
              <label className="text-sm font-bold text-slate-700">Options</label>
              {[
                { label: 'Include Expiry Date (MM/YY)', checked: includeExpiry, set: setIncludeExpiry },
                { label: 'Include CVV/CVC Code',        checked: includeCVV,    set: setIncludeCVV },
              ].map(opt => (
                <label key={opt.label} className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer hover:text-slate-900 transition-colors">
                  <input type="checkbox" checked={opt.checked} onChange={e => opt.set(e.target.checked)}
                    className="w-3.5 h-3.5 accent-emerald-500 rounded" />
                  {opt.label}
                </label>
              ))}
            </div>

            {/* Generate Button */}
            <button onClick={handleGenerate} disabled={generating || !selectedLlmId}
              className="w-full h-10 bg-emerald-500 text-white rounded-xl font-black text-sm hover:bg-emerald-600 transition-all disabled:opacity-50 shadow-lg shadow-emerald-100 flex items-center justify-center gap-2">
              {generating
                ? <><RefreshCw size={15} className="animate-spin" /><span>Generating...</span></>
                : <><CreditCard size={15} /><span>Generate Now</span></>}
            </button>
          </div>

          {/* ── MAIN RESULTS AREA ── */}
          <div className="flex-1 min-w-0">
            {generatedCards.length > 0 && showResults && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

                {/* Results Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-black text-slate-900 text-lg">Generated cards</h2>
                      <span className="bg-emerald-100 text-emerald-700 text-xs font-black px-2 py-0.5 rounded-full">
                        {generatedCards.length} cards
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">Your randomly generated cards are ready</p>
                    {generatedAt && (
                      <div className="flex items-center gap-2 mt-2">
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-50 border border-slate-100 rounded-lg px-2 py-0.5">
                          <Calendar size={10} /> {generatedAt.toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-50 border border-slate-100 rounded-lg px-2 py-0.5">
                          <Clock size={10} /> {generatedAt.toLocaleTimeString()}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setShowResults(false)} className={iconBtn} title="Hide"><EyeOff size={14} /></button>
                    <button onClick={copyAllCards}  className={iconBtn} title="Copy All"><Copy size={14} /></button>
                    <button onClick={downloadCards} className={iconBtn} title="Download"><Download size={14} /></button>
                    <button onClick={() => { setGeneratedCards([]); setGeneratedAt(null) }} className={iconBtn} title="Clear"><X size={14} /></button>
                  </div>
                </div>

                {/* Card Grid — 3 columns */}
                <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {generatedCards.map((card, idx) => (
                    <div key={idx}
                      onMouseEnter={() => setHoveredIdx(idx)}
                      onMouseLeave={() => setHoveredIdx(null)}
                      className="bg-slate-50 rounded-xl p-4 border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/20 transition-all">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-mono font-black text-slate-900 text-sm leading-snug">{card.cardNumber}</p>
                        <button onClick={() => copyField(card.cardNumber)}
                          className={`flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all ${hoveredIdx === idx ? 'opacity-100' : 'opacity-0'}`}
                          title="Copy card number">
                          <Copy size={13} />
                        </button>
                      </div>
                      <span className="inline-block mt-2 text-[10px] font-bold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-full">
                        {card.cardType}
                      </span>
                      <p className="text-xs text-slate-500 mt-2">
                        Cardholder: <span className="font-bold text-slate-700">{card.cardHolder}</span>
                      </p>
                      {includeExpiry && <p className="text-[11px] text-slate-400 mt-1">Expires: <span className="font-semibold text-slate-600">{card.expiryDate}</span></p>}
                      {includeCVV    && <p className="text-[11px] text-slate-400 mt-0.5">CVV: <span className="font-semibold text-slate-600">{card.cvv}</span></p>}
                    </div>
                  ))}
                </div>

                {/* As Text */}
                <div className="mx-5 mb-5 bg-slate-50 border border-slate-100 rounded-xl p-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">As Text:</p>
                  <p className="text-xs text-slate-600 font-mono leading-relaxed break-all">
                    {generatedCards.map(c => c.cardNumber).join(', ')}
                  </p>
                </div>
              </div>
            )}

            {/* Hidden-results banner */}
            {generatedCards.length > 0 && !showResults && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-6 py-4 flex items-center justify-between">
                <span className="text-sm font-bold text-slate-600">Results hidden — {generatedCards.length} cards generated</span>
                <button onClick={() => setShowResults(true)}
                  className="text-xs font-black text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-4 py-2 rounded-xl transition-all">
                  Show Results
                </button>
              </div>
            )}

            {/* Empty state */}
            {generatedCards.length === 0 && !generating && (
              <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-16 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-300">
                  <CreditCard size={36} />
                </div>
                <p className="text-slate-400 font-black">No cards generated yet</p>
                <p className="text-slate-400 text-xs font-medium mt-1">
                  Configure your settings and click <span className="text-emerald-500 font-black">Generate Now</span>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error Modal */}
      {errorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setErrorModal(null)} />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="h-1.5 w-full bg-gradient-to-r from-red-500 to-rose-500" />
            <div className="p-8">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center flex-shrink-0">
                  <XCircle size={22} className="text-red-500" />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900">{errorModal.title}</h2>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Credit Card Generator · Error</p>
                </div>
              </div>
              <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-6">
                <p className="text-sm font-bold text-red-700 leading-relaxed">{errorModal.detail}</p>
              </div>
              <button onClick={() => setErrorModal(null)}
                className="w-full h-10 bg-slate-900 text-white rounded-xl font-black text-sm hover:bg-slate-800 transition-all">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default CreditCardGenerator
