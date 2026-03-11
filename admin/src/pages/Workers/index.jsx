import { useState, useEffect } from 'react'
import $api from '../../api/http.js'
import { useToast } from '../../components/Toast.jsx'
import { useConfirm } from '../../components/ConfirmDialog.jsx'
import s from '../../styles/crud.module.css'

const ROLE_LABELS = { admin: 'Адмін', reception: 'Рецепція', trainer: 'Тренер' }

export default function Workers() {
  const toast = useToast()
  const confirm = useConfirm()
  const [workers, setWorkers] = useState([])
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
      const { data } = await $api.get('/workers', { params })
      setWorkers(data)
    } catch {
      toast('Не вдалось завантажити працівників')
    }
  }

  useEffect(() => { load() }, [gymFilter])

  async function handleSave(formData) {
    try {
      if (modal.mode === 'create') {
        await $api.post('/workers', formData)
        toast.success('Працівника створено')
      } else {
        await $api.put(`/workers/${modal.data.id}`, formData)
        toast.success('Працівника оновлено')
      }
      setModal(null)
      load()
    } catch (err) {
      toast(err.response?.data?.error || 'Помилка збереження')
    }
  }

  async function handleDelete(worker) {
    const ok = await confirm(`Видалити працівника "${worker.name}"?`)
    if (!ok) return
    try {
      await $api.delete(`/workers/${worker.id}`)
      toast.success('Працівника видалено')
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
          + Додати працівника
        </button>
      </div>

      <div className={s.tableWrap}>
        {workers.length === 0 ? (
          <div className={s.empty}>
            <span className={s.emptyIcon}>👥</span>
            Працівників не знайдено
          </div>
        ) : (
          <table className={s.table}>
            <thead>
              <tr>
                <th>Ім'я</th>
                <th>Роль</th>
                <th>Зал</th>
                <th style={{ width: 140 }}>Дії</th>
              </tr>
            </thead>
            <tbody>
              {workers.map(w => (
                <tr key={w.id}>
                  <td style={{ fontWeight: 600 }}>{w.name}</td>
                  <td>
                    <span className={`${s.badge} ${w.role === 'admin' ? s.badgeActive : s.badgeInactive}`}>
                      {ROLE_LABELS[w.role] || w.role}
                    </span>
                  </td>
                  <td>{gymName(w.gym_id)}</td>
                  <td>
                    <div className={s.actions}>
                      <button className={s.editBtn} onClick={() => setModal({ mode: 'edit', data: w })}>
                        Змінити
                      </button>
                      <button className={s.deleteBtn} onClick={() => handleDelete(w)}>
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
        <WorkerModal
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

function WorkerModal({ mode, initial, gyms, onSave, onClose }) {
  const [name, setName] = useState(initial.name || '')
  const [role, setRole] = useState(initial.role || 'reception')
  const [gymId, setGymId] = useState(initial.gym_id || gyms[0]?.id || '')
  const [pin, setPin] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    const data = { name, role }
    if (mode === 'create') data.gym_id = gymId
    if (pin) data.pin = pin
    onSave(data)
  }

  return (
    <div className={s.modalOverlay} onClick={onClose}>
      <div className={s.modal} onClick={e => e.stopPropagation()}>
        <div className={s.modalHeader}>
          <h2 className={s.modalTitle}>{mode === 'create' ? 'Новий працівник' : 'Редагувати працівника'}</h2>
          <button className={s.modalClose} onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className={s.modalBody}>
            <div className={s.field}>
              <label className={s.label}>Ім'я</label>
              <input className={s.input} value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div className={s.fieldRow}>
              <div className={s.field}>
                <label className={s.label}>Роль</label>
                <select className={s.select} value={role} onChange={e => setRole(e.target.value)}>
                  <option value="reception">Рецепція</option>
                  <option value="trainer">Тренер</option>
                  <option value="admin">Адмін</option>
                </select>
              </div>
              {mode === 'create' && (
                <div className={s.field}>
                  <label className={s.label}>Зал</label>
                  <select className={s.select} value={gymId} onChange={e => setGymId(e.target.value)}>
                    {gyms.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                </div>
              )}
            </div>
            <div className={s.field}>
              <label className={s.label}>{mode === 'create' ? 'PIN' : 'Новий PIN (залишити порожнім)'}</label>
              <input className={s.input} type="password" value={pin} onChange={e => setPin(e.target.value)} required={mode === 'create'} />
            </div>
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
