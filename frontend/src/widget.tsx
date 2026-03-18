/**
 * domovoy-control widget — React component compiled to a Web Component.
 *
 * Build:   bun run build  (inside frontend/)
 * Output:  ../dist/widget.js  (self-contained ES module)
 *
 * The widget fetches its status from the focus-dashboard proxy:
 *   GET  /api/modules/domovoy-control/api/status
 *   POST /api/modules/domovoy-control/api/command
 *   GET  /api/modules/domovoy-control/api/settings
 *   PUT  /api/modules/domovoy-control/api/settings
 * which focus-dashboard reverse-proxies to domovoy-control backend (:8090).
 */

import { useState, useEffect, useCallback } from 'react'
import { createRoot } from 'react-dom/client'

const API = '/api/modules/domovoy-control/api'

// ── types ────────────────────────────────────────────────────────
interface Status {
  running: boolean
  state: string
  since?: string
}

interface Settings {
  host: string
  port: string
}

// ── styles (inline — no Tailwind / CSS files in widget bundle) ───
const css: Record<string, React.CSSProperties> = {
  root: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    background: 'linear-gradient(135deg,#0d2b1f 0%,#0a1f2e 100%)',
    borderRadius: 16,
    border: '1px solid rgba(52,211,153,0.2)',
    color: '#a7f3d0',
    fontFamily: 'system-ui,sans-serif',
    boxSizing: 'border-box',
    padding: 16,
    userSelect: 'none',
    position: 'relative',
    overflow: 'hidden',
  },
  icon: { fontSize: '2.2rem', lineHeight: 1 },
  name: { fontWeight: 600, fontSize: 14 },
  status: { fontSize: 11, opacity: 0.55, textAlign: 'center' },
  pulse: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: '#34d399',
    boxShadow: '0 0 0 0 rgba(52,211,153,0.6)',
    animation: 'domovoy-pulse 1.2s ease-in-out infinite',
  },
  btn: {
    marginTop: 4,
    padding: '6px 18px',
    background: 'rgba(52,211,153,0.12)',
    border: '1px solid rgba(52,211,153,0.3)',
    borderRadius: 20,
    color: '#6ee7b7',
    fontSize: 11,
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  btnActive: {
    background: 'rgba(52,211,153,0.3)',
    color: '#a7f3d0',
  },
  gearBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    background: 'none',
    border: 'none',
    color: 'rgba(167,243,208,0.4)',
    cursor: 'pointer',
    fontSize: 14,
    lineHeight: 1,
    padding: 4,
    borderRadius: 4,
    transition: 'color 0.2s',
  },
  // Settings panel (overlays the widget)
  settingsPanel: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(135deg,#0d2b1f 0%,#0a1f2e 100%)',
    borderRadius: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    padding: 16,
    boxSizing: 'border-box',
  },
  settingsTitle: {
    fontWeight: 600,
    fontSize: 13,
    marginBottom: 2,
  },
  label: {
    fontSize: 10,
    opacity: 0.55,
    marginBottom: 2,
  },
  input: {
    width: '100%',
    background: 'rgba(52,211,153,0.08)',
    border: '1px solid rgba(52,211,153,0.25)',
    borderRadius: 6,
    color: '#a7f3d0',
    fontSize: 12,
    padding: '4px 8px',
    boxSizing: 'border-box',
    outline: 'none',
  },
  settingsRow: {
    display: 'flex',
    gap: 8,
    marginTop: 'auto',
  },
  saveBtn: {
    flex: 1,
    padding: '5px 0',
    background: 'rgba(52,211,153,0.2)',
    border: '1px solid rgba(52,211,153,0.4)',
    borderRadius: 6,
    color: '#6ee7b7',
    fontSize: 11,
    cursor: 'pointer',
  },
  cancelBtn: {
    padding: '5px 10px',
    background: 'none',
    border: '1px solid rgba(167,243,208,0.15)',
    borderRadius: 6,
    color: 'rgba(167,243,208,0.4)',
    fontSize: 11,
    cursor: 'pointer',
  },
}

