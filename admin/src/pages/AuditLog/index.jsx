import { useState, useEffect } from 'react'
import $api from '../../api/http.js'
import { useToast } from '../../components/Toast.jsx'
import Pagination from '../../components/Pagination.jsx'
import s from '../../styles/crud.module.css'

const PER_PAGE = 20

function formatDateTime(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('uk-UA') + ' ' + d.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })
}

const ACTION_COLORS = {
  create: 'var(--success)',
  update: 'var(--primary)',
  delete: 'var(--danger)',
  activate: '#7c3aed',
  freeze: '#0891b2',
  unfreeze: '#d97706',
  enter: 'var(--success)',
  exit: 'var(--gray-500)',
}

export default function AuditLog() {
  const toast = useToast()
  const [logs, setLogs] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [gyms, setGyms] = useState([])
  const [gymFilter, setGymFilter] = useState('')

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

  return (
    <>
      <div className={s.filtersBar}>
        <select className={s.filterSelect} value={gymFilter} onChange={e => { setGymFilter(e.target.value); setPage(1) }}>
          <option value="">Усі зали</option>
          {gyms.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
        <span style={{ color: 'var(--gray-500)', fontSize: 13 }}>
          Записів: {total}
        </span>
      </div>

      <div className={s.tableWrap}>
        {logs.length === 0 ? (
          <div className={s.empty}>
            <span className={s.emptyIcon}>📝</span>
            Записів не знайдено
          </div>
        ) : (
          <table className={s.table}>
            <thead>
              <tr>
                <th>Час</th>
                <th>Дія</th>
                <th>Сутність</th>
                <th>Працівник</th>
                <th>Зал</th>
                <th>Деталі</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id}>
                  <td style={{ fontSize: 13, color: 'var(--gray-500)', whiteSpace: 'nowrap' }}>
                    {formatDateTime(log.created_at)}
                  </td>
                  <td>
                    <span style={{
                      display: 'inline-block',
                      padding: '3px 10px',
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 600,
                      color: ACTION_COLORS[log.action] || 'var(--gray-600)',
                      background: `color-mix(in srgb, ${ACTION_COLORS[log.action] || 'var(--gray-600)'} 12%, transparent)`,
                    }}>
                      {log.action}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 600 }}>{log.entity}</span>
                    {log.entity_id && (
                      <span style={{ fontSize: 11, color: 'var(--gray-400)', marginLeft: 6 }}>
                        {log.entity_id.slice(0, 8)}...
                      </span>
                    )}
                  </td>
                  <td>{log.worker_name || '—'}</td>
                  <td>{gymName(log.gym_id)}</td>
                  <td style={{ fontSize: 12, color: 'var(--gray-500)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {log.details || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </>
  )
}
