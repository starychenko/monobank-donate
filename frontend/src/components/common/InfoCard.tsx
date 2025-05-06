interface InfoCardProps {
  title: string;
  description: string;
  jarUrl: string;
}

/**
 * Компонент InfoCard - відображає інформаційну картку зі збором
 */
export function InfoCard({ title, description, jarUrl }: InfoCardProps) {
  return (
    <div className="card app-info-card">
      <h3 className="app-info-title">
        {title}
      </h3>
      <p className="app-info-text">
        {description}
      </p>
      
      <div>
        <a 
          href={jarUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="gradient-button"
        >
          Долучитись до збору
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="button-icon" 
            viewBox="0 0 20 20" 
            fill="currentColor"
          >
            <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
            <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
          </svg>
        </a>
      </div>
    </div>
  );
} 