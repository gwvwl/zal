import { useState, useEffect } from 'react'
import $api from '../../../api/http.js'
import { photoUrl } from '../../../utils/photoUrl.js'
import styles from '../../../styles/dashboard.module.css'

const CATEGORY_LABELS = {
  group:      'Групові заняття',
  mma:        'ММА',
  sambo:      'Самбо',
  grappling:  'Грепплінг',
  stretching: 'Стретчинг',
  boxing:     'Бокс',
  karate:     'Карате',
}

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

export default function GroupReportModal({ onClose, onClientSelect }) {
  const [date, setDate] = useState(todayStr())
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    setData([])
    $api.get('/visits/group-report', { params: { date } })
      .then(r => setData(r.data))
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }, [date])

  function handleSelect(id) {
    onClose()
    onClientSelect(id)
  }

  const formatDate = (d) =>
    new Date(d + 'T00:00:00').toLocaleDateString('uk-UA', { day: '2-digit', month: 'long', year: 'numeric' })

  return (
    <div className={styles.smOverlay} onClick={onClose}>
      <div className={`${styles.smModal} ${styles.grModal}`} onClick={e => e.stopPropagation()}>
        <div className={styles.smHeader}>
          <h2 className={styles.smTitle}>👥 Групові заняття</h2>
          <button className={styles.smCloseBtn} onClick={onClose}>✕</button>
        </div>

        <div className={styles.grDateRow}>
          <label className={styles.grDateLabel}>Дата</label>
          <input
            type="date"
            className={styles.grDateInput}
            value={date}
            max={todayStr()}
            onChange={e => setDate(e.target.value)}
          />
        </div>

        {loading ? (
          <p className={styles.smHint}>Завантаження...</p>
        ) : data.length === 0 ? (
          <p className={styles.smHint}>Групових занять {formatDate(date)} не знайдено</p>
        ) : (
          <div className={styles.grList}>
            {data.map(group => (
              <div key={group.category} className={styles.grGroup}>
                <div className={styles.grGroupHeader}>
                  <span className={styles.grGroupName}>{CATEGORY_LABELS[group.category] || group.category}</span>
                  <span className={styles.grGroupCount}>{group.clients.length} чол.</span>
                </div>
                <div className={styles.grClients}>
                  {group.clients.map(client => (
                    <button
                      key={client.id}
                      className={styles.grClientRow}
                      onClick={() => handleSelect(client.id)}
                    >
                      <div className={styles.grAvatar}>
                        {client.photo
                          ? <img src={photoUrl(client.photo)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                          : `${client.first_name?.[0] ?? ''}${client.last_name?.[0] ?? ''}`
                        }
                      </div>
                      <span className={styles.grClientName}>
                        {client.last_name} {client.first_name}
                      </span>
                      <span className={styles.smArrow}>→</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
