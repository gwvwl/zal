import { useState, useEffect } from "react";
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

function daysSince(dateStr) {
  if (!dateStr) return 0;
  return Math.max(0, Math.floor((Date.now() - new Date(dateStr)) / (1000 * 60 * 60 * 24)));
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

function statusLabel(s) {
  if (s.status === "purchased") return "Куплений";
  if (s.status === "active") return "Активний";
  if (s.status === "frozen") return "Заморожений";
  if (s.status === "expired") return "Прострочений";
  return s.status;
}

// Горизонтальні таби замість dropdown
function SubNav({ allSubs, selectedId, onSelect }) {
  return (
    <div className={styles.subNav}>
      {allSubs.map((sub) => (
        <button
          key={sub.id}
          className={`${styles.subNavBtn}
            ${sub.id === selectedId ? styles.subNavBtnActive : ""}
            ${(sub.status === "active" || sub.status === "frozen") ? styles.subNavBtnStatusActive : ""}
            ${sub.status === "purchased" ? styles.subNavBtnPurchased : ""}
            ${sub.category === "locker" && sub.status !== "expired" ? styles.subNavBtnLocker : ""}
            ${sub.status === "expired" ? styles.subNavBtnExpired : ""}`}
          onClick={() => onSelect(sub.id)}
        >
          <span className={styles.subNavCategory}>
            {sub.category === "locker" ? "🔐 " : ""}
            {CATEGORY_LABELS[sub.category] || sub.category}
          </span>
          <span className={styles.subNavLabel}>{sub.label}</span>
        </button>
      ))}
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
      {isExpired && sub.category === "locker" && (
        <div className={styles.subExpiredBanner}>
          Прострочений {daysSince(sub.end_date)} дн. (з {formatDate(sub.end_date)})
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
              {!isFrozen && !isExpired && (
                <div className={styles.subProgressWrap}>
                  <div className={styles.subProgressBar}>
                    <div
                      className={`${styles.subProgressFill} ${isExpired ? styles.subProgressExpired : ""}`}
                      style={{ width: `${100 - getProgressPercent(sub)}%` }}
                    />
                  </div>
                  <span className={styles.subProgressLabel}>
                    {`Залишилось ${100 - getProgressPercent(sub)}%`}
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
              {!isExpired && (
                <>
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
                        className={`${styles.subProgressFill} ${isLow ? styles.subProgressLow : ""}`}
                        style={{ width: `${getProgressPercent(sub)}%` }}
                      />
                    </div>
                  </div>
                </>
              )}
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
  onRenewLocker,
}) {
  // Include expired lockers
  const allSubs = subscriptions.filter(
    (s) =>
      ["active", "frozen", "purchased"].includes(s.status) ||
      (s.status === "expired" && s.category === "locker"),
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
  const isExpired = current?.status === "expired";

  const statusCls = isPurchased
    ? styles.subStatusPurchased
    : isActive
      ? styles.subStatusActive
      : isFrozen
        ? styles.subStatusFrozen
        : styles.subStatusExpired;

  return (
    <div>
      {/* Таби замість dropdown */}
      {allSubs.length > 1 && (
        <SubNav
          allSubs={allSubs}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
      )}

      {current && (
        <div
          className={`${styles.subCard}
            ${isFrozen ? styles.subCardFrozen : ""}
            ${isPurchased ? styles.subCardPurchased : ""}
            ${isLocker ? styles.subCardLocker : ""}
            ${isExpired ? styles.subCardExpired : ""}`}
        >
          <div className={styles.subTop}>
            <div>
              <p className={styles.subLabel}>
                {isLocker ? "🔐 " : ""}
                {CATEGORY_LABELS[current.category] || current.category}
              </p>
              <p className={styles.subValue}>{current.label}</p>
            </div>
            <span className={`${styles.subStatus} ${statusCls}`}>
              {statusLabel(current)}
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

          {/* Expired locker → Renew (retroactive payment) */}
          {isExpired && isLocker && (
            <div className={styles.subActions}>
              <button
                className={styles.subBtnActivate}
                onClick={() => onRenewLocker && onRenewLocker(current)}
              >
                💳 Оплатити
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
