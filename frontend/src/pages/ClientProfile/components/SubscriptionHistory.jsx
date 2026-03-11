import { useState } from 'react'
import Pagination from '../../../components/Pagination.jsx'
import styles from '../../../styles/clientProfile.module.css'

const PER_PAGE = 15

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('uk-UA')
}

export default function SubscriptionHistory({ subscriptions }) {
  const subs = [...subscriptions].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  const [page, setPage] = useState(1)

  if (subs.length === 0) {
    return <p className={styles.shEmpty}>Немає записів про абонементи</p>
  }

  const CATEGORY_LABELS = { gym: 'Спортзал', group: 'Групові' }

  const statusMap = {
    purchased: { label: 'Куплений', cls: styles.shPurchased },
    active: { label: 'Активний', cls: styles.shActive },
    expired: { label: 'Прострочений', cls: styles.shExpired },
    frozen: { label: 'Заморожений', cls: styles.shFrozen },
  }

  const totalPages = Math.ceil(subs.length / PER_PAGE)
  const pageSubs = subs.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  return (
    <div className={styles.shList}>
      {pageSubs.map(sub => {
        const st = statusMap[sub.status] || statusMap.expired
        return (
          <div key={sub.id} className={styles.shItem}>
            <div className={styles.shLeft}>
              <span className={styles.shLabel}>
                {CATEGORY_LABELS[sub.category] || sub.category}: {sub.label}
              </span>
              <span className={styles.shDates}>
                {sub.start_date ? formatDate(sub.start_date) : 'Не активовано'} — {sub.end_date ? formatDate(sub.end_date) : '—'}
              </span>
              {sub.type === 'visits' && (
                <span className={styles.shVisits}>
                  {sub.used_visits} / {sub.total_visits} відвідувань
                </span>
              )}
            </div>
            <div className={styles.shRight}>
              <span className={`${styles.shBadge} ${st.cls}`}>{st.label}</span>
              <span className={styles.shPrice}>{sub.price} грн</span>
            </div>
          </div>
        )
      })}
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  )
}
