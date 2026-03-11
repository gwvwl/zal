import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { fetchWorkers, workerLoginThunk, gymLogout } from '../../store/slices/authSlice.js'
import logo from '../../styles/images/logo.PNG'
import styles from '../../styles/selectWorker.module.css'

export default function SelectWorker() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const workers = useSelector(state => state.auth.workers)
  const workersLoading = useSelector(state => state.auth.workersLoading)

  const [selectedId, setSelectedId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    dispatch(fetchWorkers())
  }, [dispatch])

  function handleBack() {
    localStorage.removeItem('access_token')
    dispatch(gymLogout())
    navigate('/')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const result = await dispatch(workerLoginThunk({ worker_id: selectedId, pin: password }))
    if (workerLoginThunk.fulfilled.match(result)) {
      navigate('/dashboard')
    } else {
      setError(result.payload || 'Невірний пароль')
      setPassword('')
    }
    setLoading(false)
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <img src={logo} alt="Зал" className={styles.logoImg} />
          <h1 className={styles.title}>CRM</h1>
          <p className={styles.subtitle}>Оберіть співробітника та введіть пароль</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label}>Співробітник</label>
            <select
              className={styles.select}
              value={selectedId}
              onChange={e => { setSelectedId(e.target.value); setError(''); setPassword('') }}
              disabled={workersLoading}
            >
              <option value="">
                {workersLoading ? 'Завантаження...' : '— Оберіть зі списку —'}
              </option>
              {workers.map(w => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>

          {selectedId && (
            <div className={styles.field}>
              <label className={styles.label}>Пароль</label>
              <div className={styles.passWrap}>
                <input
                  className={styles.input}
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError('') }}
                  placeholder="Введіть пароль"
                  autoFocus
                />
                <button
                  type="button"
                  className={styles.eyeBtn}
                  onClick={() => setShowPass(v => !v)}
                  tabIndex={-1}
                >
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
          )}

          {error && <p className={styles.error}>{error}</p>}

          <button className={styles.btn} type="submit" disabled={!selectedId || loading}>
            {loading ? 'Вхід...' : 'Увійти'}
          </button>
          <button type="button" className={styles.backBtn} onClick={handleBack}>
            ← Змінити зал
          </button>
        </form>
      </div>
    </div>
  )
}
