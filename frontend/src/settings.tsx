/**
 * domovoy-control settings — React component compiled to a Web Component.
 *
 * Build:   bun run build  (inside frontend/)
 * Output:  ../dist/settings.js  (self-contained ES module)
 *
 * Rendered inside the focus-dashboard Admin → Modules → Settings modal.
 * Communicates with the backend via:
 *   GET /api/modules/domovoy-control/api/settings
 *   PUT /api/modules/domovoy-control/api/settings
 */

import { useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'

const API = '/api/modules/domovoy-control/api'

interface Settings {
  host: string
  port: string
}

// Uses CSS custom properties from shadcn/ui so it inherits the dashboard theme.
const css = {
  root: {
    padding: '4px 0',
    fontFamily: 'system-ui, sans-serif',
    color: 'var(--foreground)',
  } as React.CSSProperties,
  field: { marginBottom: 18 } as React.CSSProperties,
  label: {
    display: 'block',
    fontSize: 13,
    fontWeight: 500,
    marginBottom: 6,
    color: 'var(--foreground)',
  } as React.CSSProperties,
  hint: {
    fontSize: 11,
    marginTop: 4,
    color: 'var(--muted-foreground)',
  } as React.CSSProperties,
  input: {
    width: '100%',
    padding: '8px 12px',
    background: 'var(--input, hsl(0 0% 96%))',
    border: '1px solid var(--border)',
    borderRadius: 6,
    color: 'var(--foreground)',
    fontSize: 13,
    outline: 'none',
    boxSizing: 'border-box',
  } as React.CSSProperties,
  footer: {
    display: 'flex',
    gap: 8,
    marginTop: 8,
  } as React.CSSProperties,
  btn: {
    padding: '7px 16px',
    background: 'var(--primary)',
    color: 'var(--primary-foreground)',
    border: 'none',
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'opacity 0.15s',
  } as React.CSSProperties,
  btnOutline: {
    padding: '7px 16px',
    background: 'transparent',
    color: 'var(--foreground)',
    border: '1px solid var(--border)',
    borderRadius: 6,
    fontSize: 13,
    cursor: 'pointer',
  } as React.CSSProperties,
}

function DomovoySettingsPanel() {
  const [saved, setSaved] = useState<Settings>({ host: '127.0.0.1', port: '50055' })
  const [draft, setDraft] = useState<Settings>(saved)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [ok, setOk] = useState(false)

  useEffect(() => {
    fetch(`${API}/settings`, { credentials: 'include' })
      .then(r => r.json())
      .then((s: Settings) => { setSaved(s); setDraft(s) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const isDirty = draft.host !== saved.host || draft.port !== saved.port

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch(`${API}/settings`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      })
      if (res.ok) {
        const s: Settings = await res.json()
        setSaved(s)
        setDraft(s)
        setOk(true)
        setTimeout(() => setOk(false), 2000)
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div style={{ color: 'var(--muted-foreground)', fontSize: 13 }}>Загрузка…</div>
  }

  return (
    <div style={css.root}>
      <div style={css.field}>
        <label style={css.label}>Адрес домового</label>
        <input
          style={css.input}
          value={draft.host}
          onChange={e => setDraft(d => ({ ...d, host: e.target.value }))}
          placeholder="127.0.0.1"
        />
        <div style={css.hint}>Хост gRPC-сервера голосового ассистента</div>
      </div>

      <div style={css.field}>
        <label style={css.label}>Порт gRPC</label>
        <input
          style={css.input}
          value={draft.port}
          onChange={e => setDraft(d => ({ ...d, port: e.target.value }))}
          placeholder="50055"
        />
        <div style={css.hint}>По умолчанию: 50055</div>
      </div>

      <div style={css.footer}>
        <button
          style={{ ...css.btn, opacity: (!isDirty || saving) ? 0.5 : 1 }}
          disabled={!isDirty || saving}
          onClick={save}
        >
          {saving ? 'Сохранение…' : ok ? '✓ Сохранено' : 'Сохранить'}
        </button>
        {isDirty && (
          <button style={css.btnOutline} onClick={() => setDraft(saved)}>
            Сбросить
          </button>
        )}
      </div>
    </div>
  )
}

class DomovoyControlSettingsElement extends HTMLElement {
  private reactRoot: ReturnType<typeof createRoot> | null = null

  connectedCallback() {
    const container = document.createElement('div')
    this.appendChild(container)
    this.reactRoot = createRoot(container)
    this.reactRoot.render(<DomovoySettingsPanel />)
  }

  disconnectedCallback() {
    this.reactRoot?.unmount()
    this.reactRoot = null
  }
}

if (!customElements.get('domovoy-control-settings')) {
  customElements.define('domovoy-control-settings', DomovoyControlSettingsElement)
}
