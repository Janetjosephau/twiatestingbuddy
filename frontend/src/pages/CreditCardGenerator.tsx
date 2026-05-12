import React, { useState, useEffect } from 'react'
import { CreditCard, RefreshCw, Copy, CheckCircle, ChevronDown, XCircle, Zap } from 'lucide-react'
import toast from 'react-hot-toast'
import { llmApi } from '../services/api'
import api from '../services/api'

// ─── Luhn-Compliant Card Number Generator ────────────────────────────────────
// BIN prefixes per network (real issuer ranges used for testing)
const CARD_BINS: Record<string, string[]> = {
  Visa:               ['4000', '4111', '4242', '4012', '4532', '4916', '4929', '4539'],
  Mastercard:         ['5100', '5200', '5300', '5400', '5500', '5105', '5425', '5521'],
  'American Express': ['3714', '3782', '3787', '3790', '3400', '3711'],
  Discover:           ['6011', '6221', '6440', '6450', '6500'],
}
const CARD_LENGTHS: Record<string, number> = {
  Visa: 16, Mastercard: 16, 'American Express': 15, Discover: 16,
}

function randomDigit() { return Math.floor(Math.random() * 10) }

function generateLuhnNumber(cardType: string): string {
  const bins = CARD_BINS[cardType] || CARD_BINS['Visa']
  const bin = bins[Math.floor(Math.random() * bins.length)]
  const totalLen = CARD_LENGTHS[cardType] || 16

  // BIN digits + random fill (leave last slot for check digit)
  const digits = bin.split('').map(Number)
  while (digits.length < totalLen - 1) digits.push(randomDigit())

  // Calculate Luhn check digit
  let sum = 0
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = digits[i]
    if ((digits.length - i) % 2 === 1) { d *= 2; if (d > 9) d -= 9 }
    sum += d
  }
  const checkDigit = (10 - (sum % 10)) % 10
  digits.push(checkDigit)
  return digits.join('')
}

function formatCardNumber(num: string, cardType: string): string {
  if (cardType === 'American Express') {
    return `${num.slice(0, 4)} ${num.slice(4, 10)} ${num.slice(10)}`
  }
  return num.replace(/(\d{4})(?=\d)/g, '$1 ').trim()
}

function randomCVV(cardType: string): string {
  const len = cardType === 'American Express' ? 4 : 3
  return Array.from({ length: len }, () => randomDigit()).join('')
}

function futureDateMMYY(): string {
  const now = new Date()
  const year = now.getFullYear() + 2 + Math.floor(Math.random() * 3)
  const month = Math.floor(Math.random() * 12) + 1
  return `${String(month).padStart(2, '0')}/${String(year).slice(2)}`
}
// ─────────────────────────────────────────────────────────────────────────────

interface GeneratedCard {
  cardType: string
  cardNumber: string
  cardHolder: string
  expiryDate: string
  cvv: string
  billingAddress?: string
  zipCode?: string
  note?: string
}

const CARD_TYPES = [
  { value: 'Visa', label: 'Visa', color: 'from-blue-600 to-blue-800' },
  { value: 'Mastercard', label: 'Mastercard', color: 'from-red-600 to-orange-600' },
  { value: 'American Express', label: 'American Express', color: 'from-green-600 to-teal-700' },
  { value: 'Discover', label: 'Discover', color: 'from-orange-500 to-yellow-600' },
]

