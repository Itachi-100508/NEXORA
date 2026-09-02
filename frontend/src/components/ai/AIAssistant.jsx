import { useEffect, useRef, useState } from 'react'
import { Bot, Send, Sparkles, X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import { getAIResponse, getSuggestedPrompts } from '../../services/mock'

export default function AIAssistant() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const bodyRef = useRef(null)
  const role = user?.role?.toLowerCase() || 'student'

  useEffect(() => {
    if (open) {
      setSuggestions(getSuggestedPrompts(role))
      setMessages((m) => {
        if (m.length) return m
        return [
          {
            role: 'bot',
            text: `Hi ${user?.name?.split(' ')[0] || 'there'}! I'm your EXAMORA assistant. Ask me about results, marks entry, reports or revaluations. Demo mode — I never compute official marks or grades.`,
          },
        ]
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight
  }, [messages, busy])

  const ask = async (text) => {
    const q = (text || input).trim()
    if (!q || busy) return
    setInput('')
    setSuggestions([])
    setMessages((m) => [...m, { role: 'user', text: q }])
    setBusy(true)
    const answer = await getAIResponse(q, role, { student: null })
    setBusy(false)
    setMessages((m) => [...m, { role: 'bot', text: answer }])
  }

  return (
    <>
      <motion.button
        className="ai-fab no-print"
        onClick={() => setOpen((o) => !o)}
        aria-label="Open AI assistant"
        whileTap={{ scale: 0.9 }}
      >
        <AnimatePresence mode="wait" initial={false}>
          {open ? <X size={22} key="x" /> : <Sparkles size={22} key="s" />}
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="ai-drawer no-print"
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 60 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            <div className="ai-header">
              <div className="ai-avatar">
                <Bot size={22} />
              </div>
              <div>
                <h3>EXAMORA Assistant</h3>
                <div className="sub">Demo intelligence · answers from curated data</div>
              </div>
            </div>
            <div className="ai-body" ref={bodyRef}>
              {messages.map((m, i) => (
                <div key={i} className={`ai-msg ${m.role}`}>
                  {m.text}
                </div>
              ))}
              {busy && <div className="ai-msg bot">Thinking…</div>}
              {!messages.length && suggestions.length > 0 && (
                <div className="ai-suggestions">
                  {suggestions.map((s) => (
                    <button key={s} onClick={() => ask(s)}>
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="ai-footer">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && ask()}
                placeholder="Ask about exams, results, reports…"
                aria-label="Ask the AI assistant"
              />
              <button className="btn btn-primary" onClick={() => ask()} disabled={busy || !input.trim()} aria-label="Send">
                <Send size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}