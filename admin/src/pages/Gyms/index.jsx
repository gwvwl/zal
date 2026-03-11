import { useState, useEffect } from 'react'
import $api from '../../api/http.js'
import { useToast } from '../../components/Toast.jsx'
import { useConfirm } from '../../components/ConfirmDialog.jsx'
import s from '../../styles/crud.module.css'

export default function Gyms() {
  const toast = useToast()
  const confirm = useConfirm()
  const [gyms, setGyms] = useState([])
  const [modal, setModal] = useState(null) // null | { mode: 'create' | 'edit', data }

  async function load() {
    try {
      const { data } = await $api.get('/gyms')
      setGyms(data)
    } catch {
      toast('Не вдалось завантажити зали')
    }
  }

  useEffect(() => { load() }, [])

  async function handleSave(formData) {
    try {
      if (modal.mode === 'create') {
        await $api.post('/gyms', formData)
        toast.success('Зал створено')
      } else {
        await $api.put(`/gyms/${modal.data.id}`, formData)
        toast.success('Зал оновлено')
      }
      setModal(null)
      load()
    } catch (err) {
      toast(err.response?.data?.error || 'Помилка збереження')
    }
  }

  async function handleDelete(gym) {
    const ok = await confirm(`Видалити зал "${gym.name}"? Це також видалить усіх працівників, клієнтів та дані цього залу.`)
    if (!ok) return
    try {
      await $api.delete(`/gyms/${gym.id}`)
      toast.success('Зал видалено')
      load()
    } catch (err) {
      toast(err.response?.data?.error || 'Помилка видалення')
    }
  }

  return (
    <>
      <div className={s.header}>
        <div />
        <button className={s.addBtn} onClick={() => setModal({ mode: 'create', data: {} })}>
          + Додати зал
        </button>
      </div>

      <div className={s.tableWrap}>
        {gyms.length === 0 ? (
          <div className={s.empty}>
            <span className={s.emptyIcon}>🏋️</span>
            Залів ще немає
          </div>
        ) : (
          <table className={s.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Назва</th>
                <th>Логін</th>
                <th style={{ width: 140 }}>Дії</th>
              </tr>
            </thead>
            <tbody>
              {gyms.map(gym => (
                <tr key={gym.id}>
                  <td style={{ color: 'var(--gray-400)', fontSize: 13 }}>{gym.id}</td>
                  <td style={{ fontWeight: 600 }}>{gym.name}</td>
                  <td>{gym.login}</td>
                  <td>
                    <div className={s.actions}>
                      <button className={s.editBtn} onClick={() => setModal({ mode: 'edit', data: gym })}>
                        Змінити
                      </button>
                      <button className={s.deleteBtn} onClick={() => handleDelete(gym)}>
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
        <GymModal
          mode={modal.mode}
          initial={modal.data}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </>
  )
}

function GymModal({ mode, initial, onSave, onClose }) {
  const [id, setId] = useState(initial.id || '')
  const [name, setName] = useState(initial.name || '')
  const [login, setLogin] = useState(initial.login || '')
  const [password, setPassword] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    const data = { name, login }
    if (mode === 'create') data.id = id
    if (password) data.password = password
    onSave(data)
  }

  return (
    <div className={s.modalOverlay} onClick={onClose}>
      <div className={s.modal} onClick={e => e.stopPropagation()}>
        <div className={s.modalHeader}>
          <h2 className={s.modalTitle}>{mode === 'create' ? 'Новий зал' : 'Редагувати зал'}</h2>
          <button className={s.modalClose} onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className={s.modalBody}>
            {mode === 'create' && (
              <div className={s.field}>
                <label className={s.label}>ID</label>
                <input className={s.input} value={id} onChange={e => setId(e.target.value)} required />
              </div>
            )}
            <div className={s.field}>
              <label className={s.label}>Назва</label>
              <input className={s.input} value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div className={s.field}>
              <label className={s.label}>Логін</label>
              <input className={s.input} value={login} onChange={e => setLogin(e.target.value)} required />
            </div>
            <div className={s.field}>
              <label className={s.label}>{mode === 'create' ? 'Пароль' : 'Новий пароль (залишити порожнім)'}</label>
              <input className={s.input} type="password" value={password} onChange={e => setPassword(e.target.value)} required={mode === 'create'} />
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
