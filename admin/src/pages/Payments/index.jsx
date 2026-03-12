import { useState, useEffect } from 'react'
import $api from '../../api/http.js'
import Pagination from '../../components/Pagination.jsx'
import s from '../../styles/crud.module.css'

const PER_PAGE = 30

const TYPE_LABELS = {
  subscription: 'Абонемент',
  single: 'Разовий вхід',
  card_replace: 'Заміна картки',
}

const METHOD_LABELS = {
  cash: 'Готівка',
  card: 'Картка',
}

function formatMoney(val) {
  return Number(val).toLocaleString('uk-UA') + ' грн'
}

function formatDateTime(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return (
    d.toLocaleDateString('uk-UA') +
    ' ' +
    d.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })
  )
}

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

function EditModal({ payment, onClose, onSaved }) {
  const [amount, setAmount] = useState(String(Number(payment.amount)))
  const [method, setMethod] = useState(payment.method)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSave() {
    if (!amount || Number(amount) <= 0) {
      setError('Введіть суму більше 0')
      return
    }
    setLoading(true)
    try {
      const { data } = await $api.patch(`/payments/${payment.id}`, { amount: Number(amount), method })
      onSaved(data)
      onClose()
    } catch (err) {
      setError(err.response?.data?.error || 'Помилка збереження')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={s.modalOverlay} onClick={e => { e.stopPropagation(); onClose() }}>
      <div className={s.modal} onClick={e => e.stopPropagation()}>
        <div className={s.modalHeader}>
          <h2 className={s.modalTitle}>Редагувати оплату</h2>
          <button className={s.modalClose} onClick={onClose}>✕</button>
        </div>
        <div className={s.modalBody}>
          <div style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 4 }}>
            {payment.label || TYPE_LABELS[payment.type]}
            {payment.client && ` · ${payment.client.last_name} ${payment.client.first_name}`}
          </div>
          <div className={s.field}>
            <label className={s.label}>Сума (грн)</label>
            <input
              className={s.input}
              type="number"
              min="1"
              value={amount}
              onChange={e => { setAmount(e.target.value); setError('') }}
              autoFocus
            />
          </div>
          <div className={s.field}>
            <label className={s.label}>Спосіб оплати</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {['cash', 'card'].map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMethod(m)}
                  style={{
                    flex: 1,
                    padding: '10px 0',
                    borderRadius: 'var(--radius)',
                    border: '1.5px solid',
                    borderColor: method === m ? 'var(--primary)' : 'var(--gray-200)',
                    background: method === m ? 'var(--primary-light)' : '#fff',
                    color: method === m ? 'var(--primary)' : 'var(--gray-600)',
                    fontWeight: 600,
                    fontSize: 14,
                    cursor: 'pointer',
                  }}
                >
                  {METHOD_LABELS[m]}
                </button>
              ))}
            </div>
          </div>
          {error && <span style={{ color: 'var(--danger)', fontSize: 13 }}>{error}</span>}
        </div>
        <div className={s.modalFooter}>
          <button className={s.cancelBtn} onClick={onClose}>Скасувати</button>
          <button className={s.saveBtn} onClick={handleSave} disabled={loading}>
            {loading ? 'Зачекайте...' : 'Зберегти'}
          </button>
        </div>
      </div>
    </div>
  )
}

