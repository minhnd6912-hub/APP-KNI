import { useState, useRef, useEffect } from 'react'
import { supabase } from './supabaseClient'
import companyLogo from './assets/company-logo.png'
// ==================== TYPES ====================

type Role = 'manager' | 'employee'
type View = 'dashboard' | 'tasks' | 'leaderboard' | 'rewards' | 'social' | 'profile'
type TaskStatus = 'open' | 'in-progress' | 'submitted' | 'completed'
type TaskPriority = 'low' | 'medium' | 'high'
type ChatChannel = 'general' | 'team' | 'announcements' | 'dm'

interface AvatarConfig {
  type: 'custom' | 'photo'
  skinTone: string
  hairStyle: number
  hairColor: string
  outfitColor: string
  accessory: number
  photoUrl?: string
}

interface User {
  id: string
  name: string
  role: Role
  avatar: AvatarConfig
  exp: number
  teamId: string
  department: string
}

interface Task {
  id: string
  title: string
  description: string
  expReward: number
  status: TaskStatus
  assignedTo?: string
  projectManager?: string
  supporters: string[]
  createdBy: string
  dueDate: string
  category: string
  priority: TaskPriority
  selfCreated: boolean
  submissionFileUrl?: string
  submissionNote?: string
  submittedAt?: string
  rejectedReason?: string
}

interface Message {
  id: string
  userId: string
  content: string
  timestamp: string
  channel: ChatChannel
  toUserId?: string // chỉ dùng khi channel === 'dm': id của người nhận
}

interface Reward {
  id: string
  name: string
  description: string
  cost: number
  emoji: string
  category: string
}

// ==================== AVATAR SYSTEM ====================

const SKIN_TONES = ['#FDBCB4', '#E8A87C', '#C68642', '#8D5524', '#4A2912']
const HAIR_COLORS = ['#1a1a1a', '#4a2c0a', '#8B4513', '#C0392B', '#D4AC0D', '#FF69B4', '#4169E1', '#B8B8B8']
const OUTFIT_COLORS = ['#4f46e5', '#059669', '#dc2626', '#d97706', '#0891b2', '#7c3aed', '#ec4899', '#374151']
const HAIR_STYLE_LABELS = ['Ngắn', 'Vừa', 'Dài', 'Xoăn', 'Afro', 'Đuôi ngựa']
const ACCESSORY_LABELS = ['Không', 'Kính tròn', 'Kính mát', 'Mũ', 'Băng đầu']

const DEFAULT_AVATAR: AvatarConfig = {
  type: 'custom', skinTone: '#E8A87C', hairStyle: 1, hairColor: '#1a1a1a', outfitColor: '#4f46e5', accessory: 0,
}

function darkenColor(hex: string, f = 0.2): string {
  const n = parseInt(hex.slice(1), 16)
  const r = Math.max(0, Math.round((n >> 16) * (1 - f)))
  const g = Math.max(0, Math.round(((n >> 8) & 0xff) * (1 - f)))
  const b = Math.max(0, Math.round((n & 0xff) * (1 - f)))
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

// Full SVG character
function CharacterSVG({ config, w = 100, h = 120, vb = '0 0 100 120' }: {
  config: AvatarConfig; w?: number; h?: number; vb?: string
}) {
  const { skinTone, hairStyle, hairColor, outfitColor, accessory } = config
  const pants = darkenColor(outfitColor, 0.28)
  const skinDark = darkenColor(skinTone, 0.12)
  const lightHairs = ['#B8B8B8', '#D4AC0D', '#FF69B4', '#4169E1', '#FDBCB4']
  const browColor = lightHairs.includes(hairColor) ? darkenColor(skinTone, 0.3) : hairColor

  const renderHair = () => {
    switch (hairStyle) {
      case 0:
        return <path d="M29,34 Q28,11 50,10 Q72,11 71,34 Q65,18 50,15 Q35,18 29,34 Z" fill={hairColor} />
      case 1:
        return (
          <g>
            <ellipse cx="50" cy="19" rx="22" ry="13" fill={hairColor} />
            <path d="M30,26 Q25,46 30,60" stroke={hairColor} strokeWidth="9" strokeLinecap="round" fill="none" />
            <path d="M70,26 Q75,46 70,60" stroke={hairColor} strokeWidth="9" strokeLinecap="round" fill="none" />
          </g>
        )
      case 2:
        return (
          <g>
            <ellipse cx="50" cy="17" rx="22" ry="11" fill={hairColor} />
            <path d="M30,23 Q21,62 25,84" stroke={hairColor} strokeWidth="10" strokeLinecap="round" fill="none" />
            <path d="M70,23 Q79,62 75,84" stroke={hairColor} strokeWidth="10" strokeLinecap="round" fill="none" />
          </g>
        )
      case 3:
        return (
          <g>
            <circle cx="29" cy="27" r="11" fill={hairColor} />
            <circle cx="42" cy="15" r="12" fill={hairColor} />
            <circle cx="58" cy="15" r="12" fill={hairColor} />
            <circle cx="71" cy="27" r="11" fill={hairColor} />
            <circle cx="76" cy="39" r="9" fill={hairColor} />
            <circle cx="24" cy="39" r="9" fill={hairColor} />
          </g>
        )
      case 4:
        return <circle cx="50" cy="24" r="28" fill={hairColor} />
      case 5:
        return (
          <g>
            <ellipse cx="50" cy="19" rx="22" ry="12" fill={hairColor} />
            <path d="M30,27 Q26,42 30,54" stroke={hairColor} strokeWidth="7" strokeLinecap="round" fill="none" />
            <path d="M70,14 Q86,8 84,36 Q82,44 72,40 Q71,28 70,20 Z" fill={hairColor} />
          </g>
        )
      default: return null
    }
  }

  const renderAccessory = () => {
    switch (accessory) {
      case 1: // Round glasses
        return (
          <g stroke="#1e1e3a" strokeWidth="1.5" fill="none" opacity="0.88">
            <circle cx="43" cy="31" r="8" />
            <circle cx="57" cy="31" r="8" />
            <line x1="51" y1="31" x2="49" y2="31" />
            <line x1="35" y1="30" x2="27" y2="29" />
            <line x1="65" y1="30" x2="73" y2="29" />
          </g>
        )
      case 2: // Sunglasses
        return (
          <g>
            <circle cx="43" cy="31" r="8" fill="#0f0f1e" opacity="0.85" />
            <circle cx="57" cy="31" r="8" fill="#0f0f1e" opacity="0.85" />
            <g stroke="#3a3a5a" strokeWidth="1.5" fill="none">
              <circle cx="43" cy="31" r="8" />
              <circle cx="57" cy="31" r="8" />
              <line x1="51" y1="31" x2="49" y2="31" />
              <line x1="35" y1="30" x2="27" y2="29" />
              <line x1="65" y1="30" x2="73" y2="29" />
            </g>
          </g>
        )
      case 3: // Hat
        return (
          <g>
            <ellipse cx="50" cy="15" rx="27" ry="5.5" fill={darkenColor(hairColor === '#D4AC0D' ? '#8B4513' : hairColor, 0.1)} />
            <rect x="33" y="0" width="34" height="16" rx="6" fill={hairColor === '#B8B8B8' ? '#444' : darkenColor(hairColor, 0.05)} />
            <rect x="33" y="12" width="34" height="4" fill="rgba(0,0,0,0.2)" />
          </g>
        )
      case 4: // Headband
        return <rect x="27" y="25" width="46" height="9" rx="4.5" fill="#ec4899" />
      default: return null
    }
  }

  return (
    <svg viewBox={vb} width={w} height={h} style={{ display: 'block', overflow: 'visible' }}>
      {/* Hair (below head) */}
      {renderHair()}

      {/* Hat (below head) */}
      {accessory === 3 && renderAccessory()}

      {/* Ears */}
      <ellipse cx="29" cy="34" rx="4.5" ry="5.5" fill={skinTone} />
      <ellipse cx="71" cy="34" rx="4.5" ry="5.5" fill={skinTone} />

      {/* Head */}
      <ellipse cx="50" cy="32" rx="21" ry="22" fill={skinTone} />

      {/* Cheek blush */}
      <ellipse cx="37" cy="40" rx="6" ry="4" fill="#ff7777" opacity="0.16" />
      <ellipse cx="63" cy="40" rx="6" ry="4" fill="#ff7777" opacity="0.16" />

      {/* Eyebrows */}
      <path d="M38,24 Q43,22 47,25" stroke={browColor} strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M53,25 Q57,22 62,24" stroke={browColor} strokeWidth="1.5" fill="none" strokeLinecap="round" />

      {/* Eyes - sclera */}
      <ellipse cx="43" cy="30" rx="3.5" ry="3.8" fill="white" />
      <ellipse cx="57" cy="30" rx="3.5" ry="3.8" fill="white" />
      {/* Pupils */}
      <circle cx="43.5" cy="30.5" r="2.2" fill="#1a1a2e" />
      <circle cx="57.5" cy="30.5" r="2.2" fill="#1a1a2e" />
      {/* Eye shine */}
      <circle cx="44.3" cy="29.4" r="0.9" fill="white" />
      <circle cx="58.3" cy="29.4" r="0.9" fill="white" />

      {/* Nose */}
      <path d="M48.5,37 Q50,40 51.5,37" stroke={skinDark} strokeWidth="1.2" fill="none" strokeLinecap="round" />

      {/* Mouth - smile */}
      <path d="M44,44 Q50,49 56,44" stroke="#c07070" strokeWidth="1.8" fill="none" strokeLinecap="round" />

      {/* Glasses/Headband (over face) */}
      {(accessory === 1 || accessory === 2 || accessory === 4) && renderAccessory()}

      {/* Neck */}
      <rect x="44" y="53" width="12" height="10" rx="2" fill={skinTone} />

      {/* Body (shirt) */}
      <rect x="26" y="62" width="48" height="33" rx="8" fill={outfitColor} />
      {/* Subtle highlight on shirt */}
      <rect x="26" y="62" width="48" height="6" rx="8" fill="rgba(255,255,255,0.06)" />
      {/* Collar */}
      <path d="M45,62 L50,70 L55,62 Z" fill={darkenColor(outfitColor, 0.1)} />

      {/* Left arm / sleeve */}
      <path d="M27,68 Q13,76 10,89" stroke={outfitColor} strokeWidth="12" strokeLinecap="round" fill="none" />
      {/* Left hand */}
      <circle cx="10" cy="89" r="5.5" fill={skinTone} />

      {/* Right arm / sleeve */}
      <path d="M73,68 Q87,76 90,89" stroke={outfitColor} strokeWidth="12" strokeLinecap="round" fill="none" />
      {/* Right hand */}
      <circle cx="90" cy="89" r="5.5" fill={skinTone} />

      {/* Pants */}
      <rect x="31" y="93" width="16" height="23" rx="6" fill={pants} />
      <rect x="53" y="93" width="16" height="23" rx="6" fill={pants} />

      {/* Shoes */}
      <ellipse cx="39" cy="117" rx="10" ry="5" fill="#12121e" />
      <ellipse cx="61" cy="117" rx="10" ry="5" fill="#12121e" />
    </svg>
  )
}

// Compact avatar (head crop) used in cards, chat, lists
function CharAvatar({ user, size = 40 }: { user: User; size?: number }) {
  if (user.avatar.type === 'photo' && user.avatar.photoUrl) {
    return (
      <img src={user.avatar.photoUrl} alt={user.name}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '2px solid rgba(255,255,255,0.12)', display: 'block' }} />
    )
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
      border: '2px solid rgba(255,255,255,0.1)', background: `${user.avatar.outfitColor}18`,
    }}>
      {/* Show head area only */}
      <CharacterSVG config={user.avatar} vb="24 4 52 52" w={size} h={size} />
    </div>
  )
}

