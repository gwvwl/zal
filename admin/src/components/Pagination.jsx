import styles from "../styles/pagination.module.css";

export default function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "...") {
      pages.push("...");
    }
  }

  return (
    <div className={styles.wrap}>
      <button
        className={styles.btn}
        disabled={page === 1}
        onClick={() => onPageChange(page - 1)}
      >
        &laquo;
      </button>
      {pages?.map((p, i) =>
        p === "..." ? (
          <span key={`dots-${i}`} className={styles.dots}>
            ...
          </span>
        ) : (
          <button
            key={p}
            className={`${styles.btn} ${p === page ? styles.active : ""}`}
            onClick={() => onPageChange(p)}
          >
            {p}
          </button>
        ),
      )}
      <button
        className={styles.btn}
        disabled={page === totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        &raquo;
      </button>
    </div>
  );
}
