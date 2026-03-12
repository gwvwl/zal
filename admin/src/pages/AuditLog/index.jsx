import { useState, useEffect } from 'react'
import $api from '../../api/http.js'
import { useToast } from '../../components/Toast.jsx'
import Pagination from '../../components/Pagination.jsx'
import s from '../../styles/crud.module.css'

const PER_PAGE = 20

function formatDateTime(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return (
    d.toLocaleDateString('uk-UA') +
    ' ' +
    d.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })
  )
}

const ACTION_META = {
  create:   { label: 'Створено',    icon: '➕', bg: '#dcfce7', color: '#166534' },
  update:   { label: 'Змінено',     icon: '✏️',  bg: '#dbeafe', color: '#1e40af' },
  delete:   { label: 'Видалено',    icon: '🗑',  bg: '#fee2e2', color: '#991b1b' },
  activate: { label: 'Активовано',  icon: '▶️',  bg: '#ede9fe', color: '#5b21b6' },
  freeze:   { label: 'Заморожено',  icon: '❄️',  bg: '#e0f2fe', color: '#075985' },
  unfreeze: { label: 'Розморожено', icon: '🔆',  bg: '#fef3c7', color: '#92400e' },
  enter:    { label: 'Прохід',      icon: '🚪',  bg: '#dcfce7', color: '#166534' },
  exit:     { label: 'Вихід',       icon: '🚶',  bg: '#f3f4f6', color: '#374151' },
  cancel:   { label: 'Скасовано',   icon: '✖️',  bg: '#fee2e2', color: '#991b1b' },
}

const ENTITY_LABELS = {
  gym:          'Зал',
  worker:       'Працівник',
  preset:       'Пресет абонементу',
  payment:      'Оплата',
  subscription: 'Абонемент',
  client:       'Клієнт',
  visit:        'Відвідування',
}

const TYPE_LABELS   = { subscription: 'Абонемент', single: 'Разовий вхід', card_replace: 'Заміна картки' }
const METHOD_LABELS = { cash: 'Готівка', card: 'Картка' }
const ROLE_LABELS   = { admin: 'Адміністратор', trainer: 'Тренер', cashier: 'Касир' }

function parseDetails(raw) {
  if (!raw) return null
  try { return typeof raw === 'string' ? JSON.parse(raw) : raw } catch { return { _raw: raw } }
}

function formatMoney(val) {
  return Number(val).toLocaleString('uk-UA') + ' грн'
}

function friendlyDetails(entity, details) {
  const d = parseDetails(details)
  if (!d) return null
  if (d._raw) return d._raw

  const parts = []

  if (entity === 'gym') {
    if (d.name)  parts.push(`«${d.name}»`)
    if (d.login) parts.push(`Логін: ${d.login}`)
  } else if (entity === 'worker') {
    if (d.name) parts.push(d.name)
    if (d.role) parts.push(ROLE_LABELS[d.role] || d.role)
  } else if (entity === 'preset') {
    if (d.label) parts.push(`«${d.label}»`)
  } else if (entity === 'payment') {
    if (d.amount != null) parts.push(formatMoney(d.amount))
    if (d.type)   parts.push(TYPE_LABELS[d.type] || d.type)
    if (d.method) parts.push(METHOD_LABELS[d.method] || d.method)
  } else if (entity === 'subscription') {
    if (d.label)  parts.push(`«${d.label}»`)
    if (d.status) parts.push(d.status)
  } else if (entity === 'client') {
    if (d.first_name || d.last_name) parts.push(`${d.last_name || ''} ${d.first_name || ''}`.trim())
    if (d.phone) parts.push(d.phone)
  }

  return parts.length ? parts.join(' · ') : null
}