// Large avatar (full body) used in profile/login preview
function FullAvatar({ avatar, size = 120 }: { avatar: AvatarConfig; size?: number }) {
  if (avatar.type === 'photo' && avatar.photoUrl) {
    return (
      <img src={avatar.photoUrl} alt="avatar"
        style={{ width: size, height: size, borderRadius: '12px', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.12)', display: 'block' }} />
    )
  }
  return <CharacterSVG config={avatar} vb="0 0 100 120" w={size} h={size * 1.2} />
}

// ==================== AVATAR CREATOR ====================

function AvatarCreator({ value, onChange }: { value: AvatarConfig; onChange: (a: AvatarConfig) => void }) {
  const [tab, setTab] = useState<'custom' | 'photo'>(value.type === 'photo' ? 'photo' : 'custom')
  const fileRef = useRef<HTMLInputElement>(null)

  const update = (patch: Partial<AvatarConfig>) =>
    onChange({ ...value, type: 'custom', photoUrl: undefined, ...patch })

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => onChange({ ...value, type: 'photo', photoUrl: ev.target?.result as string })
    reader.readAsDataURL(file)
  }

  return (
    <div>
      {/* Tab switcher */}
      <div className="flex gap-1 p-0.5 rounded-xl mb-4" style={{ background: '#0a0a1a', border: '1px solid #1e1e3a' }}>
        {[['custom', '🎨 Tự tạo nhân vật'], ['photo', '📷 Tải ảnh lên']].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id as 'custom' | 'photo')}
            className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
            style={{ background: tab === id ? '#7c3aed' : 'transparent', color: tab === id ? '#fff' : '#6b7280' }}>
            {label}
          </button>
        ))}
      </div>

      <div className="flex gap-5">
        {/* Preview */}
        <div className="flex-shrink-0 flex flex-col items-center gap-2">
          <div
            className="rounded-2xl overflow-hidden flex items-end justify-center"
            style={{
              width: 110, height: 140,
              background: `linear-gradient(160deg, ${value.outfitColor}22, #10102a)`,
              border: `2px solid ${value.outfitColor}40`,
            }}
          >
            <FullAvatar avatar={value} size={100} />
          </div>
          <span className="text-gray-600 text-[10px]">Xem trước</span>
        </div>

        {/* Controls */}
        <div className="flex-1 space-y-3.5 min-w-0">
          {tab === 'custom' ? (
            <>
              {/* Skin */}
              <div>
                <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-1.5">Màu da</p>
                <div className="flex gap-2">
                  {SKIN_TONES.map(c => (
                    <button key={c} onClick={() => update({ skinTone: c })}
                      className="w-7 h-7 rounded-full transition-all hover:scale-110"
                      style={{
                        background: c,
                        outline: value.skinTone === c ? `3px solid ${c}` : '3px solid transparent',
                        outlineOffset: '2px',
                        border: value.skinTone === c ? '2px solid white' : '2px solid transparent',
                      }} />
                  ))}
                </div>
              </div>

              {/* Hair style */}
              <div>
                <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-1.5">Kiểu tóc</p>
                <div className="flex flex-wrap gap-1">
                  {HAIR_STYLE_LABELS.map((lbl, i) => (
                    <button key={i} onClick={() => update({ hairStyle: i })}
                      className="px-2.5 py-1 rounded-lg text-xs transition-all"
                      style={{
                        background: value.hairStyle === i ? '#7c3aed' : '#14143a',
                        color: value.hairStyle === i ? '#fff' : '#6b7280',
                        border: `1px solid ${value.hairStyle === i ? '#7c3aed' : '#1e1e4a'}`,
                      }}>
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Hair color */}
              <div>
                <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-1.5">Màu tóc</p>
                <div className="flex flex-wrap gap-1.5">
                  {HAIR_COLORS.map(c => (
                    <button key={c} onClick={() => update({ hairColor: c })}
                      className="w-5 h-5 rounded-full transition-all hover:scale-110"
                      style={{
                        background: c,
                        border: `2px solid ${value.hairColor === c ? 'white' : '#1e1e4a'}`,
                        boxShadow: value.hairColor === c ? `0 0 6px ${c}` : 'none',
                      }} />
                  ))}
                </div>
              </div>

              {/* Outfit */}
              <div>
                <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-1.5">Trang phục</p>
                <div className="flex flex-wrap gap-1.5">
                  {OUTFIT_COLORS.map(c => (
                    <button key={c} onClick={() => update({ outfitColor: c })}
                      className="w-5 h-5 rounded-full transition-all hover:scale-110"
                      style={{
                        background: c,
                        border: `2px solid ${value.outfitColor === c ? 'white' : '#1e1e4a'}`,
                        boxShadow: value.outfitColor === c ? `0 0 6px ${c}` : 'none',
                      }} />
                  ))}
                </div>
              </div>

              {/* Accessory */}
              <div>
                <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-1.5">Phụ kiện</p>
                <div className="flex flex-wrap gap-1">
                  {ACCESSORY_LABELS.map((lbl, i) => (
                    <button key={i} onClick={() => update({ accessory: i })}
                      className="px-2 py-1 rounded-lg text-xs transition-all"
                      style={{
                        background: value.accessory === i ? '#f59e0b' : '#14143a',
                        color: value.accessory === i ? '#1a0f00' : '#6b7280',
                        border: `1px solid ${value.accessory === i ? '#f59e0b' : '#1e1e4a'}`,
                        fontWeight: value.accessory === i ? '600' : '400',
                      }}>
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            /* Photo upload */
            <div className="flex flex-col gap-3">
              {value.type === 'photo' && value.photoUrl ? (
                <div className="text-center">
                  <img src={value.photoUrl} alt="preview"
                    className="w-20 h-20 rounded-full object-cover mx-auto mb-2"
                    style={{ border: '3px solid #7c3aed', boxShadow: '0 0 20px #7c3aed50' }} />
                  <p className="text-green-400 text-xs mb-1">✓ Đã tải lên thành công</p>
                </div>
              ) : (
                <div
                  className="rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer py-6"
                  style={{ border: '1.5px dashed #2a2a5a', background: '#0a0a1a' }}
                  onClick={() => fileRef.current?.click()}
                >
                  <span className="text-3xl">📷</span>
                  <p className="text-gray-500 text-xs text-center">Click để chọn ảnh của bạn<br /><span className="text-gray-700">JPG, PNG, WebP</span></p>
                </div>
              )}

              <div className="flex gap-2">
                <button onClick={() => fileRef.current?.click()}
                  className="flex-1 py-2 rounded-lg text-sm text-violet-400 font-medium"
                  style={{ background: '#14143a', border: '1px solid #2a2a5a' }}>
                  {value.type === 'photo' && value.photoUrl ? 'Đổi ảnh' : 'Chọn ảnh'}
                </button>
                {value.type === 'photo' && value.photoUrl && (
                  <button onClick={() => onChange({ ...DEFAULT_AVATAR })}
                    className="px-3 py-2 rounded-lg text-xs text-gray-500"
                    style={{ background: '#14143a', border: '1px solid #1e1e4a' }}>
                    Dùng nhân vật
                  </button>
                )}
              </div>

              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ==================== HELPERS / SMALL COMPONENTS ====================

const makeAvatar = (skinTone: string, hairStyle: number, hairColor: string, outfitColor: string, accessory = 0): AvatarConfig =>
  ({ type: 'custom', skinTone, hairStyle, hairColor, outfitColor, accessory })

const getLevel = (exp: number) => Math.max(1, Math.floor(Math.sqrt(exp / 40)) + 1)

const getExpProgress = (exp: number) => {
  const level = getLevel(exp)
  const cur = Math.pow(level - 1, 2) * 40
  const next = Math.pow(level, 2) * 40
  return { progress: Math.min(100, Math.max(0, ((exp - cur) / (next - cur)) * 100)), needed: next - exp, level }
}

const fmtDate = (s: string) => new Date(s).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
const fmtTime = (s: string) => new Date(s).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })

function LevelBadge({ exp }: { exp: number }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold text-white"
      style={{ background: 'linear-gradient(135deg, #7c3aed, #f59e0b)' }}>
      Lv.{getLevel(exp)}
    </span>
  )
}

function ExpBarMini({ exp }: { exp: number }) {
  const { progress } = getExpProgress(exp)
  return (
    <div className="h-1.5 bg-[#1a1a3a] rounded-full overflow-hidden">
      <div className="h-full rounded-full" style={{ width: `${progress}%`, background: 'linear-gradient(90deg,#7c3aed,#f59e0b)', transition: 'width 0.6s ease' }} />
    </div>
  )
}

// ==================== MOCK DATA ====================

const MOCK_USERS: User[] = [
  { id: 'u1', name: 'Nguyễn Minh Khoa', role: 'manager', avatar: makeAvatar('#C68642', 0, '#1a1a1a', '#4f46e5', 0), exp: 3200, teamId: 't1', department: 'Engineering' },
  { id: 'u2', name: 'Trần Thị Mai', role: 'manager', avatar: makeAvatar('#E8A87C', 2, '#8B4513', '#0891b2', 4), exp: 2800, teamId: 't2', department: 'Design' },
  { id: 'u3', name: 'Lê Văn Nam', role: 'employee', avatar: makeAvatar('#8D5524', 0, '#1a1a1a', '#dc2626', 0), exp: 1850, teamId: 't1', department: 'Engineering' },
  { id: 'u4', name: 'Phạm Thu Thảo', role: 'employee', avatar: makeAvatar('#E8A87C', 5, '#4a2c0a', '#7c3aed', 1), exp: 2100, teamId: 't1', department: 'Engineering' },
  { id: 'u5', name: 'Hoàng Đức Minh', role: 'employee', avatar: makeAvatar('#FDBCB4', 1, '#C0392B', '#059669', 0), exp: 1620, teamId: 't1', department: 'Engineering' },
  { id: 'u6', name: 'Vũ Lan Anh', role: 'employee', avatar: makeAvatar('#FDBCB4', 3, '#FF69B4', '#ec4899', 4), exp: 1900, teamId: 't2', department: 'Design' },
  { id: 'u7', name: 'Đặng Quốc Hưng', role: 'employee', avatar: makeAvatar('#4A2912', 4, '#1a1a1a', '#374151', 0), exp: 2300, teamId: 't2', department: 'Design' },
  { id: 'u8', name: 'Bùi Thanh Tú', role: 'employee', avatar: makeAvatar('#C68642', 1, '#D4AC0D', '#d97706', 2), exp: 980, teamId: 't2', department: 'Design' },
]

const INITIAL_TASKS: Task[] = [
  { id: 't1', title: 'Xây dựng API authentication', description: 'Implement JWT authentication với refresh token và blacklist', expReward: 150, status: 'in-progress', assignedTo: 'u3', projectManager: 'u1', supporters: ['u4', 'u5'], createdBy: 'u1', dueDate: '2026-07-30', category: 'development', priority: 'high', selfCreated: false },
  { id: 't2', title: 'Thiết kế UI Dashboard', description: 'Tạo Figma mockup cho trang dashboard chính theo Design System mới', expReward: 80, status: 'open', assignedTo: 'u6', projectManager: 'u2', supporters: ['u7'], createdBy: 'u2', dueDate: '2026-07-28', category: 'design', priority: 'medium', selfCreated: false },
  { id: 't3', title: 'Viết unit tests cho Payment', description: 'Coverage tối thiểu 80% cho toàn bộ module payment', expReward: 100, status: 'completed', assignedTo: 'u4', projectManager: 'u1', supporters: [], createdBy: 'u1', dueDate: '2026-07-22', category: 'development', priority: 'high', selfCreated: false },
  { id: 't4', title: 'Tối ưu query database', description: 'Giảm response time của báo cáo xuống dưới 2 giây', expReward: 120, status: 'open', projectManager: 'u1', supporters: ['u3'], createdBy: 'u1', dueDate: '2026-08-05', category: 'development', priority: 'medium', selfCreated: false },
  { id: 't5', title: 'Học React Query', description: 'Tự học và áp dụng React Query vào dự án hiện tại', expReward: 60, status: 'in-progress', assignedTo: 'u3', supporters: [], createdBy: 'u3', dueDate: '2026-07-29', category: 'research', priority: 'low', selfCreated: true },
  { id: 't6', title: 'Review PR của team', description: 'Review ít nhất 5 pull request trong tuần này', expReward: 40, status: 'open', assignedTo: 'u5', projectManager: 'u1', supporters: [], createdBy: 'u1', dueDate: '2026-07-26', category: 'development', priority: 'low', selfCreated: false },
  { id: 't7', title: 'Xây dựng Design System', description: 'Setup Storybook và tạo component library đầy đủ', expReward: 200, status: 'open', assignedTo: 'u7', projectManager: 'u2', supporters: ['u6', 'u8'], createdBy: 'u2', dueDate: '2026-08-10', category: 'design', priority: 'high', selfCreated: false },
  { id: 't8', title: 'Viết tài liệu API', description: 'Swagger docs đầy đủ cho tất cả API endpoints', expReward: 70, status: 'open', projectManager: 'u1', supporters: [], createdBy: 'u1', dueDate: '2026-08-01', category: 'development', priority: 'medium', selfCreated: false },
]

const INITIAL_MESSAGES: Message[] = [
  { id: 'm1', userId: 'u1', content: '🎉 Chào mừng team đến với WorkQuest! Hãy cùng chinh phục những thử thách mới nhé!', timestamp: '2026-07-23T08:00:00', channel: 'announcements' },
  { id: 'm2', userId: 'u3', content: 'API auth đang tiến triển tốt, dự kiến xong vào thứ 5!', timestamp: '2026-07-23T09:15:00', channel: 'general' },
  { id: 'm3', userId: 'u4', content: 'Vừa hoàn thành unit test rồi mọi người ơi! 🎊', timestamp: '2026-07-23T09:30:00', channel: 'general' },
  { id: 'm4', userId: 'u6', content: 'Ai có design brief cho dashboard không? Chia sẻ mình với!', timestamp: '2026-07-23T10:00:00', channel: 'general' },
  { id: 'm5', userId: 'u2', content: 'Đã upload lên Drive rồi nha Lan Anh, check folder "Q3 Design" nhé 📁', timestamp: '2026-07-23T10:05:00', channel: 'general' },
  { id: 'm6', userId: 'u5', content: 'React Query hay thật, đang tìm hiểu Optimistic Updates 🚀', timestamp: '2026-07-23T10:45:00', channel: 'general' },
  { id: 'm7', userId: 'u7', content: 'Design System đang setup xong Storybook, sẽ share preview link hôm nay!', timestamp: '2026-07-23T11:00:00', channel: 'general' },
  { id: 'm8', userId: 'u1', content: '🏆 Tuần này team Engineering hoàn thành 87% target! Keep it up!', timestamp: '2026-07-23T11:30:00', channel: 'announcements' },
  { id: 'm9', userId: 'u3', content: 'Cần hỗ trợ setup môi trường test không team?', timestamp: '2026-07-23T13:00:00', channel: 'team' },
  { id: 'm10', userId: 'u4', content: 'Mình có thể giúp, nhắn sau standup nhé! 💪', timestamp: '2026-07-23T13:10:00', channel: 'team' },
]

const REWARDS: Reward[] = [
  { id: 'r1', name: 'Voucher Highlands', description: 'Voucher coffee 100.000đ', cost: 200, emoji: '☕', category: 'Ẩm thực' },
  { id: 'r2', name: 'Ngày nghỉ thêm', description: '1 ngày nghỉ có lương bổ sung', cost: 1000, emoji: '🏖️', category: 'Thời gian' },
  { id: 'r3', name: 'Khóa học online', description: 'Udemy/Coursera course tự chọn', cost: 500, emoji: '🎓', category: 'Học tập' },
  { id: 'r4', name: 'Team Lunch', description: 'Bữa trưa team tối đa 8 người', cost: 800, emoji: '🍜', category: 'Ẩm thực' },
  { id: 'r5', name: 'Company Hoodie', description: 'Hoodie limited edition', cost: 350, emoji: '👕', category: 'Quà tặng' },
  { id: 'r6', name: 'Gaming Chair', description: 'Ghế gaming ergonomic cao cấp', cost: 3000, emoji: '🪑', category: 'Thiết bị' },
  { id: 'r7', name: 'WFH Half-day', description: 'Làm từ xa nửa ngày tự chọn', cost: 150, emoji: '🏠', category: 'Thời gian' },
  { id: 'r8', name: 'Sách kỹ thuật', description: 'Sách chuyên ngành tự chọn', cost: 250, emoji: '📖', category: 'Học tập' },
  { id: 'r9', name: 'Massage 1 giờ', description: 'Voucher massage thư giãn', cost: 400, emoji: '💆', category: 'Sức khỏe' },
]

// const TEAMS = [
//   { id: 't1', name: 'Engineering', emoji: '⚙️' },
//   { id: 't2', name: 'Design', emoji: '🎨' },
//   { id: 't3', name: 'Marketing', emoji: '📣' },
//   { id: 't4', name: 'Sales', emoji: '💼' },
//   { id: 't5', name: 'HR', emoji: '🧑\u200d🤝\u200d🧑' },
//   { id: 't6', name: 'Customer Support', emoji: '🎧' },
// ]
const TEAMS = [
  { id: 't1', name: 'HR & IT', emoji: '🧑‍💻' },
  { id: 't2', name: 'Design', emoji: '🎨' },
  { id: 't3', name: 'Marketing', emoji: '📣' },
  { id: 't4', name: 'Sales', emoji: '💼' },
]



const CATEGORY_COLORS: Record<string, string> = {
  development: '#8b5cf6', design: '#06b6d4', marketing: '#f59e0b',
  research: '#10b981', operations: '#f97316', personal: '#6b7280',
}
const PRIORITY_CONFIG = {
  high: { label: 'Cao', color: '#ef4444', bg: '#200a0a' },
  medium: { label: 'Trung bình', color: '#f59e0b', bg: '#1a1000' },
  low: { label: 'Thấp', color: '#6b7280', bg: '#111118' },
}
const STATUS_CONFIG = {
  open: { label: 'Chưa bắt đầu', color: '#6b7280' },
  'in-progress': { label: 'Đang làm', color: '#06b6d4' },
  submitted: { label: 'Chờ duyệt', color: '#a78bfa' },
  completed: { label: 'Hoàn thành', color: '#10b981' },
}

// ==================== LOGIN SCREEN ====================

// function LoginScreen({ onLogin }: { onLogin: (u: User) => void }) {
//   const [step, setStep] = useState<'role' | 'setup'>('role')
//   const [role, setRole] = useState<Role>('employee')
//   const [name, setName] = useState('')
//   const [avatar, setAvatar] = useState<AvatarConfig>({ ...DEFAULT_AVATAR })

//   const handleLogin = () => {
//     if (!name.trim()) return
//     onLogin({
//       id: `user_${Date.now()}`,
//       name: name.trim(),
//       role,
//       avatar,
//       exp: role === 'manager' ? 800 : 100,
//       teamId: 't1',
//       department: role === 'manager' ? 'Engineering' : 'Engineering',
//     })
//   }

//   return (
//     <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
//       style={{ background: 'radial-gradient(ellipse at 20% 50%, #1a0a3a 0%, #080812 50%, #0a1a0a 100%)', fontFamily: 'Inter, sans-serif' }}>
//       {[...Array(20)].map((_, i) => (
//         <div key={i} className="absolute rounded-full pointer-events-none"
//           style={{
//             width: Math.random() * 4 + 1, height: Math.random() * 4 + 1,
//             left: `${(i * 17 + 5) % 100}%`, top: `${(i * 23 + 8) % 100}%`,
//             background: i % 2 === 0 ? '#7c3aed' : '#f59e0b',
//             animation: `float ${3 + (i % 4)}s ease-in-out infinite`,
//             animationDelay: `${(i * 0.4) % 3}s`,
//           }} />
//       ))}

//       <div className="w-full max-w-2xl mx-4 relative z-10">
//         <div className="text-center mb-7">
//           <div className="inline-flex items-center gap-3 mb-3">
//             <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
//               style={{ background: 'linear-gradient(135deg, #7c3aed, #f59e0b)' }}>⚔️</div>
//             <h1 className="text-5xl font-black tracking-widest"
//               style={{ fontFamily: 'Rajdhani, sans-serif', background: 'linear-gradient(135deg, #7c3aed, #f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', filter: 'drop-shadow(0 0 20px #7c3aed60)' }}>
//               WORKQUEST
//             </h1>
//           </div>
//           <p className="text-gray-500 text-sm tracking-widest uppercase">Biến công việc thành cuộc phiêu lưu</p>
//         </div>

//         {step === 'role' ? (
//           <div className="rounded-2xl p-6 animate-slide-up" style={{ background: '#0e0e24', border: '1px solid #1e1e4a' }}>
//             <h2 className="text-white text-xl font-bold mb-1" style={{ fontFamily: 'Rajdhani, sans-serif' }}>Bạn là ai trong công ty?</h2>
//             <p className="text-gray-500 text-sm mb-5">Chọn vai trò để bắt đầu hành trình</p>
//             <div className="grid grid-cols-2 gap-4">
//               {[
//                 { r: 'manager' as Role, icon: '👑', title: 'Quản Lý', desc: 'Giao task, quản lý team và nhận EXP dựa trên hiệu suất cả team', tag: 'Team-based scoring', tagColor: '#a78bfa', bg: '#1a1040', border: '#2a1a6a' },
//                 { r: 'employee' as Role, icon: '⚔️', title: 'Nhân Viên', desc: 'Nhận task, hoàn thành mục tiêu và kiếm EXP để đổi phần thưởng', tag: 'Individual scoring', tagColor: '#34d399', bg: '#0a1a10', border: '#1a4a2a' },
//               ].map(opt => (
//                 <button key={opt.r} onClick={() => { setRole(opt.r); setStep('setup') }}
//                   className="p-6 rounded-xl text-left transition-all hover:scale-[1.02]"
//                   style={{ background: `linear-gradient(135deg, ${opt.bg}, #0e0e24)`, border: `1px solid ${opt.border}` }}>
//                   <div className="text-4xl mb-3">{opt.icon}</div>
//                   <div className="text-white font-bold text-lg mb-2" style={{ fontFamily: 'Rajdhani, sans-serif' }}>{opt.title}</div>
//                   <div className="text-gray-400 text-xs mb-3 leading-relaxed">{opt.desc}</div>
//                   <div className="text-xs" style={{ color: opt.tagColor }}>⚡ {opt.tag}</div>
//                 </button>
//               ))}
//             </div>
//           </div>
//         ) : (
//           <div className="rounded-2xl p-6 animate-slide-up" style={{ background: '#0e0e24', border: '1px solid #1e1e4a' }}>
//             <div className="flex items-center gap-3 mb-5">
//               <button onClick={() => setStep('role')} className="text-gray-500 hover:text-gray-300 text-sm">← Quay lại</button>
//               <div>
//                 <h2 className="text-white text-xl font-bold" style={{ fontFamily: 'Rajdhani, sans-serif' }}>Tạo hồ sơ nhân vật</h2>
//                 <p className="text-gray-600 text-xs">{role === 'manager' ? '👑 Quản Lý' : '⚔️ Nhân Viên'}</p>
//               </div>
//             </div>

//             <div className="mb-4">
//               <label className="text-gray-500 text-xs uppercase tracking-wider mb-1.5 block">Tên của bạn</label>
//               <input type="text" value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()}
//                 placeholder="Nhập tên hiển thị..."
//                 className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-600 outline-none"
//                 style={{ background: '#14143a', border: '1px solid #2a2a5a' }} />
//             </div>

//             <AvatarCreator value={avatar} onChange={setAvatar} />

//             <button onClick={handleLogin} disabled={!name.trim()}
//               className="w-full mt-5 py-3.5 rounded-xl font-bold text-white text-lg tracking-wide transition-all hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed"
//               style={{
//                 fontFamily: 'Rajdhani, sans-serif',
//                 background: name.trim() ? 'linear-gradient(135deg, #7c3aed, #f59e0b)' : '#1e1e3a',
//                 boxShadow: name.trim() ? '0 0 30px #7c3aed50' : 'none',
//               }}>
//               BẮT ĐẦU HÀNH TRÌNH ⚡
//             </button>
//           </div>
//         )}
//         <p className="text-center text-gray-700 text-xs mt-4">WorkQuest v1.0 — Gamify Your Workday</p>
//       </div>
//     </div>
//   )
// }

function LoginScreen({ onLoggedIn }: { onLoggedIn: () => void }) {
  const [authMode, setAuthMode] = useState<'signup' | 'signin'>('signup')
  const [step, setStep] = useState<'role' | 'setup'>('role')
  const [role, setRole] = useState<Role>('employee')
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState<AvatarConfig>({ ...DEFAULT_AVATAR })
  const [teamId, setTeamId] = useState(TEAMS[0].id)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSignUp = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) return
    setError('')
    setLoading(true)

    const { data, error: signUpError } = await supabase.auth.signUp({ email, password })
    if (signUpError) { setLoading(false); setError(signUpError.message); return }
    if (!data.user) { setLoading(false); setError('Kiểm tra email để xác nhận tài khoản, sau đó đăng nhập lại.'); return }

    const team = TEAMS.find(t => t.id === teamId)!
    const { error: profileError } = await supabase.from('profiles').insert({
      id: data.user.id,
      name: name.trim(),
      role,
      avatar,
      exp: 0,
      team_id: team.id,
      department: team.name,
})
    setLoading(false)
    if (profileError) { setError(profileError.message); return }
    onLoggedIn()
  }

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) return
    setError('')
    setLoading(true)
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (signInError) { setError(signInError.message); return }
    onLoggedIn()
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at 20% 50%, #1a0a3a 0%, #080812 50%, #0a1a0a 100%)', fontFamily: 'Inter, sans-serif' }}>
      {[...Array(20)].map((_, i) => (
        <div key={i} className="absolute rounded-full pointer-events-none"
          style={{
            width: Math.random() * 4 + 1, height: Math.random() * 4 + 1,
            left: `${(i * 17 + 5) % 100}%`, top: `${(i * 23 + 8) % 100}%`,
            background: i % 2 === 0 ? '#7c3aed' : '#f59e0b',
            animation: `float ${3 + (i % 4)}s ease-in-out infinite`,
            animationDelay: `${(i * 0.4) % 3}s`,
          }} />
      ))}

      <div className="w-full max-w-2xl mx-4 relative z-10">
        <div className="text-center mb-7">
          <div className="inline-flex flex-col items-center gap-3 mb-3">
            <img src={companyLogo} alt="KNI Investment Holdings"
              className="h-16 rounded-xl" style={{ filter: 'drop-shadow(0 0 20px #7c3aed40)' }} />
            <h1 className="text-2xl font-black tracking-widest"
              style={{ fontFamily: 'Rajdhani, sans-serif', color: '#e2e8f0' }}>
              KNI TASK MANAGEMENT
            </h1>
          </div>
          <p className="text-gray-500 text-sm tracking-widest uppercase">Hệ thống quản lý công việc nội bộ</p>
        </div>

        {/* --- Chuyển đổi Đăng nhập / Đăng ký --- */}
        <div className="flex justify-center gap-2 mb-5">
          <button onClick={() => { setAuthMode('signup'); setStep('role'); setError('') }}
            className="px-5 py-1.5 rounded-full text-xs font-bold tracking-wide"
            style={{ background: authMode === 'signup' ? 'linear-gradient(135deg,#7c3aed,#f59e0b)' : '#14143a', color: authMode === 'signup' ? '#fff' : '#6b7280' }}>
            TẠO TÀI KHOẢN
          </button>
          <button onClick={() => { setAuthMode('signin'); setError('') }}
            className="px-5 py-1.5 rounded-full text-xs font-bold tracking-wide"
            style={{ background: authMode === 'signin' ? 'linear-gradient(135deg,#7c3aed,#f59e0b)' : '#14143a', color: authMode === 'signin' ? '#fff' : '#6b7280' }}>
            ĐĂNG NHẬP
          </button>
        </div>

        {authMode === 'signin' ? (
          /* --- FORM ĐĂNG NHẬP (cho người đã có tài khoản) --- */
          <div className="rounded-2xl p-6 animate-slide-up" style={{ background: '#0e0e24', border: '1px solid #1e1e4a' }}>
            <h2 className="text-white text-xl font-bold mb-1" style={{ fontFamily: 'Rajdhani, sans-serif' }}>Đăng nhập</h2>
            <p className="text-gray-500 text-sm mb-5">Quay lại hành trình của bạn</p>

            <div className="mb-3">
              <label className="text-gray-500 text-xs uppercase tracking-wider mb-1.5 block">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="ban@congty.com"
                className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-600 outline-none"
                style={{ background: '#14143a', border: '1px solid #2a2a5a' }} />
            </div>
            <div className="mb-2">
              <label className="text-gray-500 text-xs uppercase tracking-wider mb-1.5 block">Mật khẩu</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSignIn()}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-600 outline-none"
                style={{ background: '#14143a', border: '1px solid #2a2a5a' }} />
            </div>

            {error && <p className="text-red-400 text-xs mb-3">{error}</p>}

            <button onClick={handleSignIn} disabled={loading || !email.trim() || !password.trim()}
              className="w-full mt-3 py-3.5 rounded-xl font-bold text-white text-lg tracking-wide transition-all hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                fontFamily: 'Rajdhani, sans-serif',
                background: 'linear-gradient(135deg, #7c3aed, #f59e0b)',
                boxShadow: '0 0 30px #7c3aed50',
              }}>
              {loading ? 'ĐANG XỬ LÝ...' : 'VÀO GAME ⚡'}
            </button>
          </div>
        ) : step === 'role' ? (
          /* --- BƯỚC 1 CỦA ĐĂNG KÝ: chọn vai trò (giữ nguyên như code gốc) --- */
          <div className="rounded-2xl p-6 animate-slide-up" style={{ background: '#0e0e24', border: '1px solid #1e1e4a' }}>
            <h2 className="text-white text-xl font-bold mb-1" style={{ fontFamily: 'Rajdhani, sans-serif' }}>Bạn là ai trong công ty?</h2>
            <p className="text-gray-500 text-sm mb-5">Chọn vai trò để bắt đầu hành trình</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { r: 'manager' as Role, icon: '👑', title: 'Quản Lý', desc: 'Giao task, quản lý team và nhận EXP dựa trên hiệu suất cả team', tag: 'Team-based scoring', tagColor: '#a78bfa', bg: '#1a1040', border: '#2a1a6a' },
                { r: 'employee' as Role, icon: '⚔️', title: 'Nhân Viên', desc: 'Nhận task, hoàn thành mục tiêu và kiếm EXP để đổi phần thưởng', tag: 'Individual scoring', tagColor: '#34d399', bg: '#0a1a10', border: '#1a4a2a' },
              ].map(opt => (
                <button key={opt.r} onClick={() => { setRole(opt.r); setStep('setup') }}
                  className="p-6 rounded-xl text-left transition-all hover:scale-[1.02]"
                  style={{ background: `linear-gradient(135deg, ${opt.bg}, #0e0e24)`, border: `1px solid ${opt.border}` }}>
                  <div className="text-4xl mb-3">{opt.icon}</div>
                  <div className="text-white font-bold text-lg mb-2" style={{ fontFamily: 'Rajdhani, sans-serif' }}>{opt.title}</div>
                  <div className="text-gray-400 text-xs mb-3 leading-relaxed">{opt.desc}</div>
                  <div className="text-xs" style={{ color: opt.tagColor }}>⚡ {opt.tag}</div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* --- BƯỚC 2 CỦA ĐĂNG KÝ: tên, avatar + email/password mới --- */
          <div className="rounded-2xl p-6 animate-slide-up" style={{ background: '#0e0e24', border: '1px solid #1e1e4a' }}>
            <div className="flex items-center gap-3 mb-5">
              <button onClick={() => setStep('role')} className="text-gray-500 hover:text-gray-300 text-sm">← Quay lại</button>
              <div>
                <h2 className="text-white text-xl font-bold" style={{ fontFamily: 'Rajdhani, sans-serif' }}>Tạo hồ sơ nhân vật</h2>
                <p className="text-gray-600 text-xs">{role === 'manager' ? '👑 Quản Lý' : '⚔️ Nhân Viên'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="text-gray-500 text-xs uppercase tracking-wider mb-1.5 block">Tên của bạn</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)}
                  placeholder="Nhập tên hiển thị..."
                  className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-600 outline-none"
                  style={{ background: '#14143a', border: '1px solid #2a2a5a' }} />
              </div>
              <div>
                <label className="text-gray-500 text-xs uppercase tracking-wider mb-1.5 block">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="ban@congty.com"
                  className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-600 outline-none"
                  style={{ background: '#14143a', border: '1px solid #2a2a5a' }} />
              </div>
            </div>
            <div className="mb-4">
              <label className="text-gray-500 text-xs uppercase tracking-wider mb-1.5 block">Ngành / Phòng ban</label>
              <select value={teamId} onChange={e => setTeamId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-white outline-none"
                style={{ background: '#14143a', border: '1px solid #2a2a5a' }}>
                {TEAMS.map(t => <option key={t.id} value={t.id}>{t.emoji} {t.name}</option>)}
              </select>
            </div>
            <div className="mb-4">
              <label className="text-gray-500 text-xs uppercase tracking-wider mb-1.5 block">Mật khẩu</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSignUp()}
                placeholder="Tối thiểu 6 ký tự"
                className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-600 outline-none"
                style={{ background: '#14143a', border: '1px solid #2a2a5a' }} />
            </div>

            <AvatarCreator value={avatar} onChange={setAvatar} />

            {error && <p className="text-red-400 text-xs mt-3">{error}</p>}

            <button onClick={handleSignUp} disabled={loading || !name.trim() || !email.trim() || !password.trim()}
              className="w-full mt-5 py-3.5 rounded-xl font-bold text-white text-lg tracking-wide transition-all hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                fontFamily: 'Rajdhani, sans-serif',
                background: (name.trim() && email.trim() && password.trim()) ? 'linear-gradient(135deg, #7c3aed, #f59e0b)' : '#1e1e3a',
                boxShadow: (name.trim() && email.trim() && password.trim()) ? '0 0 30px #7c3aed50' : 'none',
              }}>
              {loading ? 'ĐANG XỬ LÝ...' : 'BẮT ĐẦU HÀNH TRÌNH ⚡'}
            </button>
          </div>
        )}
        <p className="text-center text-gray-700 text-xs mt-4">WorkQuest v1.0 — Gamify Your Workday</p>
      </div>
    </div>
  )
}
// ==================== DASHBOARD ====================

