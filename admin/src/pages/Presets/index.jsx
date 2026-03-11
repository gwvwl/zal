import { useState, useEffect } from 'react'
import $api from '../../api/http.js'
import { useToast } from '../../components/Toast.jsx'
import { useConfirm } from '../../components/ConfirmDialog.jsx'
import s from '../../styles/crud.module.css'

const TYPE_LABELS = { unlimited: 'Безлімітний', visits: 'За відвідуваннями' }
const CATEGORY_LABELS = { gym: 'Спортзал', group: 'Групові' }

export default function Presets() {
  const toast = useToast()
  const confirm = useConfirm()
  const [presets, setPresets] = useState([])
  const [gyms, setGyms] = useState([])
  const [gymFilter, setGymFilter] = useState('')
  const [modal, setModal] = useState(null)

  useEffect(() => {
    $api.get('/gyms').then(r => setGyms(r.data)).catch(() => {})
  }, [])

  async function load() {
    try {
      const params = {}
      if (gymFilter) params.gymId = gymFilter
      const { data } = await $api.get('/presets', { params })
      setPresets(data)
    } catch {
      toast('Не вдалось завантажити пресети')
    }
  }

  useEffect(() => { load() }, [gymFilter])

  async function handleSave(formData) {
    try {
      if (modal.mode === 'create') {
        await $api.post('/presets', formData)
        toast.success('Пресет створено')
      } else {
        await $api.put(`/presets/${modal.data.id}`, formData)
        toast.success('Пресет оновлено')
      }
      setModal(null)
      load()
    } catch (err) {
      toast(err.response?.data?.error || 'Помилка збереження')
    }
  }

  async function handleDelete(preset) {
    const ok = await confirm(`Видалити пресет "${preset.label}"?`)
    if (!ok) return
    try {
      await $api.delete(`/presets/${preset.id}`)
      toast.success('Пресет видалено')
      load()
    } catch (err) {
      toast(err.response?.data?.error || 'Помилка видалення')
    }
  }

  const gymName = (id) => gyms.find(g => g.id === id)?.name || id

  return (
    <>
      <div className={s.header}>
        <div className={s.filtersBar}>
          <select className={s.filterSelect} value={gymFilter} onChange={e => setGymFilter(e.target.value)}>
            <option value="">Усі зали</option>
            {gyms.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>
        <button className={s.addBtn} onClick={() => setModal({ mode: 'create', data: {} })}>
          + Додати пресет
        </button>
      </div>

      <div className={s.tableWrap}>
        {presets.length === 0 ? (
          <div className={s.empty}>
            <span className={s.emptyIcon}>📋</span>
            Пресетів не знайдено
          </div>
        ) : (
          <table className={s.table}>
            <thead>
              <tr>
                <th>Назва</th>
                <th>Тип</th>
                <th>Категорія</th>
                <th>Днів</th>
                <th>Візити</th>
                <th>Ціна</th>
                <th>Зал</th>
                <th>Статус</th>
                <th style={{ width: 140 }}>Дії</th>
              </tr>
            </thead>
            <tbody>
              {presets.map(p => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 600 }}>{p.label}</td>
                  <td>{TYPE_LABELS[p.type] || p.type}</td>
                  <td>
                    <span className={`${s.badge} ${p.category === 'gym' ? s.badgeGym : s.badgeGroup}`}>
                      {CATEGORY_LABELS[p.category] || p.category}
                    </span>
                  </td>
                  <td>{p.duration_days}</td>
                  <td>{p.total_visits || '—'}</td>
                  <td style={{ fontWeight: 600 }}>{p.price} грн</td>
                  <td>{gymName(p.gym_id)}</td>
                  <td>
                    <span className={`${s.badge} ${p.is_active ? s.badgeActive : s.badgeInactive}`}>
                      {p.is_active ? 'Активний' : 'Вимкнено'}
                    </span>
                  </td>
                  <td>
                    <div className={s.actions}>
                      <button className={s.editBtn} onClick={() => setModal({ mode: 'edit', data: p })}>
                        Змінити
                      </button>
                      <button className={s.deleteBtn} onClick={() => handleDelete(p)}>
                        Видалити
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <PresetModal
          mode={modal.mode}
          initial={modal.data}
          gyms={gyms}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </>
  )
}

function PresetModal({ mode, initial, gyms, onSave, onClose }) {
  const [label, setLabel] = useState(initial.label || '')
  const [type, setType] = useState(initial.type || 'unlimited')
  const [category, setCategory] = useState(initial.category || 'gym')
  const [durationDays, setDurationDays] = useState(initial.duration_days || '')
  const [price, setPrice] = useState(initial.price || '')
  const [totalVisits, setTotalVisits] = useState(initial.total_visits || '')
  const [gymId, setGymId] = useState(initial.gym_id || gyms[0]?.id || '')
  const [isActive, setIsActive] = useState(initial.is_active !== false)

  function handleSubmit(e) {
    e.preventDefault()
    const data = {
      label,
      type,
      category,
      duration_days: Number(durationDays),
      price: Number(price),
      is_active: isActive,
    }
    if (mode === 'create') data.gym_id = gymId
    if (type === 'visits') data.total_visits = Number(totalVisits)
    onSave(data)
  }

  return (
    <div className={s.modalOverlay} onClick={onClose}>
      <div className={s.modal} onClick={e => e.stopPropagation()}>
        <div className={s.modalHeader}>
          <h2 className={s.modalTitle}>{mode === 'create' ? 'Новий пресет' : 'Редагувати пресет'}</h2>
          <button className={s.modalClose} onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className={s.modalBody}>
            <div className={s.field}>
              <label className={s.label}>Назва</label>
              <input className={s.input} value={label} onChange={e => setLabel(e.target.value)} required placeholder="Місячний безлім" />
            </div>
            <div className={s.fieldRow}>
              <div className={s.field}>
                <label className={s.label}>Тип</label>
                <select className={s.select} value={type} onChange={e => setType(e.target.value)}>
                  <option value="unlimited">Безлімітний</option>
                  <option value="visits">За відвідуваннями</option>
                </select>
              </div>
              <div className={s.field}>
                <label className={s.label}>Категорія</label>
                <select className={s.select} value={category} onChange={e => setCategory(e.target.value)}>
                  <option value="gym">Спортзал</option>
                  <option value="group">Групові заняття</option>
                </select>
              </div>
            </div>
            <div className={s.fieldRow}>
              <div className={s.field}>
                <label className={s.label}>Тривалість (днів)</label>
                <input className={s.input} type="number" value={durationDays} onChange={e => setDurationDays(e.target.value)} required min="1" />
              </div>
              <div className={s.field}>
                <label className={s.label}>Ціна (грн)</label>
                <input className={s.input} type="number" value={price} onChange={e => setPrice(e.target.value)} required min="1" />
              </div>
            </div>
            {type === 'visits' && (
              <div className={s.field}>
                <label className={s.label}>Кількість відвідувань</label>
                <input className={s.input} type="number" value={totalVisits} onChange={e => setTotalVisits(e.target.value)} required min="1" />
              </div>
            )}
            {mode === 'create' && (
              <div className={s.field}>
                <label className={s.label}>Зал</label>
                <select className={s.select} value={gymId} onChange={e => setGymId(e.target.value)}>
                  {gyms.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
            )}
            {mode === 'edit' && (
              <div className={s.field}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} />
                  <span className={s.label} style={{ margin: 0 }}>Активний</span>
                </label>
              </div>
            )}
          </div>
          <div className={s.modalFooter}>
            <button type="button" className={s.cancelBtn} onClick={onClose}>Скасувати</button>
            <button type="submit" className={s.saveBtn}>Зберегти</button>
          </div>
        </form>
      </div>
    </div>
  )
}
