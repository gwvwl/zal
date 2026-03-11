import { useState } from 'react'
import { useSelector } from 'react-redux'
import { selectInGym } from '../../../store/slices/gymSlice.js'
import { photoUrl } from '../../../utils/photoUrl.js'
import Pagination from '../../../components/Pagination.jsx'
import styles from '../../../styles/dashboard.module.css'

const PER_PAGE = 15

function formatTime(isoString) {
  const d = new Date(isoString)
  return d.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })
}

function formatDuration(isoString) {
  const diff = Date.now() - new Date(isoString).getTime()
  const totalMin = Math.floor(diff / 60000)
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  if (h > 0) return `${h}г ${m}хв`
  return `${m}хв`
}

export default function ClientsTable({ onClientSelect }) {
  const inGym = useSelector(selectInGym)
  const [page, setPage] = useState(1)

  const rows = inGym.filter(v => v.client)

  if (rows.length === 0) {
    return (
      <div className={styles.ctEmpty}>
        <span className={styles.ctEmptyIcon}>🏃</span>
        <p>Зараз у залі нікого немає</p>
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
            <th>Абонемент</th>
            <th>Час входу</th>
            <th>У залі</th>
          </tr>
        </thead>
        <tbody>
          {pageRows.map((visit, idx) => {
            const client = visit.client
            const sub = visit.subscription
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
                <td>
                  {sub ? (
                    <span className={`${styles.ctBadge} ${sub.status === 'frozen' ? styles.ctBadgeFrozen : styles.ctBadgeActive}`}>
                      {sub.status === 'frozen' ? '❄️ Заморожений' : sub.label}
                    </span>
                  ) : (
                    <span className={`${styles.ctBadge} ${styles.ctBadgeNone}`}>
                      Немає
                    </span>
                  )}
                </td>
                <td className={styles.ctTime}>{formatTime(visit.entered_at)}</td>
                <td className={styles.ctDuration}>{formatDuration(visit.entered_at)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  )
}
