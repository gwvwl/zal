import { useState } from 'react'
import { useSelector } from 'react-redux'
import { selectVisitorsToday } from '../../../store/slices/gymSlice.js'
import { photoUrl } from '../../../utils/photoUrl.js'
import Pagination from '../../../components/Pagination.jsx'
import styles from '../../../styles/dashboard.module.css'

const PER_PAGE = 15

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })
}

function formatDuration(entered_at, exited_at) {
  const end = exited_at ? new Date(exited_at) : new Date()
  const diffMs = end - new Date(entered_at)
  const totalMin = Math.floor(diffMs / 60000)
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  return h > 0 ? `${h}г ${m}хв` : `${m}хв`
}

export default function TodayVisitors({ onClientSelect }) {
  const visits = useSelector(selectVisitorsToday)
  const [page, setPage] = useState(1)

  const rows = visits.filter(v => v.client)

  if (rows.length === 0) {
    return (
      <div className={styles.ctEmpty}>
        <span className={styles.ctEmptyIcon}>📅</span>
        <p>Сьогодні ще ніхто не приходив</p>
      </div>
    )
  }

  const totalPages = Math.ceil(rows.length / PER_PAGE)
  const pageRows = rows.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  return (
    <div className={styles.ctTableWrap}>
      <table className={styles.ctTable}>
        <thead>
          <tr>
            <th>#</th>
            <th>Клієнт</th>
            <th>Вхід</th>
            <th>Вихід</th>
            <th>Час у залі</th>
          </tr>
        </thead>
        <tbody>
          {pageRows.map((visit, idx) => {
            const client = visit.client
            return (
              <tr
                key={visit.id}
                className={styles.ctRow}
                onClick={() => onClientSelect(client.id)}
              >
                <td className={styles.ctNum}>{(page - 1) * PER_PAGE + idx + 1}</td>
                <td>
                  <div className={styles.ctClientCell}>
                    {client.photo ? (
                      <img src={photoUrl(client.photo)} alt="" className={styles.ctAvatarImg} />
                    ) : (
                      <div className={styles.ctAvatar}>
                        {client.first_name?.[0]}{client.last_name?.[0]}
                      </div>
                    )}
                    <div>
                      <div className={styles.ctClientName}>
                        {client.last_name} {client.first_name}
                      </div>
                      <div className={styles.ctClientPhone}>{client.phone}</div>
                    </div>
                  </div>
                </td>
                <td className={styles.ctTime}>{formatTime(visit.entered_at)}</td>
                <td>
                  {visit.exited_at
                    ? <span className={styles.ctTime}>{formatTime(visit.exited_at)}</span>
                    : <span className={`${styles.ctBadge} ${styles.ctBadgeActive}`}>Зараз у залі</span>
                  }
                </td>
                <td className={styles.ctDuration}>{formatDuration(visit.entered_at, visit.exited_at)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  )
}