function DashboardView({ currentUser, tasks, users, setTasks, setCurrentUser, setView }: {
  currentUser: User; tasks: Task[]; users: User[]
  setTasks: (t: Task[]) => void; setCurrentUser: (u: User) => void
  setView: (v: View) => void
}) {
  const { progress, needed, level } = getExpProgress(currentUser.exp)
  const isManager = currentUser.role === 'manager'
  const myTasks = tasks.filter(t => t.assignedTo === currentUser.id || (t.selfCreated && t.createdBy === currentUser.id))
  const pending = myTasks.filter(t => t.status !== 'completed')
  const teamExp = users.filter(u => u.teamId === currentUser.teamId).reduce((s, u) => s + u.exp, 0)

  const handleComplete = (taskId: string, expReward: number) => {
    setTasks(tasks.map(t => t.id === taskId ? { ...t, status: 'completed' } : t))
    setCurrentUser({ ...currentUser, exp: currentUser.exp + expReward })
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">
      {/* Hero */}
      <div className="rounded-2xl p-6 relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${currentUser.avatar.outfitColor}22, #0a0a1e)`, border: `1px solid ${currentUser.avatar.outfitColor}35` }}>
        <div className="flex items-center gap-5">
          <div className="rounded-2xl overflow-hidden flex-shrink-0"
            style={{ width: 80, height: 96, background: `${currentUser.avatar.outfitColor}20`, border: `2px solid ${currentUser.avatar.outfitColor}40`, boxShadow: `0 0 30px ${currentUser.avatar.outfitColor}40` }}>
            <FullAvatar avatar={currentUser.avatar} size={72} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-gray-400 text-sm">Xin chào,</span>
              <LevelBadge exp={currentUser.exp} />
              {isManager && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#1a0a3a', color: '#a78bfa' }}>👑 Manager</span>}
            </div>
            <h2 className="text-white text-2xl font-bold" style={{ fontFamily: 'Rajdhani, sans-serif' }}>{currentUser.name}</h2>
            
            <p className="text-gray-500 text-sm">{TEAMS.find(t => t.id === currentUser.teamId)?.name ?? 'Chưa có team'}</p>
            <div className="mt-3">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-gray-500">Level {level} → {level + 1}</span>
                <span className="text-gray-600">Cần {needed} EXP</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: '#1a1a3a' }}>
                <div className="h-full rounded-full" style={{ width: `${progress}%`, background: 'linear-gradient(90deg,#7c3aed,#f59e0b)', transition: 'width 0.7s ease' }} />
              </div>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-amber-400 text-4xl font-black" style={{ fontFamily: 'Rajdhani, sans-serif' }}>{currentUser.exp.toLocaleString()}</div>
            <div className="text-gray-600 text-xs uppercase tracking-wider">EXP tổng</div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Task đang làm', value: myTasks.filter(t => t.status === 'in-progress').length, color: '#06b6d4', icon: '⚡' },
          { label: 'Chưa bắt đầu', value: myTasks.filter(t => t.status === 'open').length, color: '#f59e0b', icon: '📋' },
          { label: 'Hoàn thành', value: myTasks.filter(t => t.status === 'completed').length, color: '#10b981', icon: '✅' },
          isManager
            ? { label: 'Tổng EXP team', value: teamExp.toLocaleString(), color: '#a78bfa', icon: '👥' }
            : { label: 'Hạng cá nhân', value: '#' + ([...users].sort((a, b) => b.exp - a.exp).findIndex(u => u.id === currentUser.id) + 1), color: '#ec4899', icon: '🏆' },
        ].map(stat => (
          <div key={stat.label} className="rounded-xl p-4" style={{ background: '#0e0e24', border: '1px solid #1e1e4a' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xl">{stat.icon}</span>
              <span className="text-2xl font-black" style={{ color: stat.color, fontFamily: 'Rajdhani, sans-serif' }}>{stat.value}</span>
            </div>
            <div className="text-gray-500 text-xs">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Tasks */}
        <div className="col-span-2 rounded-xl p-5" style={{ background: '#0e0e24', border: '1px solid #1e1e4a' }}>
          <h3 className="text-white font-bold mb-4 flex items-center gap-2" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            ⚡ Task của tôi
            <span className="text-xs font-normal px-2 py-0.5 rounded-full" style={{ background: '#1e1e4a', color: '#6b7280' }}>{pending.length} chờ</span>
          </h3>
          <div className="space-y-2">
            {pending.slice(0, 5).map(task => (
              <div key={task.id} className="p-3 rounded-lg flex items-center gap-3 group"
                style={{ background: '#12122a', border: '1px solid #1a1a3a' }}>
                <div className="w-1.5 h-8 rounded-full flex-shrink-0" style={{ background: PRIORITY_CONFIG[task.priority].color }} />
                <div className="flex-1 min-w-0">
                  <div className="text-white text-sm font-medium truncate">
                    {task.title}
                    {task.selfCreated && <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded" style={{ background: '#1a2a1a', color: '#10b981' }}>Tự tạo</span>}
                  </div>
                  <div className="text-xs mt-0.5">
                    <span style={{ color: STATUS_CONFIG[task.status].color }}>{STATUS_CONFIG[task.status].label}</span>
                    <span className="text-gray-700 mx-1">·</span>
                    <span className="text-gray-600">Hạn {fmtDate(task.dueDate)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-amber-400 font-bold text-sm" style={{ fontFamily: 'Rajdhani, sans-serif' }}>+{task.expReward}</span>
                  {task.assignedTo === currentUser.id && task.status === 'in-progress' && (
                    <button onClick={() => setView('tasks')}
                      className="text-xs px-3 py-1 rounded-lg font-semibold" style={{ background: '#1a1a40', color: '#a78bfa' }}>
                      Vào nộp task →
                    </button>
                  )}
                </div>
              </div>
            ))}
            {pending.length === 0 && (
              <div className="text-center py-8 text-gray-600">
                <div className="text-3xl mb-2">🎉</div>
                <div className="text-sm">Tất cả task đã hoàn thành!</div>
              </div>
            )}
          </div>
        </div>

        {/* Mini leaderboard */}
        <div className="rounded-xl p-5" style={{ background: '#0e0e24', border: '1px solid #1e1e4a' }}>
          <h3 className="text-white font-bold mb-4 flex items-center gap-2" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            🏆 {isManager ? 'Team' : 'Bảng xếp hạng'}
          </h3>
          <div className="space-y-3">
            {(isManager ? users.filter(u => u.teamId === currentUser.teamId && u.id !== currentUser.id && u.role === 'employee')
              : users.filter(u => u.role === 'employee'))
              .sort((a, b) => b.exp - a.exp).slice(0, 5).map((user, i) => (
                <div key={user.id} className="flex items-center gap-2.5">
                  <span className="text-gray-600 text-xs w-4 font-mono">#{i + 1}</span>
                  <CharAvatar user={user} size={28} />
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-xs font-medium truncate">{user.name.split(' ').slice(-1)[0]}</div>
                    <ExpBarMini exp={user.exp} />
                  </div>
                  <div className="text-amber-400 text-xs font-bold" style={{ fontFamily: 'Rajdhani, sans-serif' }}>{user.exp}</div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ===========================================================================
function SubmitTaskModal({ task, onClose }: { task: Task; onClose: () => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [note, setNote] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!file) { setError('Vui lòng chọn ảnh hoặc file kết quả trước khi nộp.'); return }
    setError('')
    setUploading(true)

    const ext = file.name.split('.').pop()
    const path = `${task.id}/${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage.from('task-submissions').upload(path, file)
    if (uploadError) { setUploading(false); setError('Lỗi tải file: ' + uploadError.message); return }

    const { data: urlData } = supabase.storage.from('task-submissions').getPublicUrl(path)

    const { error: updateError } = await supabase.from('tasks').update({
      status: 'submitted',
      submission_file_url: urlData.publicUrl,
      submission_note: note.trim() || null,
      submitted_at: new Date().toISOString(),
      rejected_reason: null,
    }).eq('id', task.id)

    setUploading(false)
    if (updateError) { setError(updateError.message); return }
    onClose()
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 px-4" style={{ background: '#000000a0' }}>
      <div className="w-full max-w-md rounded-2xl p-6" style={{ background: '#0e0e24', border: '1px solid #1e1e4a' }}>
        <h3 className="text-white font-bold text-lg mb-1" style={{ fontFamily: 'Rajdhani, sans-serif' }}>Nộp kết quả task</h3>
        <p className="text-gray-500 text-sm mb-4">{task.title}</p>

        <label className="text-gray-500 text-xs uppercase tracking-wider mb-1.5 block">Ảnh / File kết quả</label>
        <input type="file" accept="image/*,.pdf,.doc,.docx,.zip"
          onChange={e => setFile(e.target.files?.[0] ?? null)}
          className="w-full text-sm text-gray-300 mb-4 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-purple-600 file:text-white"
        />

        <label className="text-gray-500 text-xs uppercase tracking-wider mb-1.5 block">Ghi chú (không bắt buộc)</label>
        <textarea value={note} onChange={e => setNote(e.target.value)} rows={3}
          placeholder="Mô tả ngắn gọn kết quả đã làm..."
          className="w-full px-4 py-2.5 mb-4 rounded-xl text-white placeholder-gray-600 text-sm outline-none resize-none"
          style={{ background: '#14143a', border: '1px solid #2a2a5a' }} />

        {error && <p className="text-red-400 text-xs mb-3">{error}</p>}

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl font-semibold text-sm text-gray-400" style={{ background: '#14143a' }}>
            Huỷ
          </button>
          <button onClick={handleSubmit} disabled={uploading}
            className="flex-1 py-2.5 rounded-xl font-bold text-sm disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', color: '#fff' }}>
            {uploading ? 'Đang tải lên...' : 'Nộp task'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ==================== TASKS VIEW ====================

function TasksView({ currentUser, tasks, users, setTasks, setCurrentUser }: {
  currentUser: User; tasks: Task[]; users: User[]
  setTasks: (t: Task[]) => void; setCurrentUser: (u: User) => void
}) {
  const [filter, setFilter] = useState<'all' | 'mine' | 'open' | 'done'>('all')
  const [showModal, setShowModal] = useState(false)
  const [supportersOpen, setSupportersOpen] = useState(false)
  const supportersRef = useRef<HTMLDivElement>(null)
  const [submittingTask, setSubmittingTask] = useState<Task | null>(null)
  const [form, setForm] = useState({
    title: '', description: '', expReward: 50, dueDate: '',
    category: 'development', priority: 'medium' as TaskPriority,
    assignedTo: '', projectManager: '', supporters: [] as string[],
  })

  const isManager = currentUser.role === 'manager'
  const employees = users.filter(u => u.role === 'employee' && u.teamId === currentUser.teamId)
  const teamUsers = users.filter(u => u.teamId === currentUser.teamId)

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (supportersRef.current && !supportersRef.current.contains(e.target as Node)) setSupportersOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const visible = tasks.filter(t => {
    const isMyTask = t.assignedTo === currentUser.id || (t.selfCreated && t.createdBy === currentUser.id)
    const assignee = users.find(u => u.id === t.assignedTo)
    const inScope = isManager
      ? (t.createdBy === currentUser.id || assignee?.teamId === currentUser.teamId)
      : isMyTask
    if (!inScope) return false
    if (filter === 'mine') return isMyTask
    if (filter === 'open') return t.status === 'open'
    if (filter === 'done') return t.status === 'completed'
    return true
  })

  // const handleStart = (id: string) => setTasks(tasks.map(t => t.id === id ? { ...t, status: 'in-progress' } : t))
  // const handleComplete = (id: string, exp: number) => {
  //   setTasks(tasks.map(t => t.id === id ? { ...t, status: 'completed' } : t))
  //   setCurrentUser({ ...currentUser, exp: currentUser.exp + exp })
  // }
  // const handleCreate = () => {
  //   if (!form.title.trim()) return
  //   setTasks([...tasks, {
  //     id: `task_${Date.now()}`, title: form.title, description: form.description, expReward: form.expReward,
  //     status: 'open', assignedTo: isManager ? (form.assignedTo || undefined) : currentUser.id,
  //     projectManager: form.projectManager || undefined, supporters: form.supporters,
  //     createdBy: currentUser.id,
  //     dueDate: form.dueDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
  //     category: form.category, priority: form.priority, selfCreated: !isManager,
  //   }])
  //   setShowModal(false)
  //   setForm({ title: '', description: '', expReward: 50, dueDate: '', category: 'development', priority: 'medium', assignedTo: '', projectManager: '', supporters: [] })
  // }

  const handleStart = async (id: string) => {
  await supabase.from('tasks').update({ status: 'in-progress' }).eq('id', id)
}

const handleApprove = async (task: Task) => {
  await supabase.from('tasks').update({ status: 'completed' }).eq('id', task.id)
  if (task.assignedTo) {
    const assignee = users.find(u => u.id === task.assignedTo)
    if (assignee) await supabase.from('profiles').update({ exp: assignee.exp + task.expReward }).eq('id', assignee.id)
  }
}

const handleReject = async (task: Task) => {
  const reason = window.prompt('Lý do từ chối (nhân viên sẽ thấy để sửa lại):') ?? ''
  await supabase.from('tasks').update({
    status: 'in-progress', submission_file_url: null, submission_note: null, rejected_reason: reason,
  }).eq('id', task.id)
}

const handleCreate = async () => {
  if (!form.title.trim()) return
  await supabase.from('tasks').insert({
    title: form.title, description: form.description, exp_reward: form.expReward,
    status: 'open', assigned_to: isManager ? (form.assignedTo || null) : currentUser.id,
    project_manager: form.projectManager || null, supporters: form.supporters,
    created_by: currentUser.id,
    due_date: form.dueDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    category: form.category, priority: form.priority, self_created: !isManager,
  })
  setShowModal(false)
  setForm({ title: '', description: '', expReward: 50, dueDate: '', category: 'development', priority: 'medium', assignedTo: '', projectManager: '', supporters: [] })
}

  const toggleSupporter = (uid: string) => {
    setForm(f => ({
      ...f, supporters: f.supporters.includes(uid)
        ? f.supporters.filter(s => s !== uid)
        : [...f.supporters, uid],
    }))
  }

  const getUserById = (id?: string) => users.find(u => u.id === id)

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-white text-2xl font-bold" style={{ fontFamily: 'Rajdhani, sans-serif' }}>Quản lý Task</h2>
          <p className="text-gray-500 text-sm">{visible.length} task</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="px-4 py-2.5 rounded-xl font-bold text-white text-sm flex items-center gap-2 transition-all hover:scale-105"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #5b21b6)', boxShadow: '0 0 20px #7c3aed40' }}>
          <span className="text-lg leading-none">+</span>
          <span>{isManager ? 'Giao Task' : 'Tự tạo Task'}</span>
        </button>
      </div>

      <div className="flex gap-2 mb-5">
        {[{ id: 'all', label: 'Tất cả' }, { id: 'mine', label: 'Của tôi' }, { id: 'open', label: 'Chưa làm' }, { id: 'done', label: 'Xong' }].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id as typeof filter)}
            className="px-3.5 py-1.5 rounded-lg text-sm transition-all"
            style={{ background: filter === f.id ? '#7c3aed' : '#0e0e24', color: filter === f.id ? '#fff' : '#6b7280', border: `1px solid ${filter === f.id ? '#7c3aed' : '#1e1e4a'}` }}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {visible.map(task => {
          const assignee = getUserById(task.assignedTo)
          const pm = getUserById(task.projectManager)
          const pri = PRIORITY_CONFIG[task.priority]
          const isMyTask = task.assignedTo === currentUser.id
          const catColor = CATEGORY_COLORS[task.category] ?? '#6b7280'

          return (
            <div key={task.id} className="rounded-xl p-4 flex flex-col transition-all hover:-translate-y-0.5"
              style={{ background: '#0e0e24', border: `1px solid ${task.status === 'completed' ? '#10b98120' : '#1e1e4a'}` }}>
              {/* Header */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-medium uppercase tracking-wider"
                      style={{ background: `${catColor}20`, color: catColor }}>{task.category}</span>
                    {task.selfCreated && <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: '#1a2a1a', color: '#10b981' }}>Tự tạo</span>}
                  </div>
                  <h3 className="text-white font-semibold text-sm">{task.title}</h3>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-amber-400 font-black text-lg leading-none" style={{ fontFamily: 'Rajdhani, sans-serif' }}>+{task.expReward}</div>
                  <div className="text-amber-700 text-[10px]">EXP</div>
                </div>
              </div>

              <p className="text-gray-500 text-xs mb-3 line-clamp-2 leading-relaxed">{task.description}</p>

              {/* Priority + date */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs px-2 py-0.5 rounded" style={{ background: pri.bg, color: pri.color }}>{pri.label}</span>
                <span className="text-gray-600 text-xs">📅 {fmtDate(task.dueDate)}</span>
              </div>

              {/* People section */}
              <div className="space-y-1.5 mb-3">
                {/* Assignee */}
                <div className="flex items-center gap-2">
                  <span className="text-gray-700 text-[10px] w-14 flex-shrink-0">Phụ trách:</span>
                  {assignee ? (
                    <div className="flex items-center gap-1.5">
                      <CharAvatar user={assignee} size={20} />
                      <span className="text-gray-400 text-xs">{assignee.name.split(' ').slice(-1)[0]}</span>
                    </div>
                  ) : <span className="text-gray-700 text-xs italic">Chưa giao</span>}
                </div>

                {/* Project Manager */}
                {pm && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-700 text-[10px] w-14 flex-shrink-0">QL dự án:</span>
                    <div className="flex items-center gap-1.5">
                      <CharAvatar user={pm} size={20} />
                      <span className="text-gray-400 text-xs">{pm.name.split(' ').slice(-1)[0]}</span>
                      <span className="text-[9px] px-1 rounded" style={{ background: '#1a0a3a', color: '#a78bfa' }}>PM</span>
                    </div>
                  </div>
                )}

                {/* Supporters */}
                {task.supporters.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-700 text-[10px] w-14 flex-shrink-0">Hỗ trợ:</span>
                    <div className="flex -space-x-1">
                      {task.supporters.slice(0, 4).map(sid => {
                        const su = getUserById(sid)
                        return su ? <CharAvatar key={sid} user={su} size={20} /> : null
                      })}
                      {task.supporters.length > 4 && (
                        <div className="w-5 h-5 rounded-full bg-[#1e1e4a] flex items-center justify-center text-[9px] text-gray-400"
                          style={{ border: '2px solid #0e0e24' }}>+{task.supporters.length - 4}</div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions
              <div className="flex items-center justify-end mt-auto">
                {task.status === 'completed'
                  ? <span className="text-green-400 text-xs">✓ Hoàn thành</span>
                  : isMyTask
                    ? (
                      <div className="flex gap-1.5">

                        {task.status === 'open' && (
                          <button onClick={() => handleStart(task.id)}
                            className="px-4 py-2 rounded-xl text-sm font-bold" style={{ background: '#1e293b', color: '#60a5fa' }}>
                            Bắt đầu
                          </button>
                        )}
                        {task.status === 'in-progress' && task.assignedTo === currentUser.id && (
                          <button onClick={() => setSubmittingTask(task)}
                            className="px-4 py-2 rounded-xl text-sm font-bold" style={{ background: '#1e293b', color: '#34d399' }}>
                            Nộp task ✓
                          </button>
                        )}
                        {task.status === 'in-progress' && task.rejectedReason && task.assignedTo === currentUser.id && (
                          <p className="text-red-400 text-xs mt-1">❌ Bị từ chối: {task.rejectedReason}</p>
                        )}
                        {task.status === 'submitted' && task.assignedTo === currentUser.id && (
                          <span className="px-3 py-1.5 rounded-xl text-xs font-semibold" style={{ background: '#1a1a40', color: '#a78bfa' }}>
                            ⏳ Đang chờ quản lý duyệt
                          </span>
                        )}
                        {task.status === 'submitted' && currentUser.role === 'manager' && (
                          <div className="flex flex-col gap-1.5 items-end">
                            {task.submissionFileUrl && (
                              <a href={task.submissionFileUrl} target="_blank" rel="noopener noreferrer"
                                className="text-xs underline" style={{ color: '#60a5fa' }}>
                                📎 Xem file đã nộp
                              </a>
                            )}
                            {task.submissionNote && <p className="text-gray-500 text-xs max-w-[200px] text-right">{task.submissionNote}</p>}
                            <div className="flex gap-1.5">
                              <button onClick={() => handleReject(task)}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold" style={{ background: '#2a1010', color: '#f87171' }}>
                                Không chấp nhận
                              </button>
                              <button onClick={() => handleApprove(task)}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold" style={{ background: '#0f2a1a', color: '#34d399' }}>
                                ✓ Duyệt
                              </button>
                            </div>
                          </div>
                        )}

                      </div>
                    )
                    : <span className="text-xs px-2 py-0.5 rounded" style={{ color: STATUS_CONFIG[task.status].color, background: '#12121a' }}>
                      {STATUS_CONFIG[task.status].label}
                    </span>
                }
              </div> */}
              {/* Actions */}
            <div className="flex items-center justify-end mt-auto">
              {task.status === 'completed' ? (
                <span className="text-green-400 text-xs">✓ Hoàn thành</span>

              ) : task.status === 'submitted' && currentUser.role === 'manager' ? (
                <div className="flex flex-col gap-1.5 items-end">
                  {task.submissionFileUrl && (
                    <a href={task.submissionFileUrl} target="_blank" rel="noopener noreferrer"
                      className="text-xs underline" style={{ color: '#60a5fa' }}>
                      📎 Xem file đã nộp
                    </a>
                  )}
                  {task.submissionNote && <p className="text-gray-500 text-xs max-w-[200px] text-right">{task.submissionNote}</p>}
                  <div className="flex gap-1.5">
                    <button onClick={() => handleReject(task)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold" style={{ background: '#2a1010', color: '#f87171' }}>
                      Không chấp nhận
                    </button>
                    <button onClick={() => handleApprove(task)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold" style={{ background: '#0f2a1a', color: '#34d399' }}>
                      ✓ Duyệt
                    </button>
                  </div>
                </div>

              ) : task.status === 'submitted' && task.assignedTo === currentUser.id ? (
                <span className="px-3 py-1.5 rounded-xl text-xs font-semibold" style={{ background: '#1a1a40', color: '#a78bfa' }}>
                  ⏳ Đang chờ quản lý duyệt
                </span>

              ) : isMyTask ? (
                <div className="flex flex-col gap-1 items-end">
                  <div className="flex gap-1.5">
                    {task.status === 'open' && (
                      <button onClick={() => handleStart(task.id)}
                        className="px-4 py-2 rounded-xl text-sm font-bold" style={{ background: '#1e293b', color: '#60a5fa' }}>
                        Bắt đầu
                      </button>
                    )}
                    {task.status === 'in-progress' && (
                      <button onClick={() => setSubmittingTask(task)}
                        className="px-4 py-2 rounded-xl text-sm font-bold" style={{ background: '#1e293b', color: '#34d399' }}>
                        Nộp task ✓
                      </button>
                    )}
                  </div>
                  {task.status === 'in-progress' && task.rejectedReason && (
                    <p className="text-red-400 text-xs mt-1 max-w-[200px] text-right">❌ Bị từ chối: {task.rejectedReason}</p>
                  )}
                </div>

              ) : (
                <span className="text-xs px-2 py-0.5 rounded" style={{ color: STATUS_CONFIG[task.status].color, background: '#12121a' }}>
                  {STATUS_CONFIG[task.status].label}
                </span>
              )}
            </div>
            </div>
          )
        })}
      </div>

      {visible.length === 0 && (
        <div className="text-center py-16 text-gray-600">
          <div className="text-4xl mb-3">📭</div>
          <div className="text-sm">Không có task nào</div>
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)' }}>
          <div className="w-full max-w-md rounded-2xl p-6 animate-slide-up max-h-[90vh] overflow-y-auto"
            style={{ background: '#0e0e24', border: '1px solid #1e1e4a' }}>
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-white font-bold text-lg" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                {isManager ? '📋 Giao Task Mới' : '🎯 Tạo Task Cá Nhân'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-300 text-2xl leading-none">×</button>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="text-gray-500 text-xs uppercase tracking-wider mb-1.5 block">Tên task *</label>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="Mô tả ngắn gọn task..."
                  className="w-full px-3 py-2.5 rounded-lg text-white placeholder-gray-600 text-sm outline-none"
                  style={{ background: '#14143a', border: '1px solid #2a2a5a' }} />
              </div>

              <div>
                <label className="text-gray-500 text-xs uppercase tracking-wider mb-1.5 block">Mô tả</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Yêu cầu và mục tiêu cụ thể..." rows={2}
                  className="w-full px-3 py-2.5 rounded-lg text-white placeholder-gray-600 text-sm outline-none resize-none"
                  style={{ background: '#14143a', border: '1px solid #2a2a5a' }} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-500 text-xs uppercase tracking-wider mb-1.5 block">EXP thưởng</label>
                  <input type="number" value={form.expReward} min={10} max={500}
                    onChange={e => setForm({ ...form, expReward: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2.5 rounded-lg text-amber-400 text-sm outline-none font-bold"
                    style={{ background: '#14143a', border: '1px solid #2a2a5a' }} />
                </div>
                <div>
                  <label className="text-gray-500 text-xs uppercase tracking-wider mb-1.5 block">Deadline</label>
                  <input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg text-white text-sm outline-none"
                    style={{ background: '#14143a', border: '1px solid #2a2a5a', colorScheme: 'dark' }} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-500 text-xs uppercase tracking-wider mb-1.5 block">Danh mục</label>
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg text-white text-sm outline-none"
                    style={{ background: '#14143a', border: '1px solid #2a2a5a' }}>
                    {Object.keys(CATEGORY_COLORS).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-gray-500 text-xs uppercase tracking-wider mb-1.5 block">Ưu tiên</label>
                  <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value as TaskPriority })}
                    className="w-full px-3 py-2.5 rounded-lg text-white text-sm outline-none"
                    style={{ background: '#14143a', border: '1px solid #2a2a5a' }}>
                    <option value="low">Thấp</option>
                    <option value="medium">Trung bình</option>
                    <option value="high">Cao</option>
                  </select>
                </div>
              </div>

              {isManager && (
                <>
                  <div>
                    <label className="text-gray-500 text-xs uppercase tracking-wider mb-1.5 block">Giao cho (Phụ trách)</label>
                    <select value={form.assignedTo} onChange={e => setForm({ ...form, assignedTo: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-lg text-white text-sm outline-none"
                      style={{ background: '#14143a', border: '1px solid #2a2a5a' }}>
                      <option value="">Chưa giao</option>
                      {employees.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="text-gray-500 text-xs uppercase tracking-wider mb-1.5 block">Quản lý dự án (PM)</label>
                    <select value={form.projectManager} onChange={e => setForm({ ...form, projectManager: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-lg text-white text-sm outline-none"
                      style={{ background: '#14143a', border: '1px solid #2a2a5a' }}>
                      <option value="">Chọn PM</option>
                      {teamUsers.map(u => <option key={u.id} value={u.id}>{u.name} {u.role === 'manager' ? '(Manager)' : ''}</option>)}
                    </select>
                  </div>

                  <div ref={supportersRef} className="relative">
                    <label className="text-gray-500 text-xs uppercase tracking-wider mb-1.5 block">
                      Người hỗ trợ {form.supporters.length > 0 && <span className="text-violet-400">({form.supporters.length} được chọn)</span>}
                    </label>
                    <button onClick={() => setSupportersOpen(!supportersOpen)}
                      className="w-full px-3 py-2.5 rounded-lg text-sm text-left flex items-center justify-between"
                      style={{ background: '#14143a', border: '1px solid #2a2a5a', color: form.supporters.length > 0 ? '#e2e8f0' : '#6b7280' }}>
                      <span>
                        {form.supporters.length === 0 ? 'Chọn người hỗ trợ...'
                          : form.supporters.map(sid => users.find(u => u.id === sid)?.name.split(' ').slice(-1)[0]).join(', ')}
                      </span>
                      <span className="text-gray-500">{supportersOpen ? '▲' : '▼'}</span>
                    </button>
                    {supportersOpen && (
                      <div className="absolute z-10 top-full left-0 right-0 mt-1 rounded-xl overflow-hidden"
                        style={{ background: '#14143a', border: '1px solid #2a2a5a', boxShadow: '0 8px 24px #00000060' }}>
                        {employees.map(emp => (
                          <label key={emp.id}
                            className="flex items-center gap-2.5 px-3 py-2.5 cursor-pointer transition-colors hover:bg-[#1e1e4a]">
                            <input type="checkbox" checked={form.supporters.includes(emp.id)} onChange={() => toggleSupporter(emp.id)}
                              className="w-4 h-4 rounded accent-violet-500" />
                            <CharAvatar user={emp} size={24} />
                            <span className="text-white text-sm">{emp.name}</span>
                            <LevelBadge exp={emp.exp} />
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}

              <div className="flex gap-3 pt-1">
                <button onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-xl text-gray-400 text-sm"
                  style={{ background: '#14143a', border: '1px solid #2a2a5a' }}>Hủy</button>
                <button onClick={handleCreate} disabled={!form.title.trim()}
                  className="flex-1 py-2.5 rounded-xl font-bold text-white text-sm disabled:opacity-40"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #5b21b6)' }}>Tạo Task</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {submittingTask && (
        <SubmitTaskModal task={submittingTask} onClose={() => setSubmittingTask(null)} />
      )}
    </div>
  )
}

// ==================== LEADERBOARD ====================

function LeaderboardView({ users, tasks }: { users: User[]; tasks: Task[] }) {
  const [tab, setTab] = useState<'individual' | 'team'>('individual')
  const sorted = [...users].sort((a, b) => b.exp - a.exp)
  const teams = TEAMS.map(team => {
    const members = users.filter(u => u.teamId === team.id)
    const totalExp = members.reduce((s, u) => s + u.exp, 0)
    const done = tasks.filter(t => t.status === 'completed' && members.some(u => u.id === t.assignedTo)).length
    return { ...team, totalExp, memberCount: members.length, done, manager: users.find(u => u.teamId === team.id && u.role === 'manager') }
  }).sort((a, b) => b.totalExp - a.totalExp)
  const medals = ['🥇', '🥈', '🥉']

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-white text-3xl font-black mb-1" style={{ fontFamily: 'Rajdhani, sans-serif' }}>🏆 BẢNG XẾP HẠNG</h2>
        <p className="text-gray-500 text-sm">Cạnh tranh lành mạnh — phát triển cùng nhau</p>
      </div>

      <div className="flex p-1 rounded-xl mb-6" style={{ background: '#0e0e24', border: '1px solid #1e1e4a' }}>
        {[['individual', '👤 Cá nhân'], ['team', '👥 Đội nhóm']].map(([id, lbl]) => (
          <button key={id} onClick={() => setTab(id as typeof tab)}
            className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
            style={{ background: tab === id ? '#7c3aed' : 'transparent', color: tab === id ? '#fff' : '#6b7280' }}>
            {lbl}
          </button>
        ))}
      </div>

      {tab === 'individual' ? (
        <div className="space-y-3">
          {sorted.map((user, i) => {
            const done = tasks.filter(t => t.status === 'completed' && t.assignedTo === user.id).length
            return (
              <div key={user.id} className="rounded-xl p-4 flex items-center gap-3 transition-all hover:translate-x-1"
                style={{
                  background: i < 3 ? `linear-gradient(135deg, ${user.avatar.outfitColor}10, #0e0e24)` : '#0e0e24',
                  border: `1px solid ${i < 3 ? user.avatar.outfitColor + '25' : '#1e1e4a'}`,
                }}>
                <div className="w-8 text-center">
                  {i < 3 ? <span className="text-xl">{medals[i]}</span>
                    : <span className="text-gray-600 font-bold text-sm font-mono">#{i + 1}</span>}
                </div>
                <CharAvatar user={user} size={44} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-white font-semibold text-sm">{user.name}</span>
                    <LevelBadge exp={user.exp} />
                    {user.role === 'manager' && <span className="text-[10px] px-1.5 rounded-full" style={{ background: '#1e0a3a', color: '#a78bfa' }}>Manager</span>}
                  </div>
                  
                  <div className="text-gray-500 text-xs mb-1">{TEAMS.find(t => t.id === user.teamId)?.name ?? '—'} · {done} task xong</div>
                  <div className="max-w-[140px]"><ExpBarMini exp={user.exp} /></div>
                </div>
                <div className="text-right">
                  <div className="text-amber-400 text-xl font-black" style={{ fontFamily: 'Rajdhani, sans-serif' }}>{user.exp.toLocaleString()}</div>
                  <div className="text-gray-600 text-xs">EXP</div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="space-y-4">
          {teams.map((team, i) => (
            <div key={team.id} className="rounded-xl p-5"
              style={{ background: '#0e0e24', border: `1px solid ${i === 0 ? '#f59e0b25' : '#1e1e4a'}` }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{i < 3 ? medals[i] : `#${i + 1}`}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{team.emoji}</span>
                      <span className="text-white font-bold text-lg" style={{ fontFamily: 'Rajdhani, sans-serif' }}>Team {team.name}</span>
                    </div>
                    <div className="text-gray-500 text-xs">Manager: {team.manager?.name} · {team.memberCount} thành viên</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-amber-400 text-2xl font-black" style={{ fontFamily: 'Rajdhani, sans-serif' }}>{team.totalExp.toLocaleString()}</div>
                  <div className="text-gray-600 text-xs">tổng EXP</div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3" style={{ borderTop: '1px solid #1e1e3a' }}>
                <div className="text-center">
                  <div className="text-white font-bold" style={{ fontFamily: 'Rajdhani, sans-serif' }}>{team.done}</div>
                  <div className="text-gray-600 text-xs">Task xong</div>
                </div>
                <div className="text-center">
                  <div className="text-white font-bold" style={{ fontFamily: 'Rajdhani, sans-serif' }}>{Math.round(team.totalExp / team.memberCount)}</div>
                  <div className="text-gray-600 text-xs">EXP TB/người</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ==================== REWARDS ====================

function RewardsView({ currentUser, setCurrentUser }: { currentUser: User; setCurrentUser: (u: User) => void }) {
  const [redeemed, setRedeemed] = useState<string[]>([])
  const [notice, setNotice] = useState('')

  const handleRedeem = (r: Reward) => {
    if (currentUser.exp < r.cost || redeemed.includes(r.id)) return
    setCurrentUser({ ...currentUser, exp: currentUser.exp - r.cost })
    setRedeemed(p => [...p, r.id])
    setNotice(`🎉 Đổi thành công: ${r.name}!`)
    setTimeout(() => setNotice(''), 3500)
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-white text-2xl font-bold" style={{ fontFamily: 'Rajdhani, sans-serif' }}>🎁 Cửa Hàng Phần Thưởng</h2>
          <p className="text-gray-500 text-sm">Đổi EXP lấy phần thưởng xứng đáng</p>
        </div>
        <div className="px-5 py-3 rounded-xl text-right" style={{ background: '#1a1200', border: '1px solid #3a2800' }}>
          <div className="text-gray-500 text-xs mb-0.5">EXP hiện có</div>
          <div className="text-amber-400 text-2xl font-black" style={{ fontFamily: 'Rajdhani, sans-serif' }}>{currentUser.exp.toLocaleString()} ⚡</div>
        </div>
      </div>

      {notice && (
        <div className="mb-5 p-3 rounded-xl text-center text-green-400 text-sm font-medium animate-slide-up"
          style={{ background: '#0a2a1a', border: '1px solid #10b98130' }}>{notice}</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {REWARDS.map(r => {
          const can = currentUser.exp >= r.cost
          const done = redeemed.includes(r.id)
          return (
            <div key={r.id} className="rounded-xl p-5 flex flex-col transition-all hover:-translate-y-0.5"
              style={{ background: '#0e0e24', border: `1px solid ${done ? '#10b98130' : can ? '#1e1e4a' : '#141420'}`, opacity: done ? 0.75 : 1 }}>
              <div className="text-4xl text-center mb-3">{r.emoji}</div>
              <div className="flex-1 text-center">
                <h3 className="text-white font-bold mb-1" style={{ fontFamily: 'Rajdhani, sans-serif' }}>{r.name}</h3>
                <p className="text-gray-500 text-xs mb-2">{r.description}</p>
                <span className="text-xs px-2 py-0.5 rounded" style={{ background: '#0e0e28', color: '#4b5563' }}>{r.category}</span>
              </div>
              <div className="mt-4 text-center mb-2">
                <span className="text-xl font-black" style={{ fontFamily: 'Rajdhani, sans-serif', color: can ? '#f59e0b' : '#4b5563' }}>
                  {r.cost.toLocaleString()} EXP
                </span>
              </div>
              <button onClick={() => handleRedeem(r)} disabled={!can || done}
                className="w-full py-2 rounded-lg font-bold text-sm disabled:cursor-not-allowed"
                style={{ background: done ? '#0a2a1a' : can ? 'linear-gradient(135deg,#7c3aed,#f59e0b)' : '#141420', color: done ? '#10b981' : can ? '#fff' : '#3a3a5a' }}>
                {done ? '✓ Đã đổi' : can ? 'Đổi ngay' : 'Chưa đủ EXP'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ==================== SOCIAL ====================

function SocialView({ currentUser, users, messages, setMessages }: {
  currentUser: User; users: User[]; messages: Message[]; setMessages: (m: Message[]) => void
}) {
  // selection: hoặc 1 channel nhóm, hoặc 1 user cụ thể để nhắn riêng (DM)
  const [channel, setChannel] = useState<ChatChannel>('general')
  const [dmUserId, setDmUserId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const endRef = useRef<HTMLDivElement>(null)

  const isDm = channel === 'dm' && dmUserId !== null
  const dmPartner = isDm ? users.find(u => u.id === dmUserId) : undefined

  // const filtered = isDm
  //   ? messages.filter(m => m.channel === 'dm' &&
  //       ((m.userId === currentUser.id && m.toUserId === dmUserId) ||
  //        (m.userId === dmUserId && m.toUserId === currentUser.id)))
  //   : messages.filter(m => m.channel === channel)

  const filtered = isDm
  ? messages.filter(m => m.channel === 'dm' &&
      ((m.userId === currentUser.id && m.toUserId === dmUserId) ||
       (m.userId === dmUserId && m.toUserId === currentUser.id)))
  : channel === 'team'
    ? messages.filter(m => m.channel === 'team' &&
        users.find(u => u.id === m.userId)?.teamId === currentUser.teamId)
    : messages.filter(m => m.channel === channel)

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [filtered.length, channel, dmUserId])

  // const send = () => {
  //   if (!input.trim()) return
  //   setMessages([...messages, {
  //     id: `m_${Date.now()}`, userId: currentUser.id, content: input.trim(),
  //     timestamp: new Date().toISOString(),
  //     channel: isDm ? 'dm' : channel,
  //     ...(isDm ? { toUserId: dmUserId! } : {}),
  //   }])
  //   setInput('')
  // }
  const send = async () => {
  if (!input.trim()) return
  const { error } = await supabase.from('messages').insert({
    user_id: currentUser.id,
    to_user_id: isDm ? dmUserId : null,
    content: input.trim(),
    channel: isDm ? 'dm' : channel,
  })
  if (error) console.error(error)
  setInput('')
}

  const canPost = isDm || channel !== 'announcements' || currentUser.role === 'manager'

  // const CHANNELS: { id: ChatChannel; label: string; desc: string }[] = [
  //   { id: 'general', label: '# chung', desc: 'Tất cả' },
  //   { id: 'team', label: '# team', desc: 'Nội bộ' },
  //   { id: 'announcements', label: '📣 thông báo', desc: 'Manager' },
  // ]

  const myTeam = TEAMS.find(t => t.id === currentUser.teamId)

  const CHANNELS: { id: ChatChannel; label: string; desc: string; icon: string }[] = [
    { id: 'general', label: '# chung', desc: 'Tất cả', icon: '💬' },
    { id: 'team', label: myTeam ? `# ${myTeam.name}` : '# team', desc: myTeam ? `${myTeam.emoji} Nội bộ team` : 'Chưa có team', icon: '👥' },
    { id: 'announcements', label: '📣 thông báo', desc: 'Manager', icon: '📣' },
  ]

  const openChannel = (id: ChatChannel) => {
    setChannel(id)
    setDmUserId(null)
  }

  const openDm = (userId: string) => {
    setChannel('dm')
    setDmUserId(userId)
  }

  const headerLabel = isDm ? `@ ${dmPartner?.name ?? ''}` : CHANNELS.find(c => c.id === channel)?.label
  const headerDesc = isDm ? 'Nhắn tin riêng' : CHANNELS.find(c => c.id === channel)?.desc

  return (
    <div className="flex" style={{ height: 'calc(100vh - 64px)' }}>
    {/* Sidebar */}
    <div className="w-16 md:w-48 flex-shrink-0 p-1.5 md:p-3 flex flex-col overflow-hidden"
      style={{ background: '#060610', borderRight: '1px solid #1a1a3a' }}>
        <p className="text-gray-700 text-[10px] uppercase tracking-widest px-2 mb-2">Kênh</p>
        {CHANNELS.map(ch => (
          <button key={ch.id} onClick={() => openChannel(ch.id)} title={ch.label}
            className="w-full text-left px-2 py-2 rounded-lg mb-0.5 transition-all flex md:block items-center justify-center md:justify-start"
            style={{ background: !isDm && channel === ch.id ? '#1a1a40' : 'transparent', color: !isDm && channel === ch.id ? '#e2e8f0' : '#6b7280' }}>
            <span className="text-lg md:hidden">{ch.icon}</span>
            <div className="text-sm hidden md:block truncate">{ch.label}</div>
            <div className="text-[10px] opacity-50 hidden md:block">{ch.desc}</div>
          </button>
        ))}

        <p className="text-gray-700 text-[10px] uppercase tracking-widest px-2 mt-4 mb-2">Online ({users.length})</p>
        <div className="space-y-1 overflow-y-auto flex-1">
          {users.filter(u => u.id !== currentUser.id).map(u => (
            <button key={u.id} onClick={() => openDm(u.id)}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all"
              style={{ background: isDm && dmUserId === u.id ? '#1a1a40' : 'transparent' }}>
              <div className="relative flex-shrink-0">
                <CharAvatar user={u} size={20} />
                <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-green-400"
                  style={{ border: '1.5px solid #060610' }} />
              </div>
              <span className="text-gray-300 text-[11px] truncate flex-1 text-left">{u.name.split(' ').slice(-1)[0]}</span>
              {u.role === 'manager' && <span className="text-[9px] text-purple-400">QL</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Chat */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-5 py-3 flex items-center gap-2 flex-shrink-0" style={{ borderBottom: '1px solid #1a1a3a' }}>
          {isDm && dmPartner && <CharAvatar user={dmPartner} size={24} />}
          <span className="text-white font-bold" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            {headerLabel}
          </span>
          <span className="text-gray-600 text-xs">— {headerDesc}</span>
          <span className="ml-auto text-gray-600 text-xs">{filtered.length} tin nhắn</span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {filtered.map(msg => {
            const sender = users.find(u => u.id === msg.userId)
            if (!sender) return null
            const isMe = msg.userId === currentUser.id
            return (
              <div key={msg.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                <CharAvatar user={sender} size={36} />
                <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[75%]`}>
                  <div className="flex items-center gap-2 mb-1">
                    {!isMe && (
                      <span className="text-xs font-semibold" style={{ color: sender.avatar.outfitColor }}>
                        {sender.name}
                      </span>
                    )}
                    <span className="text-gray-700 text-[10px]">{fmtTime(msg.timestamp)}</span>
                  </div>
                  <div className="px-4 py-2.5 text-sm leading-relaxed"
                    style={{
                      background: isMe ? 'linear-gradient(135deg,#7c3aed,#5b21b6)' : '#0e0e24',
                      color: isMe ? '#fff' : '#d1d5db',
                      borderRadius: isMe ? '18px 4px 18px 18px' : '4px 18px 18px 18px',
                      border: isMe ? 'none' : '1px solid #1e1e4a',
                    }}>
                    {msg.content}
                  </div>
                </div>
              </div>
            )
          })}
          {filtered.length === 0 && (
            <div className="text-center py-16 text-gray-700">
              <div className="text-3xl mb-2">💬</div>
              <div className="text-sm">
                {isDm ? `Chưa có tin nhắn nào với ${dmPartner?.name}. Hãy bắt đầu!` : 'Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!'}
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        <div className="p-4 flex-shrink-0" style={{ borderTop: '1px solid #1a1a3a' }}>
          {canPost ? (
            <div className="flex gap-3 items-center">
              <CharAvatar user={currentUser} size={36} />
              <input value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
                placeholder={isDm ? `Nhắn riêng cho ${dmPartner?.name}... (Enter để gửi)` : `Nhắn vào ${CHANNELS.find(c => c.id === channel)?.label}... (Enter để gửi)`}
                className="flex-1 min-w-0 px-4 py-2.5 rounded-xl text-white placeholder-gray-600 text-sm outline-none"
                style={{ background: '#0e0e24', border: '1px solid #1e1e4a' }} />
              <button onClick={send} disabled={!input.trim()}
                className="flex-shrink-0 px-4 py-2.5 rounded-xl font-bold text-sm disabled:opacity-40 transition-all hover:scale-105"
                style={{ background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', color: '#fff' }}>
                Gửi
              </button>
            </div>
          ) : (
            <div className="text-center text-gray-600 text-sm py-2">
              📣 Chỉ Manager mới có thể đăng vào kênh thông báo
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ==================== PROFILE ====================

function ProfileView({ currentUser, setCurrentUser, tasks }: {
  currentUser: User; setCurrentUser: (u: User) => void; tasks: Task[]
}) {
  const [editing, setEditing] = useState(false)
  const [draftAvatar, setDraftAvatar] = useState<AvatarConfig>(currentUser.avatar)

  const { progress, needed, level } = getExpProgress(currentUser.exp)
  const myDone = tasks.filter(t => t.status === 'completed' && (t.assignedTo === currentUser.id || (t.selfCreated && t.createdBy === currentUser.id)))
  const selfMade = tasks.filter(t => t.selfCreated && t.createdBy === currentUser.id)

  const achievements = [
    { name: 'Người Mới', desc: 'Task đầu tiên', icon: '🌟', ok: myDone.length >= 1 },
    { name: 'Chăm Chỉ', desc: '5 task xong', icon: '💪', ok: myDone.length >= 5 },
    { name: 'Task Master', desc: '20 task xong', icon: '🏆', ok: myDone.length >= 20 },
    { name: 'EXP Hunter', desc: '1000 EXP', icon: '⚡', ok: currentUser.exp >= 1000 },
    { name: 'Level 5!', desc: 'Đạt Level 5', icon: '🚀', ok: level >= 5 },
    { name: 'Self Starter', desc: 'Tự tạo 3 task', icon: '🎯', ok: selfMade.length >= 3 },
  ]

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Left */}
        <div className="space-y-4">
          <div className="rounded-2xl p-6 text-center"
            style={{ background: `linear-gradient(135deg, ${currentUser.avatar.outfitColor}18, #0e0e24)`, border: `1px solid ${currentUser.avatar.outfitColor}30` }}>
            <div className="w-28 h-36 mx-auto mb-3 rounded-2xl overflow-hidden flex items-end justify-center"
              style={{ background: `${currentUser.avatar.outfitColor}20`, border: `2px solid ${currentUser.avatar.outfitColor}40`, boxShadow: `0 0 30px ${currentUser.avatar.outfitColor}40` }}>
              <FullAvatar avatar={currentUser.avatar} size={100} />
            </div>
            <h3 className="text-white font-bold text-xl mb-0.5" style={{ fontFamily: 'Rajdhani, sans-serif' }}>{currentUser.name}</h3>
            <p className="text-gray-500 text-sm mb-3">{currentUser.department}</p>
            <div className="flex justify-center mb-3"><LevelBadge exp={currentUser.exp} /></div>
            <div className="text-amber-400 text-2xl font-black mb-1" style={{ fontFamily: 'Rajdhani, sans-serif' }}>{currentUser.exp.toLocaleString()} EXP</div>
            <div className="text-gray-600 text-xs mb-3">Cần {needed} EXP → Lv.{level + 1}</div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: '#1a1a3a' }}>
              <div className="h-full rounded-full" style={{ width: `${progress}%`, background: 'linear-gradient(90deg,#7c3aed,#f59e0b)' }} />
            </div>
            <button onClick={() => { setDraftAvatar(currentUser.avatar); setEditing(!editing) }}
              className="mt-4 w-full py-2 rounded-lg text-sm font-medium transition-all"
              style={{ background: editing ? '#7c3aed' : '#14143a', color: editing ? '#fff' : '#6b7280', border: '1px solid #2a2a5a' }}>
              {editing ? '↑ Đóng' : '🎭 Đổi nhân vật'}
            </button>
          </div>

          {/* Stats */}
          <div className="rounded-xl p-4" style={{ background: '#0e0e24', border: '1px solid #1e1e4a' }}>
            <h4 className="text-white font-bold mb-3 text-sm" style={{ fontFamily: 'Rajdhani, sans-serif' }}>📊 Thống kê</h4>
            {[
              ['Task hoàn thành', myDone.length],
              ['Đang làm', tasks.filter(t => t.status === 'in-progress' && t.assignedTo === currentUser.id).length],
              ['Task tự tạo', selfMade.length],
              ['Cấp độ', `Lv.${level}`],
            ].map(([lbl, val]) => (
              <div key={lbl as string} className="flex justify-between items-center py-1.5" style={{ borderBottom: '1px solid #12121f' }}>
                <span className="text-gray-500 text-xs">{lbl}</span>
                <span className="text-white text-sm font-bold" style={{ fontFamily: 'Rajdhani, sans-serif' }}>{val}</span>
              </div>
            ))}
          </div>

          <div className="rounded-xl p-4" style={{ background: '#0e0e24', border: '1px solid #1e1e4a' }}>
            <div className="flex gap-2 flex-wrap">
              <span className="px-3 py-1.5 rounded-lg text-sm font-medium" style={{ background: '#1a0a3a', color: '#a78bfa', border: '1px solid #3a1a6a' }}>
                {currentUser.role === 'manager' ? '👑 Quản Lý' : '⚔️ Nhân Viên'}
              </span>
              <span className="px-3 py-1.5 rounded-lg text-sm font-medium" style={{ background: '#0a1a3a', color: '#60a5fa', border: '1px solid #1a3a6a' }}>
                
                🏢 {TEAMS.find(t => t.id === currentUser.teamId)?.name ?? 'Chưa có team'}       
              </span>
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="col-span-2 space-y-4">
          {editing && (
            <div className="rounded-xl p-4 animate-slide-up" style={{ background: '#0e0e24', border: '1px solid #1e1e4a' }}>
              <h4 className="text-white font-bold mb-4" style={{ fontFamily: 'Rajdhani, sans-serif' }}>🎭 Tùy chỉnh nhân vật</h4>
              <AvatarCreator value={draftAvatar} onChange={setDraftAvatar} />
              <div className="flex gap-3 mt-4">
                <button onClick={() => setEditing(false)}
                  className="flex-1 py-2.5 rounded-lg text-gray-400 text-sm"
                  style={{ background: '#14143a', border: '1px solid #2a2a5a' }}>Hủy</button>
                <button onClick={() => { setCurrentUser({ ...currentUser, avatar: draftAvatar }); setEditing(false) }}
                  className="flex-1 py-2.5 rounded-lg font-bold text-white text-sm"
                  style={{ background: 'linear-gradient(135deg,#7c3aed,#5b21b6)' }}>Lưu thay đổi</button>
              </div>
            </div>
          )}

          <div className="rounded-xl p-4" style={{ background: '#0e0e24', border: '1px solid #1e1e4a' }}>
            <h4 className="text-white font-bold mb-4" style={{ fontFamily: 'Rajdhani, sans-serif' }}>🏅 Thành Tích</h4>
             <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {achievements.map(a => (
                <div key={a.name} className="p-3 rounded-xl text-center"
                  style={{ background: a.ok ? '#181808' : '#12121a', border: `1px solid ${a.ok ? '#f59e0b25' : '#1e1e3a'}`, opacity: a.ok ? 1 : 0.5 }}>
                  <div className="text-2xl mb-2" style={{ filter: a.ok ? 'none' : 'grayscale(1)' }}>{a.icon}</div>
                  <div className="text-white text-xs font-bold mb-0.5">{a.name}</div>
                  <div className="text-gray-600 text-[10px]">{a.desc}</div>
                  {a.ok && <div className="mt-1.5 text-amber-400 text-[10px]">✓ Đạt được</div>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ==================== APP SHELL ====================

const NAV = [
  { id: 'dashboard', icon: '🏠', label: 'Dashboard' },
  { id: 'tasks', icon: '📋', label: 'Task' },
  { id: 'leaderboard', icon: '🏆', label: 'Xếp hạng' },
  { id: 'rewards', icon: '🎁', label: 'Quà' },
  { id: 'social', icon: '💬', label: 'Social' },
  { id: 'profile', icon: '👤', label: 'Hồ sơ' },
]

function AppShell({ currentUser, setCurrentUser, allUsers, tasks, setTasks, messages, setMessages }: {
  currentUser: User; setCurrentUser: (u: User) => void; allUsers: User[]
  tasks: Task[]; setTasks: (t: Task[]) => void
  messages: Message[]; setMessages: (m: Message[]) => void
}) {
  const [view, setView] = useState<View>('dashboard')
  const { level } = getExpProgress(currentUser.exp)

  // Merge current user into users list (keeps their live exp/avatar updated)
  const users = allUsers.some(u => u.id === currentUser.id)
    ? allUsers.map(u => u.id === currentUser.id ? currentUser : u)
    : [...allUsers, currentUser]

  const sharedProps = { currentUser, tasks, users, setTasks, setCurrentUser, setView }

  const renderView = () => {
    switch (view) {
      case 'dashboard': return <DashboardView {...sharedProps} />
      case 'tasks': return <TasksView {...sharedProps} />
      case 'leaderboard': return <LeaderboardView users={users} tasks={tasks} />
      case 'rewards': return <RewardsView currentUser={currentUser} setCurrentUser={setCurrentUser} />
      case 'social': return <SocialView currentUser={currentUser} users={users} messages={messages} setMessages={setMessages} />
      case 'profile': return <ProfileView currentUser={currentUser} setCurrentUser={setCurrentUser} tasks={tasks} />
    }
  }

  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden overflow-x-hidden" style={{ background: '#080812', fontFamily: 'Inter, sans-serif' }}>
      {/* Sidebar */}
      <div className="hidden md:flex w-[72px] flex-col items-center py-4 gap-0.5 flex-shrink-0"
        style={{ background: '#06060f', borderRight: '1px solid #1a1a3a' }}>
        <div className="mb-4">
          <img src={companyLogo} alt="KNI" className="w-10 h-10 rounded-lg object-contain" />
        </div>
        {NAV.map(item => (
          <button key={item.id} onClick={() => setView(item.id as View)} title={item.label}
            className="w-14 h-14 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all duration-150"
            style={{
              background: view === item.id ? '#1a1a40' : 'transparent',
              boxShadow: view === item.id ? 'inset 0 0 15px #7c3aed18, 0 0 0 1px #2a2a6a' : 'none',
            }}>
            <span className="text-xl">{item.icon}</span>
            <span className="text-[8px] tracking-wide" style={{ color: view === item.id ? '#a78bfa' : '#374151' }}>{item.label}</span>
          </button>
        ))}
        <div className="flex-1" />
        <button onClick={() => setView('profile')} className="mb-1">
          <div style={{ width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', border: view === 'profile' ? `2px solid ${currentUser.avatar.outfitColor}` : '2px solid rgba(255,255,255,0.08)', background: `${currentUser.avatar.outfitColor}20` }}>
            <CharacterSVG config={currentUser.avatar} vb="24 4 52 52" w={40} h={40} />
          </div>
        </button>
      </div>

        {/* Bottom nav — chỉ hiện trên mobile */}
      <div className="flex md:hidden items-center justify-around py-2 flex-shrink-0"
        style={{ background: '#06060f', borderTop: '1px solid #1a1a3a' }}>
        {NAV.map(item => (
          <button key={item.id} onClick={() => setView(item.id as View)}
            className="flex flex-col items-center justify-center gap-0.5 px-2 py-1 rounded-lg"
            style={{ color: view === item.id ? '#a78bfa' : '#4b5563' }}>
            <span className="text-lg">{item.icon}</span>
            <span className="text-[9px]">{item.label}</span>
          </button>
        ))}
      </div>
      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden order-first md:order-none">
        {/* Topbar */}
        <div className="h-16 flex items-center justify-between px-5 flex-shrink-0" style={{ borderBottom: '1px solid #1a1a3a' }}>
          <div className="flex items-center gap-2.5">
            <img src={companyLogo} alt="KNI" className="w-8 h-8 rounded-md object-contain md:hidden" />
            <h1 className="text-white font-bold text-lg" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
              {NAV.find(n => n.id === view)?.icon} {NAV.find(n => n.id === view)?.label}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              <span className="text-amber-400 text-xs font-bold" style={{ fontFamily: 'JetBrains Mono, monospace' }}>Lv.{level}</span>
              <div className="w-28"><ExpBarMini exp={currentUser.exp} /></div>
              <span className="text-gray-600 text-xs" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{currentUser.exp}</span>
            </div>
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('profile')}>
              <CharAvatar user={currentUser} size={36} />
              <div>
                <div className="text-white text-sm font-medium leading-tight">{currentUser.name.split(' ').slice(-1)[0]}</div>
                <div className="text-gray-600 text-[10px]">{currentUser.role === 'manager' ? '👑 Quản lý' : '⚔️ Nhân viên'}</div>
              </div>
            </div>
            <button
              onClick={async () => {
                if (!window.confirm('Đăng xuất khỏi tài khoản?')) return
                await supabase.auth.signOut()
              }}
              title="Đăng xuất"
              className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all text-sm">
              🚪
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">{renderView()}</div>
      </div>
    </div>
  )
}

// ==================== APP (shared state at top level) ====================

// export default function App() {
//   const [currentUser, setCurrentUser] = useState<User | null>(null)
//   // Lifted to App level → persists across user logins in same session
//   const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS)
//   const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES)

//   if (!currentUser) return <LoginScreen onLogin={setCurrentUser} />

//   return (
//     <AppShell
//       currentUser={currentUser}
//       setCurrentUser={setCurrentUser}
//       allUsers={MOCK_USERS}
//       tasks={tasks}
//       setTasks={setTasks}
//       messages={messages}
//       setMessages={setMessages}
//     />
//   )
// }

export default function App() {
  const [session, setSession] = useState<any>(null)
  const [currentProfile, setCurrentProfile] = useState<User | null>(null)
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [checkingSession, setCheckingSession] = useState(true)

  function mapProfileToUser(p: any): User {
    return { id: p.id, name: p.name, role: p.role, avatar: p.avatar, exp: p.exp, teamId: p.team_id, department: p.department }
  }

  function mapDbMessage(m: any): Message {
    return { id: m.id, userId: m.user_id, toUserId: m.to_user_id ?? undefined, content: m.content, channel: m.channel, timestamp: m.created_at }
  }
  function mapDbTask(t: any): Task {
  return {
    id: t.id, title: t.title, description: t.description, expReward: t.exp_reward,
    status: t.status, assignedTo: t.assigned_to ?? undefined, projectManager: t.project_manager ?? undefined,
    supporters: t.supporters ?? [], createdBy: t.created_by, dueDate: t.due_date,
    category: t.category, priority: t.priority, selfCreated: t.self_created,
    submissionFileUrl: t.submission_file_url ?? undefined,
    submissionNote: t.submission_note ?? undefined,
    submittedAt: t.submitted_at ?? undefined,
    rejectedReason: t.rejected_reason ?? undefined,
  }
}
  // Kiểm tra xem đã đăng nhập từ trước chưa (giữ session khi refresh trang)
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setCheckingSession(false)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => listener.subscription.unsubscribe()
  }, [])
  //==============================================================================
  // Khi allUsers cập nhật (real-time), đồng bộ luôn currentProfile nếu có thay đổi
useEffect(() => {
  if (!currentProfile) return
  const updated = allUsers.find(u => u.id === currentProfile.id)
  if (updated && JSON.stringify(updated) !== JSON.stringify(currentProfile)) {
    setCurrentProfile(updated)
  }
}, [allUsers])

  // Nạp profile của chính mình khi có session
  useEffect(() => {
    if (!session) { setCurrentProfile(null); return }
    supabase.from('profiles').select('*').eq('id', session.user.id).single()
      .then(({ data }) => { if (data) setCurrentProfile(mapProfileToUser(data)) })
  }, [session])

  // Nạp toàn bộ user + lắng nghe realtime
  useEffect(() => {
    if (!session) return
    supabase.from('profiles').select('*').then(({ data }) => data && setAllUsers(data.map(mapProfileToUser)))
    const channel = supabase.channel('profiles-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        supabase.from('profiles').select('*').then(({ data }) => data && setAllUsers(data.map(mapProfileToUser)))
      }).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [session])


  // 👇 ĐOẠN MỚI THÊM — nạp tin nhắn + lắng nghe realtime
  useEffect(() => {
    if (!session) return
    supabase.from('messages').select('*').order('created_at')
      .then(({ data }) => data && setMessages(data.map(mapDbMessage)))

    const channel = supabase.channel('messages-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
        setMessages(prev => [...prev, mapDbMessage(payload.new)])
      }).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [session])


  useEffect(() => {
  if (!session) return
  supabase.from('tasks').select('*').then(({ data }) => data && setTasks(data.map(mapDbTask)))

  const channel = supabase.channel('tasks-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
      supabase.from('tasks').select('*').then(({ data }) => data && setTasks(data.map(mapDbTask)))
    }).subscribe()
  return () => { supabase.removeChannel(channel) }
}, [session])


  // Khi allUsers cập nhật (real-time), đồng bộ luôn currentProfile nếu có thay đổi
useEffect(() => {
  if (!currentProfile) return
  const updated = allUsers.find(u => u.id === currentProfile.id)
  if (updated && JSON.stringify(updated) !== JSON.stringify(currentProfile)) {
    setCurrentProfile(updated)
  }
}, [allUsers])


  if (checkingSession) return <div style={{ background: '#060610', minHeight: '100vh' }} />
  if (!session || !currentProfile) return <LoginScreen onLoggedIn={() => {}} />

  return (
    <AppShell
      currentUser={currentProfile}
      setCurrentUser={setCurrentProfile}
      allUsers={allUsers}
      tasks={tasks}
      setTasks={setTasks}
      messages={messages}
      setMessages={setMessages}
    />
  )
}