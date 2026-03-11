import { useState, useEffect } from 'react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import $api from '../../api/http.js'
import styles from '../../styles/dashboard.module.css'

const COLORS = ['#2563eb', '#16a34a', '#d97706', '#dc2626', '#7c3aed', '#0891b2']

function formatMoney(val) {
  return Number(val).toLocaleString('uk-UA') + ' грн'
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [gymId, setGymId] = useState('')
  const [gyms, setGyms] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    $api.get('/gyms').then(r => setGyms(r.data)).catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    const params = {}
    if (gymId) params.gymId = gymId
    $api.get('/stats', { params })
      .then(r => setStats(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [gymId])

  if (loading || !stats) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--gray-400)' }}>Завантаження...</div>
  }

  const revenueData = (stats.revenueByDay || []).map(d => ({
    day: d.day?.slice(5),
    total: Number(d.total),
  }))

  const visitsData = (stats.visitsByDay || []).map(d => ({
    day: d.day?.slice(5),
    count: Number(d.count),
  }))

  const pieData = (stats.revenueByMethod || []).map(d => ({
    name: d.method === 'cash' ? 'Готівка' : 'Картка',
    value: Number(d.total),
  }))

  return (
    <>
      <div className={styles.filters}>
        <select className={styles.filterSelect} value={gymId} onChange={e => setGymId(e.target.value)}>
          <option value="">Усі зали</option>
          {gyms.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Клієнти</div>
          <div className={styles.statValue}>{stats.totalClients}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Активні абонементи</div>
          <div className={styles.statValue}>{stats.activeSubscriptions}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Дохід</div>
          <div className={styles.statValue}>
            {formatMoney(stats.totalRevenue)}
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Відвідувань</div>
          <div className={styles.statValue}>{stats.totalVisits}</div>
        </div>
      </div>

      <div className={styles.chartsGrid}>
        <div className={styles.chartCard}>
          <div className={styles.chartTitle}>Дохід за день</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={v => formatMoney(v)} />
              <Bar dataKey="total" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className={styles.chartCard}>
          <div className={styles.chartTitle}>Відвідуваність</div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={visitsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#16a34a" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className={styles.chartsGrid}>
        <div className={styles.chartCard}>
          <div className={styles.chartTitle}>Метод оплати</div>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={v => formatMoney(v)} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className={styles.chartCard}>
          <div className={styles.chartTitle}>Популярні абонементи</div>
          <div style={{ maxHeight: 260, overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--gray-200)' }}>
                  <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 12, color: 'var(--gray-500)', fontWeight: 600 }}>Назва</th>
                  <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 12, color: 'var(--gray-500)', fontWeight: 600 }}>Тип</th>
                  <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: 12, color: 'var(--gray-500)', fontWeight: 600 }}>К-сть</th>
                </tr>
              </thead>
              <tbody>
                {(stats.popularSubs || []).map((s, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 600 }}>{s.label}</td>
                    <td style={{ padding: '10px 12px', fontSize: 12, color: 'var(--gray-500)' }}>{s.category === 'gym' ? 'Спортзал' : 'Групові'}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700 }}>{s.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}
