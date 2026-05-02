import Modal from './Modal'
import './ThemeModal.css'

export const THEMES = [
  { id: 'indigo', label: 'インディゴ', primary: '#6366F1', primaryLight: '#EEF2FF', today: '#BAE6FD', todayDark: '#0EA5E9' },
  { id: 'purple', label: 'パープル',   primary: '#8B5CF6', primaryLight: '#F5F3FF', today: '#DDD6FE', todayDark: '#7C3AED' },
  { id: 'pink',   label: 'ピンク',     primary: '#EC4899', primaryLight: '#FDF2F8', today: '#FBCFE8', todayDark: '#DB2777' },
  { id: 'teal',   label: 'ティール',   primary: '#14B8A6', primaryLight: '#F0FDFA', today: '#99F6E4', todayDark: '#0D9488' },
  { id: 'green',  label: 'グリーン',   primary: '#22C55E', primaryLight: '#F0FDF4', today: '#BBF7D0', todayDark: '#16A34A' },
  { id: 'orange', label: 'オレンジ',   primary: '#F97316', primaryLight: '#FFF7ED', today: '#FED7AA', todayDark: '#EA580C' },
]

export function applyTheme(theme) {
  const root = document.documentElement.style
  root.setProperty('--color-primary', theme.primary)
  root.setProperty('--color-primary-light', theme.primaryLight)
  root.setProperty('--color-today', theme.today)
  root.setProperty('--color-today-dark', theme.todayDark)
}

export default function ThemeModal({ currentThemeId, onSelect, onClose }) {
  return (
    <Modal title="テーマカラー" onClose={onClose}>
      <div className="theme-grid">
        {THEMES.map(theme => (
          <button
            key={theme.id}
            className={`theme-swatch${currentThemeId === theme.id ? ' selected' : ''}`}
            onClick={() => onSelect(theme)}
            aria-label={theme.label}
          >
            <span className="swatch-circle" style={{ background: theme.primary }} />
            <span className="swatch-label">{theme.label}</span>
            {currentThemeId === theme.id && (
              <span className="swatch-check">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </span>
            )}
          </button>
        ))}
      </div>
    </Modal>
  )
}
