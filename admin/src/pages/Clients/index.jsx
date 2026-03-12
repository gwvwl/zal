import { useState, useEffect } from "react";
import $api from "../../api/http.js";
import { useToast } from "../../components/Toast.jsx";
import Pagination from "../../components/Pagination.jsx";
import s from "../../styles/crud.module.css";

const PER_PAGE = 20;
const API_BASE =
  import.meta.env.VITE_API_URL?.replace("/admin", "") ||
  "http://localhost:3001";

export default function Clients() {
  const toast = useToast();
  const [clients, setClients] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [gyms, setGyms] = useState([]);
  const [gymFilter, setGymFilter] = useState("");

  useEffect(() => {
    $api
      .get("/gyms")
      .then((r) => setGyms(r.data))
      .catch(() => {});
  }, []);

  async function load() {
    try {
      const params = { limit: PER_PAGE, offset: (page - 1) * PER_PAGE };
      if (gymFilter) params.gymId = gymFilter;
      if (search) params.q = search;
      const { data } = await $api.get("/clients", { params });
      setClients(data.clients);
      setTotal(data.total);
    } catch {
      toast("Не вдалось завантажити клієнтів");
    }
  }

  useEffect(() => {
    load();
  }, [page, gymFilter]);

  useEffect(() => {
    setPage(1);
    const timer = setTimeout(load, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const totalPages = Math.ceil(total / PER_PAGE);
  const gymName = (id) => gyms.find((g) => g.id === id)?.name || id;

  function photoUrl(photo) {
    if (!photo) return null;
    if (photo.startsWith("http") || photo.startsWith("data:")) return photo;
    const clean = photo.startsWith('/uploads/') ? photo.slice('/uploads/'.length) : photo;
    return `${API_BASE}/uploads/${clean}`;
  }

  return (
    <>
      <div className={s.filtersBar}>
        <input
          className={s.searchInput}
          placeholder="Пошук за ім'ям, телефоном, кодом..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className={s.filterSelect}
          value={gymFilter}
          onChange={(e) => {
            setGymFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Усі зали</option>
          {gyms?.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
        <span style={{ color: "var(--gray-500)", fontSize: 13 }}>
          Знайдено: {total}
        </span>
      </div>

      <div className={s.tableWrap}>
        {clients.length === 0 ? (
          <div className={s.empty}>
            <span className={s.emptyIcon}>👤</span>
            Клієнтів не знайдено
          </div>
        ) : (
          <table className={s.table}>
            <thead>
              <tr>
                <th></th>
                <th>Ім'я</th>
                <th>Телефон</th>
                <th>Email</th>
                <th>Код</th>
                <th>Зал</th>
              </tr>
            </thead>
            <tbody>
              {clients?.map((c) => {
                const photo = photoUrl(c.photo);
                const initials =
                  `${(c.last_name || "")[0] || ""}${(c.first_name || "")[0] || ""}`.toUpperCase();
                return (
                  <tr key={c.id}>
                    <td style={{ width: 50 }}>
                      {photo ? (
                        <img
                          src={photo}
                          alt=""
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: "50%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: "50%",
                            background: "var(--primary-light)",
                            color: "var(--primary)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 700,
                            fontSize: 12,
                          }}
                        >
                          {initials}
                        </div>
                      )}
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      {c.last_name} {c.first_name}
                    </td>
                    <td>{c.phone || "—"}</td>
                    <td style={{ fontSize: 13, color: "var(--gray-500)" }}>
                      {c.email || "—"}
                    </td>
                    <td style={{ fontSize: 13, color: "var(--gray-400)" }}>
                      {c.code || "—"}
                    </td>
                    <td>{gymName(c.gym_id)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </div>
    </>
  );
}
