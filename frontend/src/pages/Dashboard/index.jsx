import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout, gymLogout } from "../../store/slices/authSlice.js";
import {
  fetchCurrentVisits,
  fetchTodayVisits,
  selectInGym,
  selectVisitorsToday,
} from "../../store/slices/gymSlice.js";
import ClientsTable from "./components/ClientsTable.jsx";
import TodayVisitors from "./components/TodayVisitors.jsx";
import PaymentHistory from "./components/PaymentHistory.jsx";
import ScannerInput from "./components/ScannerInput.jsx";
import SearchModal from "./components/SearchModal.jsx";
import BirthdayModal from "./components/BirthdayModal.jsx";
import GroupReportModal from "./components/GroupReportModal.jsx";
import NewClient from "../NewClient/index.jsx";
import ClientProfile from "../ClientProfile/index.jsx";
import logo from "../../styles/images/logo.PNG";
import styles from "../../styles/dashboard.module.css";

export default function Dashboard() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [showSearch, setShowSearch] = useState(false);
  const [showNewClient, setShowNewClient] = useState(false);
  const [showBirthdays, setShowBirthdays] = useState(false);
  const [showGroupReport, setShowGroupReport] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [tableTab, setTableTab] = useState("inGym");
  const [todayLoaded, setTodayLoaded] = useState(false);

  const currentWorker = useSelector((state) => state.auth.currentWorker);
  const selectedGym = useSelector((state) => state.auth.selectedGym);
  const inGym = useSelector(selectInGym);
  const visitorsToday = useSelector(selectVisitorsToday);

  useEffect(() => {
    dispatch(fetchCurrentVisits());
  }, [dispatch]);

  function handleTabChange(tab) {
    setTableTab(tab);
    if (tab === "today" && !todayLoaded) {
      dispatch(fetchTodayVisits());
      setTodayLoaded(true);
    }
  }

  function handleLogout() {
    localStorage.removeItem("access_token");
    dispatch(logout());
    navigate("/select-worker");
  }

  function handleClientSelect(id) {
    setShowSearch(false);
    setSelectedClientId(id);
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <img src={logo} alt="Зал" className={styles.logoImg} />
          <div>
            <span className={styles.appName}>CRM</span>
            {selectedGym && (
              <span className={styles.gymName}>{selectedGym.name}</span>
            )}
          </div>
        </div>
        <div className={styles.headerRight}>
          <button
            className={styles.bdBtn}
            onClick={() => setShowGroupReport(true)}
            title="Групові заняття"
          >
            👥
          </button>
          <button
            className={styles.bdBtn}
            onClick={() => setShowBirthdays(true)}
            title="Дні народження"
          >
            🎂
          </button>
          <span className={styles.workerName}>👤 {currentWorker?.name}</span>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            Вийти
          </button>
          <button
            className={styles.changeGymBtn}
            onClick={() => { localStorage.removeItem("access_token"); dispatch(gymLogout()); navigate("/"); }}
            title="Змінити зал"
          >
            Змінити зал
          </button>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.toolbar}>
          <div className={styles.toolbarLeft}>
            <ScannerInput onClientSelect={handleClientSelect} />
            <button
              className={styles.searchBtn}
              onClick={() => setShowSearch(true)}
            >
              🔍 Пошук за прізвищем
            </button>
            <button
              className={styles.newBtn}
              onClick={() => setShowNewClient(true)}
            >
              + Новий клієнт
            </button>
          </div>
        </div>

        <div className={styles.tableCard}>
          <div className={styles.tableTabs}>
            <button
              className={`${styles.tableTab} ${tableTab === "inGym" ? styles.tableTabActive : ""}`}
              onClick={() => handleTabChange("inGym")}
            >
              Зараз у залі
              <span className={styles.tableTabCount}>{inGym.length}</span>
            </button>
            <button
              className={`${styles.tableTab} ${tableTab === "today" ? styles.tableTabActive : ""}`}
              onClick={() => handleTabChange("today")}
            >
              Відвідувачі сьогодні
              <span className={styles.tableTabCount}>{visitorsToday.length}</span>
            </button>
            <button
              className={`${styles.tableTab} ${tableTab === "payments" ? styles.tableTabActive : ""}`}
              onClick={() => handleTabChange("payments")}
            >
              Історія оплат
            </button>
          </div>
          {tableTab === "inGym" && <ClientsTable onClientSelect={handleClientSelect} />}
          {tableTab === "today" && <TodayVisitors onClientSelect={handleClientSelect} />}
          {tableTab === "payments" && <PaymentHistory onClientSelect={handleClientSelect} />}
        </div>
      </main>

      {showSearch && (
        <SearchModal
          onClose={() => setShowSearch(false)}
          onClientSelect={handleClientSelect}
        />
      )}

      {showGroupReport && (
        <GroupReportModal
          onClose={() => setShowGroupReport(false)}
          onClientSelect={handleClientSelect}
        />
      )}

      {showBirthdays && (
        <BirthdayModal
          onClose={() => setShowBirthdays(false)}
          onClientSelect={handleClientSelect}
        />
      )}

      {showNewClient && (
        <NewClient
          onClose={() => setShowNewClient(false)}
          onCreated={(id) => {
            setShowNewClient(false);
            setSelectedClientId(id);
          }}
        />
      )}

      {selectedClientId && (
        <ClientProfile
          clientId={selectedClientId}
          onClose={() => setSelectedClientId(null)}
        />
      )}
    </div>
  );
}