// ── inject keyframes once ────────────────────────────────────────
const STYLE = `@keyframes domovoy-pulse {
  0%   { box-shadow: 0 0 0 0   rgba(52,211,153,0.6); }
  70%  { box-shadow: 0 0 0 8px rgba(52,211,153,0);   }
  100% { box-shadow: 0 0 0 0   rgba(52,211,153,0);   }
}`
if (typeof document !== 'undefined' && !document.getElementById('domovoy-style')) {
  const s = document.createElement('style')
  s.id = 'domovoy-style'
  s.textContent = STYLE
  document.head.appendChild(s)
}

// ── React component ──────────────────────────────────────────────
function DomovoyWidget() {
  const [status, setStatus] = useState<Status | null>(null)
  const [busy, setBusy] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [settings, setSettings] = useState<Settings>({ host: '127.0.0.1', port: '50055' })
  const [draft, setDraft] = useState<Settings>(settings)
  const [saving, setSaving] = useState(false)

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`${API}/status`, { credentials: 'include' })
      if (res.ok) setStatus(await res.json())
    } catch { /* service offline */ }
  }, [])

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch(`${API}/settings`, { credentials: 'include' })
      if (res.ok) {
        const s = await res.json()
        setSettings(s)
        setDraft(s)
      }
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    fetchStatus()
    fetchSettings()
    const id = setInterval(fetchStatus, 4000)
    return () => clearInterval(id)
  }, [fetchStatus, fetchSettings])

  const openSettings = () => {
    setDraft(settings)
    setShowSettings(true)
  }

  const saveSettings = async () => {
    setSaving(true)
    try {
      const res = await fetch(`${API}/settings`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      })
      if (res.ok) {
        const s = await res.json()
        setSettings(s)
      }
      setShowSettings(false)
    } finally {
      setSaving(false)
    }
  }

  const sendCommand = async () => {
    setBusy(true)
    try {
      await fetch(`${API}/command`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: 'listen' }),
      })
      await fetchStatus()
    } finally {
      setBusy(false)
    }
  }

  const stateLabel =
    status === null  ? 'подключение…' :
    !status.running  ? 'офлайн' :
    status.state === 'listening' ? '🎙 слушаю…' :
    status.state

  const isListening = status?.state === 'listening'

  return (
    <div style={css.root}>
      {/* Gear button */}
      <button style={css.gearBtn} onClick={openSettings} title="Настройки">⚙</button>

      {/* Main content */}
      <div style={css.icon}>🏠</div>
      <div style={css.name}>Домовой</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {isListening && <div style={css.pulse} />}
        <div style={css.status}>{stateLabel}</div>
      </div>
      <button
        style={{ ...css.btn, ...(isListening || busy ? css.btnActive : {}) }}
        onClick={sendCommand}
        disabled={busy || isListening}
      >
        {isListening ? '…' : '🎤 Слушать'}
      </button>

      {/* Settings panel */}
      {showSettings && (
        <div style={css.settingsPanel}>
          <div style={css.settingsTitle}>⚙ Настройки</div>

          <div>
            <div style={css.label}>Адрес домового</div>
            <input
              style={css.input}
              value={draft.host}
              onChange={e => setDraft(d => ({ ...d, host: e.target.value }))}
              placeholder="127.0.0.1"
            />
          </div>

          <div>
            <div style={css.label}>Порт gRPC</div>
            <input
              style={css.input}
              value={draft.port}
              onChange={e => setDraft(d => ({ ...d, port: e.target.value }))}
              placeholder="50055"
            />
          </div>

          <div style={css.settingsRow}>
            <button style={css.cancelBtn} onClick={() => setShowSettings(false)}>
              Отмена
            </button>
            <button style={css.saveBtn} onClick={saveSettings} disabled={saving}>
              {saving ? '…' : 'Сохранить'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Web Component wrapper ────────────────────────────────────────
class DomovoyControlElement extends HTMLElement {
  private reactRoot: ReturnType<typeof createRoot> | null = null

  connectedCallback() {
    const container = document.createElement('div')
    container.style.cssText = 'width:100%;height:100%;display:contents'
    this.appendChild(container)
    this.reactRoot = createRoot(container)
    this.reactRoot.render(<DomovoyWidget />)
  }

  disconnectedCallback() {
    this.reactRoot?.unmount()
    this.reactRoot = null
  }
}

if (!customElements.get('domovoy-control-widget')) {
  customElements.define('domovoy-control-widget', DomovoyControlElement)
}
