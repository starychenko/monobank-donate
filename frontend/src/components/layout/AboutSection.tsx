/**
 * Компонент AboutSection - відображає секцію "Про проект"
 */
export function AboutSection() {
  return (
    <div className="app-about-wrapper">
      <div className="container">
        <div className="app-about-section">
          <div className="card app-about-card">
            <h3 className="app-about-title">
              Про проєкт
            </h3>
            <p className="app-about-text">
              Цей сервіс дозволяє відстежувати збір коштів на платформі Monobank у реальному часі.
              Дані автоматично оновлюються для відображення актуального стану збору.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 