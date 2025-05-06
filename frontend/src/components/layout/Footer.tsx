/**
 * Компонент Footer - відображає футер сайту з інформацією про авторські права
 */
export function Footer() {
  return (
    <footer className="app-footer">
      <div className="container">
        <div className="app-footer-content">
          <div className="app-footer-brand">
            <span className="app-footer-year">&copy; {new Date().getFullYear()}</span>
            <span className="app-footer-mono">mono</span>
            <span className="app-footer-bank">bank</span>
            <span className="app-footer-donate">Donate</span>
          </div>
          <span className="app-footer-separator">|</span>
          <span className="app-footer-credits">
            Всі дані беруться з офіційного сайту Monobank
          </span>
        </div>
      </div>
    </footer>
  );
} 