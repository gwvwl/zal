import { useState, useRef, useEffect } from "react";
import styles from "../../../styles/clientProfile.module.css";

const CATEGORY_LABELS = {
  gym: "Спортзал",
  group: "Групові заняття",
  mma: "ММА",
  sambo: "Самбо",
  grappling: "Грепплінг",
  stretching: "Стретчинг",
  boxing: "Бокс",
  karate: "Карате",
  locker: "Ящик",
  rental: "Оренда",
  single: "Разовий",
};

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("uk-UA");
}

function getProgressPercent(sub) {
  if (sub.type === "unlimited" && sub.start_date && sub.end_date) {
    const total = new Date(sub.end_date) - new Date(sub.start_date);
    const passed = Date.now() - new Date(sub.start_date);
    return Math.min(100, Math.max(0, Math.round((passed / total) * 100)));
  }
  if (sub.type === "visits" && sub.total_visits > 0) {
    return Math.round(
      ((sub.total_visits - sub.used_visits) / sub.total_visits) * 100,
    );
  }
  return 0;
}

function SubSelector({ allSubs, selectedId, onSelect }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const selected = allSubs.find((s) => s.id === selectedId);
  if (!selected) return null;

  const statusLabel = (s) =>
    s.status === "purchased"
      ? "Куплений"
      : s.status === "active"
        ? "Активний"
        : s.status === "frozen"
          ? "Заморожений"
          : "Прострочений";

  return (
    <div className={styles.subSelectorWrap} ref={ref}>
      <button
        className={`${styles.subSelectorTrigger} ${selected.status === "purchased" ? styles.subSelectorPurchased : ""} ${selected.category === "locker" ? styles.subSelectorLocker : ""}`}
        onClick={() => setOpen(!open)}
      >
        <div className={styles.subSelectorInfo}>
          <span className={styles.subSelectorCategory}>
            {selected.category === "locker" ? "🔐 " : ""}{CATEGORY_LABELS[selected.category] || selected.category}
          </span>
          <span className={styles.subSelectorLabel}>{selected.label}</span>
        </div>
        <span className={styles.subSelectorStatus}>
          {statusLabel(selected)}
        </span>
        <span
          className={`${styles.subDropdownArrow} ${open ? styles.subDropdownArrowOpen : ""}`}
        >
          ▾
        </span>
      </button>
      {open && (
        <div className={styles.subSelectorMenu}>
          {allSubs?.map((sub) => (
            <button
              key={sub.id}
              className={`${styles.subSelectorOption} ${sub.id === selectedId ? styles.subSelectorOptionActive : ""} ${sub.category === "locker" ? styles.subSelectorOptionLocker : ""}`}
              onClick={() => {
                onSelect(sub.id);
                setOpen(false);
              }}
            >
              <div className={styles.subSelectorInfo}>
                <span className={styles.subSelectorCategory}>
                  {sub.category === "locker" ? "🔐 " : ""}{CATEGORY_LABELS[sub.category] || sub.category}
                </span>
                <span className={styles.subSelectorLabel}>{sub.label}</span>
              </div>
              <span
                className={`${styles.subSelectorBadge} ${sub.status === "active" ? styles.subStatusActive : sub.status === "frozen" ? styles.subStatusFrozen : sub.status === "purchased" ? styles.subStatusPurchased : styles.subStatusExpired}`}
              >
                {statusLabel(sub)}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function SubContent({ sub }) {
  const isPurchased = sub.status === "purchased";
  const isActive = sub.status === "active";
  const isExpired = sub.status === "expired";
  const isFrozen = sub.status === "frozen";
  const isLow =
    sub.type === "visits" &&
    sub.total_visits - sub.used_visits <= 2 &&
    !isPurchased;

  return (
    <>
      {isFrozen && (
        <div className={styles.subFrozenBanner}>
          Заморожено з {formatDate(sub.frozen_from)} до{" "}
          {formatDate(sub.frozen_to)}
        </div>
      )}
      {isLow && isActive && (
        <div className={styles.subLowBanner}>
          Залишилось {sub.total_visits - sub.used_visits} відвідування
        </div>
      )}

      {isPurchased && (
        <div className={styles.subMeta}>
          <div className={styles.subMetaItem}>
            <span className={styles.subMetaLabel}>Куплено</span>
            <span className={styles.subMetaVal}>
              {formatDate(sub.purchased_at)}
            </span>
          </div>
          <div className={styles.subMetaItem}>
            <span className={styles.subMetaLabel}>Термін дії</span>
            <span className={styles.subMetaVal}>{sub.duration_days} днів</span>
          </div>
          {sub.type === "visits" && (
            <div className={styles.subMetaItem}>
              <span className={styles.subMetaLabel}>Кількість</span>
              <span className={styles.subMetaVal}>
                {sub.total_visits} відвідувань
              </span>
            </div>
          )}
          <div className={styles.subMetaItem}>
            <span className={styles.subMetaLabel}>Ціна</span>
            <span className={styles.subMetaVal}>{sub.price} грн</span>
          </div>
        </div>
      )}

      {(isActive || isFrozen || isExpired) && (
        <div className={styles.subMeta}>
          {sub.type === "unlimited" && (
            <>
              <div className={styles.subMetaItem}>
                <span className={styles.subMetaLabel}>Діє з</span>
                <span className={styles.subMetaVal}>
                  {formatDate(sub.start_date)}
                </span>
              </div>
              <div className={styles.subMetaItem}>
                <span className={styles.subMetaLabel}>Діє до</span>
                <span className={styles.subMetaVal}>
                  {formatDate(sub.end_date)}
                </span>
              </div>
              {!isFrozen && (
                <div className={styles.subProgressWrap}>
                  <div className={styles.subProgressBar}>
                    <div
                      className={`${styles.subProgressFill} ${isExpired ? styles.subProgressExpired : ""}`}
                      style={{ width: `${100 - getProgressPercent(sub)}%` }}
                    />
                  </div>
                  <span className={styles.subProgressLabel}>
                    {isExpired
                      ? "Прострочено"
                      : `Залишилось ${100 - getProgressPercent(sub)}%`}
                  </span>
                </div>
              )}
            </>
          )}
          {sub.type === "visits" && (
            <>
              <div className={styles.subMetaItem}>
                <span className={styles.subMetaLabel}>Використано</span>
                <span className={styles.subMetaVal}>
                  {sub.used_visits} / {sub.total_visits}
                </span>
              </div>
              <div className={styles.subMetaItem}>
                <span className={styles.subMetaLabel}>Діє до</span>
                <span className={styles.subMetaVal}>
                  {formatDate(sub.end_date)}
                </span>
              </div>
              <div className={styles.subMetaItem}>
                <span className={styles.subMetaLabel}>Залишилось</span>
                <span
                  className={`${styles.subMetaVal} ${isLow ? styles.subMetaLow : ""}`}
                >
                  {sub.total_visits - sub.used_visits} відвідувань
                </span>
              </div>
              <div className={styles.subProgressWrap}>
                <div className={styles.subProgressBar}>
                  <div
                    className={`${styles.subProgressFill} ${isLow ? styles.subProgressLow : ""} ${isExpired ? styles.subProgressExpired : ""}`}
                    style={{ width: `${getProgressPercent(sub)}%` }}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}

export default function SubscriptionCard({
  subscriptions,
  onActivate,
  onFreeze,
  onUnfreeze,
  onEnter,
  onExit,
  isInGym,
}) {
  const allSubs = subscriptions.filter((s) =>
    ["active", "frozen", "purchased"].includes(s.status),
  );
  const [selectedId, setSelectedId] = useState(allSubs[0]?.id || null);

  useEffect(() => {
    if (allSubs.length > 0 && !allSubs.find((s) => s.id === selectedId)) {
      setSelectedId(allSubs[0].id);
    }
  }, [allSubs, selectedId]);

  const current = allSubs.find((s) => s.id === selectedId) || null;

  if (allSubs.length === 0) {
    return (
      <div>
        <div className={styles.subCard}>
          <div className={styles.subNoSub}>
            <div>
              <p className={styles.subNoSubTitle}>Немає активного абонементу</p>
              <p className={styles.subNoSubText}>
                Клієнт може відвідати зал за разовим входом або придбати
                абонемент
              </p>
            </div>
          </div>
          <div className={styles.subCardEntry}>
            <div className={styles.entryButtons}>
              <button
                className={`${styles.enterBtn} ${isInGym ? styles.enterBtnDisabled : ""}`}
                onClick={() => onEnter(null)}
                disabled={isInGym}
              >
                Увійшов
              </button>
              <button
                className={`${styles.exitBtn} ${!isInGym ? styles.exitBtnDisabled : ""}`}
                onClick={onExit}
                disabled={!isInGym}
              >
                Вийшов
              </button>
            </div>
            {isInGym && (
              <div className={styles.inGymBadge}>Клієнт зараз у залі</div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const isLocker = current?.category === "locker";
  const isPurchased = current?.status === "purchased";
  const isActive = current?.status === "active";
  const isFrozen = current?.status === "frozen";

  const statusLabel = isPurchased
    ? "Куплений"
    : isActive
      ? "Активний"
      : isFrozen
        ? "Заморожений"
        : "Прострочений";
  const statusCls = isPurchased
    ? styles.subStatusPurchased
    : isActive
      ? styles.subStatusActive
      : isFrozen
        ? styles.subStatusFrozen
        : styles.subStatusExpired;

  return (
    <div>
      {allSubs.length > 1 && (
        <SubSelector
          allSubs={allSubs}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
      )}

      {current && (
        <div
          className={`${styles.subCard} ${isFrozen ? styles.subCardFrozen : ""} ${isPurchased ? styles.subCardPurchased : ""} ${isLocker ? styles.subCardLocker : ""}`}
        >
          <div className={styles.subTop}>
            <div>
              <p className={styles.subLabel}>
                {isLocker ? "🔐 " : ""}{CATEGORY_LABELS[current.category] || current.category}
              </p>
              <p className={styles.subValue}>{current.label}</p>
            </div>
            <span className={`${styles.subStatus} ${statusCls}`}>
              {statusLabel}
            </span>
          </div>

          <SubContent sub={current} />

          {/* Purchased → Activate */}
          {isPurchased && (
            <div className={styles.subActions}>
              <button
                className={styles.subBtnActivate}
                onClick={() => onActivate(current.id)}
              >
                Активувати
              </button>
            </div>
          )}

          {/* Active non-locker → Freeze + Enter/Exit */}
          {isActive && !isLocker && (
            <>
              <div className={styles.subActions}>
                <button
                  className={styles.subBtnFreeze}
                  onClick={() => onFreeze(current.id)}
                >
                  Заморозити
                </button>
              </div>
              <div className={styles.subCardEntry}>
                <div className={styles.entryButtons}>
                  <button
                    className={`${styles.enterBtn} ${isInGym ? styles.enterBtnDisabled : ""}`}
                    onClick={() => onEnter(current.id)}
                    disabled={isInGym}
                  >
                    Увійшов
                  </button>
                  <button
                    className={`${styles.exitBtn} ${!isInGym ? styles.exitBtnDisabled : ""}`}
                    onClick={onExit}
                    disabled={!isInGym}
                  >
                    Вийшов
                  </button>
                </div>
                {isInGym && (
                  <div className={styles.inGymBadge}>Клієнт зараз у залі</div>
                )}
              </div>
            </>
          )}

          {/* Frozen non-locker → Unfreeze */}
          {isFrozen && !isLocker && (
            <div className={styles.subActions}>
              <button
                className={styles.subBtnUnfreeze}
                onClick={() => onUnfreeze(current.id)}
              >
                Розморозити
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
