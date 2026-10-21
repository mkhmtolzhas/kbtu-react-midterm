// `children` is the call to action (a reset button, a link...) chosen by the parent.
export default function EmptyState({ title, message, children }) {
  return (
    <div className="empty-state">
      <svg className="empty-state__icon" viewBox="0 0 48 48" aria-hidden="true">
        <path d="M9 30 13 19a3 3 0 0 1 2.8-2h16.4a3 3 0 0 1 2.8 2l4 11v7a1.5 1.5 0 0 1-1.5 1.5H35a1.5 1.5 0 0 1-1.5-1.5v-1.5h-19V37a1.5 1.5 0 0 1-1.5 1.5h-2.5A1.5 1.5 0 0 1 9 37z" />
        <circle cx="15.5" cy="29.5" r="2" />
        <circle cx="32.5" cy="29.5" r="2" />
      </svg>
      <h2 className="empty-state__title">{title}</h2>
      {message && <p className="empty-state__text">{message}</p>}
      {children && <div className="empty-state__actions">{children}</div>}
    </div>
  );
}