const CreditCardGenerator: React.FC = () => {
  const [cardType, setCardType] = useState('Visa')
  const [numberOfCards, setNumberOfCards] = useState(1)
  const [llmConfigs, setLlmConfigs] = useState<any[]>([])
  const [selectedLlmId, setSelectedLlmId] = useState('')
  const [generating, setGenerating] = useState(false)
  const [generatedCards, setGeneratedCards] = useState<GeneratedCard[]>([])
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [errorModal, setErrorModal] = useState<{ title: string; detail: string } | null>(null)

  useEffect(() => {
    loadLlmConfigs()
  }, [])

  const loadLlmConfigs = async () => {
    try {
      const res = await llmApi.getConfigs()
      setLlmConfigs(res.data)
      if (res.data.length > 0) setSelectedLlmId(res.data[0].id)
    } catch (e) {
      console.error('Failed to load LLM configs')
    }
  }

  const handleGenerate = async () => {
    if (!selectedLlmId) {
      toast.error('Please configure an LLM connection first.')
      return
    }
    if (numberOfCards < 1 || numberOfCards > 20) {
      toast.error('Number of cards must be between 1 and 20.')
      return
    }

    setGenerating(true)
    setGeneratedCards([])

    // Card numbers, CVVs, and expiry are generated locally (Luhn-compliant).
    // The LLM is only asked for human-readable data: name and address.
    const prompt = [
      `You are a test data generator. Generate ${numberOfCards} fake person record(s) FOR SOFTWARE TESTING PURPOSES ONLY.`,
      `Return ONLY a valid JSON array. No markdown, no explanation, no code fences. Just the raw JSON array.`,
      `Each object must have EXACTLY these keys and nothing else:`,
      `cardHolder (string): realistic fake full name in ALL CAPS (e.g. "JANE M DOE")`,
      `billingAddress (string): realistic fake US street address (e.g. "123 Main St, Austin, TX")`,
      `zipCode (string): valid US zip code matching the address city (5 digits)`,
    ].join('\n')

    try {
      const res = await api.post('/llm/generate', { llmConfigId: selectedLlmId, prompt })
      const rawText: string = res.data?.text || ''
      const cleaned = rawText.replace(/```json|```/g, '').trim()
      const jsonMatch = cleaned.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        // Inject Luhn-valid card numbers & CVVs locally — never trust the LLM for these
        const normalize = (raw: any): GeneratedCard => {
          const rawNumber = generateLuhnNumber(cardType)
          return {
            cardType,
            cardNumber: formatCardNumber(rawNumber, cardType),
            cardHolder: raw.cardHolder || raw.card_holder || raw.holder || raw.name || 'TEST HOLDER',
            expiryDate: futureDateMMYY(),
            cvv: randomCVV(cardType),
            billingAddress: raw.billingAddress || raw.billing_address || raw.address || '',
            zipCode: raw.zipCode || raw.zip_code || raw.zip || raw.postal_code || '00000',
            note: 'FOR TESTING PURPOSES ONLY',
          }
        }
        const cards: GeneratedCard[] = JSON.parse(jsonMatch[0]).map(normalize)
        setGeneratedCards(cards)
        toast.success(`Generated ${cards.length} test card(s)!`)
      } else {
        throw new Error('The AI returned an unexpected format. Please try again.')
      }
    } catch (e: any) {
      setErrorModal({
        title: 'Generation Failed',
        detail: e?.response?.data?.message || e?.message || 'Could not generate cards. Please check your LLM configuration.',
      })
    } finally {
      setGenerating(false)
    }
  }

  const copyToClipboard = (card: GeneratedCard, index: number) => {
    const text = `Card Type: ${card.cardType}\nCard Number: ${card.cardNumber}\nCard Holder: ${card.cardHolder}\nExpiry: ${card.expiryDate}\nCVV: ${card.cvv}\nBilling Address: ${card.billingAddress}\nZIP: ${card.zipCode}\nNote: ${card.note}`
    navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    toast.success('Card details copied!')
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const copyField = (value: string) => {
    navigator.clipboard.writeText(value)
    toast.success('Copied!')
  }

  const getCardGradient = (type: string) =>
    CARD_TYPES.find(c => c.value === type)?.color || 'from-slate-600 to-slate-800'

  const displayCardNumber = (num: string | undefined) => {
    if (!num) return '•••• •••• •••• ••••'
    return num
  }

  return (
    <>
      <div className="min-h-screen bg-[#f8fafc] p-8 md:p-12">
        <div className="max-w-6xl mx-auto space-y-10">

          {/* Header Card */}
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden">
            <div className="p-10 pb-0 flex items-start space-x-4">
              <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                <CreditCard size={28} />
              </div>
              <div>
                <h1 className="text-3xl font-black text-[#0f172a]">Credit Card Generator</h1>
                <p className="text-slate-500 mt-1 font-medium">
                  Generate realistic test credit cards using your configured AI model.{' '}
                  <span className="text-emerald-600 font-black">For testing purposes only.</span>
                </p>
              </div>
            </div>

            <div className="p-12 space-y-10">
              {/* LLM Selection */}
              <div className="space-y-3">
                <label className="text-[11px] font-black text-slate-400 tracking-widest uppercase">AI Model</label>
                <div className="relative">
                  <select
                    value={selectedLlmId}
                    onChange={(e) => setSelectedLlmId(e.target.value)}
                    className="w-full h-16 px-6 bg-slate-50 border-2 border-slate-100 rounded-2xl text-slate-700 font-bold focus:border-emerald-500 appearance-none outline-none"
                  >
                    {llmConfigs.length === 0 && <option value="">No LLM configured — go to LLM Configuration</option>}
                    {llmConfigs.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.model})</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Card Type + Number */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-3">
                  <label className="text-[11px] font-black text-slate-400 tracking-widest uppercase">Card Type</label>
                  <div className="relative">
                    <select
                      value={cardType}
                      onChange={(e) => setCardType(e.target.value)}
                      className="w-full h-16 px-6 bg-slate-50 border-2 border-slate-100 rounded-2xl text-slate-700 font-bold focus:border-emerald-500 appearance-none outline-none"
                    >
                      {CARD_TYPES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                    <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[11px] font-black text-slate-400 tracking-widest uppercase">Number of Cards (Max 20)</label>
                  <input
                    type="number" min={1} max={20} value={numberOfCards}
                    onChange={(e) => setNumberOfCards(Math.min(20, Math.max(1, parseInt(e.target.value) || 1)))}
                    className="w-full h-16 px-6 bg-slate-50 border-2 border-slate-100 rounded-2xl text-slate-700 font-bold focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              {/* Quick type badges */}
              <div className="flex flex-wrap gap-3">
                {CARD_TYPES.map(c => (
                  <button key={c.value} onClick={() => setCardType(c.value)}
                    className={`px-5 py-2.5 rounded-xl font-black text-sm transition-all ${cardType === c.value ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-100'}`}>
                    {c.label}
                  </button>
                ))}
              </div>

              {/* Generate button */}
              <button onClick={handleGenerate} disabled={generating || !selectedLlmId}
                className="w-full h-16 bg-emerald-500 text-white rounded-2xl font-black text-lg hover:bg-emerald-600 transition-all disabled:opacity-50 shadow-xl shadow-emerald-100 flex items-center justify-center space-x-3">
                {generating
                  ? <><RefreshCw size={24} className="animate-spin" /><span>Generating...</span></>
                  : <><Zap size={24} className="fill-current" /><span>Generate Test Cards</span></>
                }
              </button>
            </div>
          </div>

          {/* Results */}
          {generatedCards.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between px-4">
                <h2 className="text-xl font-black text-slate-900 flex items-center space-x-3">
                  <span className="w-8 h-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-sm shadow-sm">{generatedCards.length}</span>
                  <span>Generated Test Cards</span>
                </h2>
                <button onClick={() => { const all = generatedCards.map(c => `${c.cardType} | ${c.cardNumber} | ${c.cardHolder} | ${c.expiryDate} | CVV: ${c.cvv}`).join('\n'); navigator.clipboard.writeText(all); toast.success('All cards copied!') }}
                  className="text-xs font-black text-emerald-600 hover:text-emerald-700 flex items-center gap-2 bg-white border border-emerald-100 px-4 py-2 rounded-xl shadow-sm">
                  <Copy size={14} /> Copy All
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {generatedCards.map((card, idx) => (
                  <div key={idx} className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-lg transition-all overflow-hidden">
                    {/* Visual card */}
                    <div className={`bg-gradient-to-br ${getCardGradient(card.cardType)} p-6 relative overflow-hidden`}>
                      <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                      <div className="absolute bottom-0 left-0 w-28 h-28 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
                      <div className="relative z-10 space-y-4">
                        <div className="flex justify-between items-start">
                          <span className="text-white/70 text-xs font-black uppercase tracking-widest">{card.cardType}</span>
                          <span className="text-white/60 text-xs font-bold bg-white/20 px-2 py-0.5 rounded-full">TEST ONLY</span>
                        </div>
                        <div className="w-8 h-6 bg-yellow-300/80 rounded-sm" />
                        <p className="text-white font-mono font-black text-xl tracking-widest cursor-pointer hover:opacity-80" onClick={() => copyField(card.cardNumber)} title="Click to copy">
                          {displayCardNumber(card.cardNumber)}
                        </p>
                        <div className="flex justify-between items-end">
                          <div><p className="text-white/50 text-[9px] font-black uppercase tracking-widest">Card Holder</p><p className="text-white font-black text-sm">{card.cardHolder}</p></div>
                          <div className="text-right"><p className="text-white/50 text-[9px] font-black uppercase tracking-widest">Expires</p><p className="text-white font-black text-sm">{card.expiryDate}</p></div>
                          <div className="text-right"><p className="text-white/50 text-[9px] font-black uppercase tracking-widest">CVV</p><p className="text-white font-black text-sm">{card.cvv}</p></div>
                        </div>
                      </div>
                    </div>

                    {/* Detail fields */}
                    <div className="p-6 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        {[
                          { label: 'Card Number', value: card.cardNumber },
                          { label: 'CVV', value: card.cvv },
                          { label: 'Expiry Date', value: card.expiryDate },
                          { label: 'ZIP Code', value: card.zipCode || 'N/A' },
                        ].map(({ label, value }) => (
                          <div key={label} className="bg-slate-50 rounded-xl p-3 cursor-pointer hover:bg-emerald-50 border border-transparent hover:border-emerald-100 transition-all"
                            onClick={() => copyField(value || '')} title={`Click to copy ${label}`}>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
                            <p className="font-black text-slate-700 text-sm mt-1 font-mono">{value}</p>
                          </div>
                        ))}
                      </div>
                      {card.billingAddress && (
                        <div className="bg-slate-50 rounded-xl p-3 cursor-pointer hover:bg-emerald-50 border border-transparent hover:border-emerald-100 transition-all"
                          onClick={() => copyField(`${card.billingAddress}, ${card.zipCode}`)} title="Click to copy address">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Billing Address</p>
                          <p className="font-bold text-slate-600 text-sm mt-1">{card.billingAddress}</p>
                        </div>
                      )}
                      <div className="flex items-center justify-between pt-2">
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{card.note || 'For Testing Only'}</span>
                        <button onClick={() => copyToClipboard(card, idx)}
                          className="flex items-center gap-2 text-xs font-black text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-4 py-2 rounded-xl transition-all">
                          {copiedIndex === idx ? <><CheckCircle size={14} /><span>Copied!</span></> : <><Copy size={14} /><span>Copy All</span></>}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {generatedCards.length === 0 && !generating && (
            <div className="bg-white rounded-[2rem] border-2 border-dashed border-slate-200 p-16 text-center">
              <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-slate-300">
                <CreditCard size={48} />
              </div>
              <p className="text-slate-400 font-black text-lg">No cards generated yet</p>
              <p className="text-slate-400 text-sm font-medium mt-2">Select your options above and click <span className="text-emerald-500 font-black">Generate Test Cards</span></p>
            </div>
          )}
        </div>
      </div>

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
                  <h2 className="text-xl font-black text-slate-900">{errorModal.title}</h2>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1">Credit Card Generator · Error</p>
                </div>
              </div>
              <div className="bg-red-50 border border-red-100 rounded-2xl p-5 mb-8">
                <p className="text-sm font-bold text-red-700 leading-relaxed">{errorModal.detail}</p>
              </div>
              <button onClick={() => setErrorModal(null)}
                className="w-full h-12 bg-slate-900 text-white rounded-xl font-black hover:bg-slate-800 transition-all">
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