export default function AuditLog() {
  const toast = useToast()
  const [logs, setLogs] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [gyms, setGyms] = useState([])
  const [gymFilter, setGymFilter] = useState('')
  const [actionFilter, setActionFilter] = useState('')

  useEffect(() => {
    $api.get('/gyms').then(r => setGyms(r.data)).catch(() => {})
  }, [])

  async function load() {
    try {
      const params = { limit: PER_PAGE, offset: (page - 1) * PER_PAGE }
      if (gymFilter) params.gymId = gymFilter
      const { data } = await $api.get('/audit', { params })
      setLogs(data.logs)
      setTotal(data.total)
    } catch {
      toast('Не вдалось завантажити логи')
    }
  }

  useEffect(() => { load() }, [page, gymFilter])

  const totalPages = Math.ceil(total / PER_PAGE)
  const gymName = (id) => gyms.find(g => g.id === id)?.name || id

  const visibleLogs = actionFilter
    ? logs.filter(l => l.action === actionFilter)
    : logs

  return (
    <>
      <div className={s.filtersBar}>
        <select
          className={s.filterSelect}
          value={gymFilter}
          onChange={e => { setGymFilter(e.target.value); setPage(1) }}
        >
          <option value="">Усі зали</option>
          {gyms.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>

        <select
          className={s.filterSelect}
          value={actionFilter}
          onChange={e => setActionFilter(e.target.value)}
        >
          <option value="">Усі дії</option>
          {Object.entries(ACTION_META).map(([key, { label, icon }]) => (
            <option key={key} value={key}>{icon} {label}</option>
          ))}
        </select>

        <span style={{ color: 'var(--gray-500)', fontSize: 13, marginLeft: 'auto' }}>
          Записів: {total}
        </span>
      </div>

      <div className={s.tableWrap}>
        {visibleLogs.length === 0 ? (
          <div className={s.empty}>
            <span className={s.emptyIcon}>📝</span>
            Записів не знайдено
          </div>
        ) : (
          <table className={s.table}>
            <thead>
              <tr>
                <th>Час</th>
                <th>Подія</th>
                <th>Деталі</th>
                <th>Ким</th>
                <th>Зал</th>
              </tr>
            </thead>
            <tbody>
              {visibleLogs.map(log => {
                const meta = ACTION_META[log.action] || { label: log.action, icon: '•', bg: '#f3f4f6', color: '#374151' }
                const entityLabel = ENTITY_LABELS[log.entity] || log.entity
                const details = friendlyDetails(log.entity, log.details)
                const isAdmin = log.worker_name?.startsWith('[admin]')

                return (
                  <tr key={log.id}>
                    <td style={{ fontSize: 13, color: 'var(--gray-500)', whiteSpace: 'nowrap' }}>
                      {formatDateTime(log.created_at)}
                    </td>

                    <td style={{ whiteSpace: 'nowrap' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        padding: '3px 10px',
                        borderRadius: 999,
                        fontSize: 12,
                        fontWeight: 600,
                        background: meta.bg,
                        color: meta.color,
                      }}>
                        <span>{meta.icon}</span>
                        {meta.label}
                      </span>
                      <span style={{ marginLeft: 8, fontSize: 13, color: 'var(--gray-600)' }}>
                        {entityLabel}
                      </span>
                    </td>

                    <td style={{ fontSize: 13, color: 'var(--gray-700)', maxWidth: 260 }}>
                      {details || <span style={{ color: 'var(--gray-400)' }}>—</span>}
                    </td>

                    <td style={{ fontSize: 13, whiteSpace: 'nowrap' }}>
                      {isAdmin ? (
                        <span style={{ color: 'var(--primary)', fontWeight: 600 }}>
                          {log.worker_name.replace('[admin] ', '')}
                          <span style={{ fontSize: 11, opacity: 0.7, marginLeft: 4 }}>(адмін)</span>
                        </span>
                      ) : (
                        log.worker_name || <span style={{ color: 'var(--gray-400)' }}>—</span>
                      )}
                    </td>

                    <td style={{ fontSize: 13, color: 'var(--gray-600)' }}>
                      {gymName(log.gym_id)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </>
  )
}