function CancelModal({ payment, onClose, onCancelled }) {
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleCancel() {
    setLoading(true)
    try {
      const { data } = await $api.patch(`/payments/${payment.id}/cancel`, { note })
      onCancelled(data)
      onClose()
    } catch (err) {
      setError(err.response?.data?.error || 'Помилка скасування')
    } finally {
      setLoading(false)
    }
  }

  const hasSubscription = payment.type === 'subscription' && payment.subscription_id

  return (
    <div className={s.modalOverlay} onClick={e => { e.stopPropagation(); onClose() }}>
      <div className={s.modal} onClick={e => e.stopPropagation()}>
        <div className={s.modalHeader}>
          <h2 className={s.modalTitle}>Скасувати оплату</h2>
          <button className={s.modalClose} onClick={onClose}>✕</button>
        </div>
        <div className={s.modalBody}>
          <div style={{ padding: '12px 16px', background: '#fef3c7', borderRadius: 'var(--radius)', fontSize: 13, color: '#92400e' }}>
            <strong>Платіж буде позначено як «Скасовано»</strong> — він не враховуватиметься у звітності.
            {hasSubscription && (
              <div style={{ marginTop: 6 }}>
                Пов'язаний абонемент повернеться у статус <strong>«Придбано»</strong>.
              </div>
            )}
          </div>
          <div style={{ fontSize: 14, color: 'var(--gray-700)' }}>
            <strong>{payment.label || TYPE_LABELS[payment.type]}</strong>
            {payment.client && ` · ${payment.client.last_name} ${payment.client.first_name}`}
            {' · '}
            <strong style={{ color: 'var(--success)' }}>{formatMoney(payment.amount)}</strong>
          </div>
          <div className={s.field}>
            <label className={s.label}>Причина скасування (необов'язково)</label>
            <input
              className={s.input}
              type="text"
              placeholder="Наприклад: помилка касира"
              value={note}
              onChange={e => setNote(e.target.value)}
              autoFocus
            />
          </div>
          {error && <span style={{ color: 'var(--danger)', fontSize: 13 }}>{error}</span>}
        </div>
        <div className={s.modalFooter}>
          <button className={s.cancelBtn} onClick={onClose}>Ні, залишити</button>
          <button
            onClick={handleCancel}
            disabled={loading}
            style={{
              padding: '10px 20px',
              background: 'var(--danger)',
              color: '#fff',
              border: 'none',
              borderRadius: 'var(--radius)',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Зачекайте...' : 'Скасувати платіж'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Payments() {
  const [payments, setPayments] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [gyms, setGyms] = useState([])
  const [gymFilter, setGymFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [methodFilter, setMethodFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('active')
  const [loading, setLoading] = useState(false)
  const [editPayment, setEditPayment] = useState(null)
  const [cancelTarget, setCancelTarget] = useState(null)

  const today = todayStr()
  const [dateFrom, setDateFrom] = useState(today)
  const [dateTo, setDateTo] = useState(today)

  useEffect(() => {
    $api.get('/gyms').then(r => setGyms(r.data)).catch(() => {})
  }, [])

  useEffect(() => {
    load()
  }, [page, gymFilter, typeFilter, methodFilter, statusFilter, dateFrom, dateTo])

  async function load() {
    setLoading(true)
    try {
      const params = { limit: PER_PAGE, offset: (page - 1) * PER_PAGE }
      if (gymFilter) params.gymId = gymFilter
      if (typeFilter) params.type = typeFilter
      if (methodFilter) params.method = methodFilter
      if (statusFilter) params.status = statusFilter
      if (dateFrom) params.from = dateFrom
      if (dateTo) params.to = dateTo + 'T23:59:59'
      const { data } = await $api.get('/payments', { params })
      setPayments(data.items || [])
      setTotal(data.total || 0)
    } catch {
      setPayments([])
    } finally {
      setLoading(false)
    }
  }

  function handleFilterChange(setter) {
    return (e) => { setter(e.target.value); setPage(1) }
  }

  function handlePaymentUpdated(updated) {
    setPayments(prev => prev.map(p => p.id === updated.id ? { ...p, ...updated } : p))
  }

  const totalPages = Math.ceil(total / PER_PAGE)
  const activeRevenue = payments
    .filter(p => p.status !== 'cancelled')
    .reduce((sum, p) => sum + Number(p.amount), 0)

  return (
    <>
      <div className={s.filtersBar}>
        <select className={s.filterSelect} value={gymFilter} onChange={handleFilterChange(setGymFilter)}>
          <option value="">Усі зали</option>
          {gyms.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>

        <select className={s.filterSelect} value={typeFilter} onChange={handleFilterChange(setTypeFilter)}>
          <option value="">Усі типи</option>
          <option value="subscription">Абонемент</option>
          <option value="single">Разовий вхід</option>
          <option value="card_replace">Заміна картки</option>
        </select>

        <select className={s.filterSelect} value={methodFilter} onChange={handleFilterChange(setMethodFilter)}>
          <option value="">Усі методи</option>
          <option value="cash">Готівка</option>
          <option value="card">Картка</option>
        </select>

        <select className={s.filterSelect} value={statusFilter} onChange={handleFilterChange(setStatusFilter)}>
          <option value="">Усі статуси</option>
          <option value="active">Активні</option>
          <option value="cancelled">Скасовані</option>
        </select>

        <input
          type="date"
          className={s.filterSelect}
          value={dateFrom}
          onChange={handleFilterChange(setDateFrom)}
          title="Від"
        />
        <input
          type="date"
          className={s.filterSelect}
          value={dateTo}
          onChange={handleFilterChange(setDateTo)}
          title="До"
        />

        <span style={{ color: 'var(--gray-500)', fontSize: 13, marginLeft: 'auto' }}>
          Записів: {total}
          {activeRevenue > 0 && (
            <> &nbsp;·&nbsp; Сума: <strong>{formatMoney(activeRevenue)}</strong></>
          )}
        </span>
      </div>

      <div className={s.tableWrap}>
        {loading ? (
          <div className={s.empty}>Завантаження...</div>
        ) : payments.length === 0 ? (
          <div className={s.empty}>
            <span className={s.emptyIcon}>💳</span>
            Оплат не знайдено
          </div>
        ) : (
          <table className={s.table}>
            <thead>
              <tr>
                <th>Дата</th>
                <th>Клієнт</th>
                <th>Призначення</th>
                <th>Тип</th>
                <th>Метод / Статус</th>
                <th>Працівник</th>
                <th style={{ textAlign: 'right' }}>Сума</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {payments.map(p => {
                const isCancelled = p.status === 'cancelled'
                return (
                  <tr key={p.id} style={{ opacity: isCancelled ? 0.5 : 1 }}>
                    <td style={{ fontSize: 13, color: 'var(--gray-500)', whiteSpace: 'nowrap' }}>
                      {formatDateTime(p.date)}
                    </td>
                    <td>
                      {p.client
                        ? `${p.client.last_name} ${p.client.first_name}`
                        : <span style={{ color: 'var(--gray-400)' }}>—</span>}
                    </td>
                    <td style={{ color: 'var(--gray-700)' }}>
                      {p.label || '—'}
                      {isCancelled && p.cancel_note && (
                        <div style={{ fontSize: 11, color: 'var(--gray-400)', fontStyle: 'italic', marginTop: 2 }}>
                          {p.cancel_note}
                        </div>
                      )}
                    </td>
                    <td>
                      <span style={{
                        display: 'inline-block',
                        padding: '3px 10px',
                        borderRadius: 999,
                        fontSize: 12,
                        fontWeight: 600,
                        background: p.type === 'subscription' ? 'var(--primary-light)' : p.type === 'single' ? '#f0fdf4' : '#f3f4f6',
                        color: p.type === 'subscription' ? 'var(--primary)' : p.type === 'single' ? '#166534' : '#374151',
                      }}>
                        {TYPE_LABELS[p.type] || p.type}
                      </span>
                    </td>
                    <td>
                      {isCancelled ? (
                        <span style={{
                          display: 'inline-block',
                          padding: '3px 10px',
                          borderRadius: 999,
                          fontSize: 12,
                          fontWeight: 600,
                          background: '#fee2e2',
                          color: '#991b1b',
                        }}>
                          Скасовано
                        </span>
                      ) : (
                        <span style={{
                          display: 'inline-block',
                          padding: '3px 10px',
                          borderRadius: 999,
                          fontSize: 12,
                          fontWeight: 600,
                          background: p.method === 'cash' ? '#fef3c7' : '#ede9fe',
                          color: p.method === 'cash' ? '#92400e' : '#5b21b6',
                        }}>
                          {METHOD_LABELS[p.method] || p.method}
                        </span>
                      )}
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--gray-600)' }}>
                      {p.worker_name || '—'}
                    </td>
                    <td style={{
                      textAlign: 'right',
                      fontWeight: 700,
                      color: isCancelled ? 'var(--gray-400)' : 'var(--success)',
                      whiteSpace: 'nowrap',
                      textDecoration: isCancelled ? 'line-through' : 'none',
                    }}>
                      {formatMoney(p.amount)}
                    </td>
                    <td>
                      {!isCancelled && (
                        <div className={s.actions}>
                          <button className={s.editBtn} onClick={() => setEditPayment(p)}>
                            Змінити
                          </button>
                          <button className={s.deleteBtn} onClick={() => setCancelTarget(p)}>
                            Скасувати
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      {editPayment && (
        <EditModal
          payment={editPayment}
          onClose={() => setEditPayment(null)}
          onSaved={handlePaymentUpdated}
        />
      )}

      {cancelTarget && (
        <CancelModal
          payment={cancelTarget}
          onClose={() => setCancelTarget(null)}
          onCancelled={handlePaymentUpdated}
        />
      )}
    </>
  )
}
