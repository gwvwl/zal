import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchGyms, gymLoginThunk } from "../../store/slices/authSlice.js";
import logo from "../../styles/images/logo.PNG";
import styles from "../../styles/selectGym.module.css";

export default function SelectGym() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const gyms = useSelector((state) => state.auth.gyms);

  const [selectedGymId, setSelectedGymId] = useState(null);
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    dispatch(fetchGyms());
  }, [dispatch]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await dispatch(
      gymLoginThunk({ gym_id: selectedGymId, password }),
    );
    if (gymLoginThunk.fulfilled.match(result)) {
      navigate("/select-worker");
    } else {
      setError(result.payload || "Невірний пароль");
      setPassword("");
    }
    setLoading(false);
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <img src={logo} alt="Зал" className={styles.logoImg} />
          <h1 className={styles.title}>CRM</h1>
          <p className={styles.subtitle}>Оберіть зал та введіть пароль</p>
        </div>

        <div className={styles.gymGrid}>
          {gyms?.map((gym) => (
            <button
              key={gym.id}
              type="button"
              className={`${styles.gymCard} ${selectedGymId === gym.id ? styles.gymCardActive : ""}`}
              onClick={() => {
                setSelectedGymId(gym.id);
                setError("");
              }}
            >
              <span className={styles.gymCardIcon}>🏋️</span>
              <span className={styles.gymCardName}>{gym.name}</span>
            </button>
          ))}
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label}>Пароль</label>
            <div className={styles.passWrap}>
              <input
                className={styles.input}
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                placeholder="Введіть пароль"
                autoComplete="current-password"
              />
              <button
                type="button"
                className={styles.eyeBtn}
                onClick={() => setShowPass((v) => !v)}
                tabIndex={-1}
              >
                {showPass ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button
            className={styles.btn}
            type="submit"
            disabled={!selectedGymId || !password || loading}
          >
            {loading ? "Вхід..." : "Увійти"}
          </button>
        </form>
      </div>
    </div>
  );
}
