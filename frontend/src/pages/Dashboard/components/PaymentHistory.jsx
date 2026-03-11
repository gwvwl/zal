import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchPayments } from '../../../store/slices/paymentsSlice.js'
import { photoUrl } from '../../../utils/photoUrl.js'
import Pagination from '../../../components/Pagination.jsx'
import styles from '../../../styles/dashboard.module.css'

const PER_PAGE = 50

function formatDateTime(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric' })
    + ' ' + d.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })
}

export default function PaymentHistory({ onClientSelect }) {
  const dispatch = useDispatch()
  const { items, total, loading } = useSelector(state => state.payments)
  const [page, setPage] = useState(1)

  useEffect(() => {
    dispatch(fetchPayments(page))
  }, [page, dispatch])

  const totalPages = Math.ceil(total / PER_PAGE)

  if (loading) {
    return (
      <div className={styles.ctEmpty}>
        <p>Завантаження...</p>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className={styles.ctEmpty}>
        <span className={styles.ctEmptyIcon}>💳</span>
        <p>Немає записів про оплати</p>
      </div>
    )
  }

  return (
    <div className={styles.ctTableWrap}>
      <table className={styles.ctTable}>
        <thead>
          <tr>
            <th>#</th>
            <th>Клієнт</th>
            <th>Послуга</th>
            <th>Оплата</th>
            <th>Сума</th>
            <th>Дата</th>
            <th>Прийняв</th>
          </tr>
        </thead>
        <tbody>
          {items.map((p, idx) => {
            const client = p.client
            return (
              <tr
                key={p.id}
                className={styles.ctRow}
                onClick={() => client && onClientSelect(client.id)}
              >
                <td className={styles.ctNum}>{(page - 1) * PER_PAGE + idx + 1}</td>
                <td>
                  {client ? (
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
                      </div>
                    </div>
                  ) : (
                    <span className={styles.ctClientPhone}>—</span>
                  )}
                </td>
                <td>
                  <span className={`${styles.ctBadge} ${p.type === 'subscription' ? styles.ctBadgeActive : styles.ctBadgeNone}`}>
                    {p.label}
                  </span>
                </td>
                <td>
                  <span className={`${styles.ctBadge} ${p.method === 'cash' ? styles.ctBadgeCash : styles.ctBadgeCard}`}>
                    {p.method === 'cash' ? '💵 Готівка' : '💳 Картка'}
                  </span>
                </td>
                <td className={styles.ctTime}>{p.amount} грн</td>
                <td className={styles.ctDuration}>{formatDateTime(p.date)}</td>
                <td className={styles.ctDuration}>{p.worker_name}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  )
}
