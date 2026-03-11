import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchClientVisits } from '../../../store/slices/gymSlice.js'
import Pagination from '../../../components/Pagination.jsx'
import styles from '../../../styles/clientProfile.module.css'

const PER_PAGE = 15

function formatDateTime(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
    ' о ' + d.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })
}

function formatDuration(entered_at, exited_at) {
  if (!exited_at) return null
  const diffMs = new Date(exited_at) - new Date(entered_at)
  const totalMin = Math.floor(diffMs / 60000)
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  return h > 0 ? `${h}г ${m}хв` : `${m}хв`
}

export default function VisitHistory({ clientId }) {
  const dispatch = useDispatch()
  const visits = useSelector(state => state.gym.clientVisits)
  const loading = useSelector(state => state.gym.clientVisitsLoading)
  const [page, setPage] = useState(1)

  useEffect(() => {
    dispatch(fetchClientVisits(clientId))
  }, [clientId, dispatch])

  if (loading) return <p className={styles.vhEmpty}>Завантаження...</p>

  if (visits.length === 0) {
    return <p className={styles.vhEmpty}>Немає записів відвідувань</p>
  }

  const totalPages = Math.ceil(visits.length / PER_PAGE)
  const pageVisits = visits.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  return (
    <div className={styles.vhList}>
      {pageVisits.map(visit => {
        const duration = formatDuration(visit.entered_at, visit.exited_at)
        const isNow = !visit.exited_at

        return (
          <div key={visit.id} className={`${styles.vhItem} ${isNow ? styles.vhItemNow : ''}`}>
            <div className={styles.vhDot} />
            <div className={styles.vhContent}>
              <div className={styles.vhRow}>
                <span className={styles.vhDate}>{formatDateTime(visit.entered_at)}</span>
                {isNow && <span className={styles.vhNowBadge}>Зараз у залі</span>}
              </div>
              {visit.exited_at && (
                <div className={styles.vhMeta}>
                  <span>Вихід: {formatDateTime(visit.exited_at)}</span>
                  {duration && <span className={styles.vhDuration}>· {duration}</span>}
                </div>
              )}
            </div>
          </div>
        )
      })}
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  )
}
