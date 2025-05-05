import QRCode from 'react-qr-code';

interface DonationCardProps {
  title: string | null;
  collected: string | null;
  target: string | null;
  jarUrl: string;
  progress: number;
}

export function DonationCard({ title, collected, target, jarUrl, progress }: DonationCardProps) {
  return (
    <div className="card" style={{ width: '100%', maxWidth: '380px' }}>
      {/* Заголовок */}
      <div style={{ 
        padding: '16px', 
        background: '#ffd100',
        color: '#000000',
        textAlign: 'center',
        borderTopLeftRadius: 'var(--border-radius)',
        borderTopRightRadius: 'var(--border-radius)'
      }}>
        <h2 style={{ 
          fontSize: '20px', 
          fontWeight: 700,
          margin: 0,
          letterSpacing: '0.03em',
          color: '#000000'
        }}>
          {title || 'Назва збору'}
        </h2>
      </div>

      {/* QR-код і дані */}
      <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
        {/* QR-код */}
        <div style={{ 
          padding: '1rem', 
          backgroundColor: 'white', 
          borderRadius: '0.5rem', 
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)' 
        }}>
          {jarUrl ? (
            <QRCode 
              value={jarUrl} 
              size={150}
              bgColor="white"
              fgColor="#000000"
              style={{ height: "auto", maxWidth: "100%", width: "100%" }}
            />
          ) : (
            <div style={{ 
              width: '150px', 
              height: '150px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              backgroundColor: '#f1f1f1', 
              borderRadius: '0.5rem' 
            }}>
              <span style={{ 
                fontSize: 'var(--font-size-sm)', 
                color: '#666',
                fontFamily: 'var(--font-ui)'
              }}>QR код недоступний</span>
            </div>
          )}
        </div>

        {/* Суми в картках */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', width: '100%' }}>
          <div style={{ 
            flex: 1, 
            backgroundColor: 'rgba(255,255,255,0.05)', 
            borderRadius: '0.75rem', 
            padding: '1rem 0.5rem', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center' 
          }}>
            <span style={{ 
              fontSize: 'var(--font-size-xs)', 
              color: 'rgba(255,255,255,0.5)', 
              marginBottom: '0.25rem',
              fontFamily: 'var(--font-ui)',
              fontWeight: 'var(--font-weight-medium)'
            }}>
              Накопичено
            </span>
            <span style={{ 
              fontWeight: 'var(--font-weight-bold)', 
              fontSize: 'var(--font-size-lg)', 
              color: 'var(--primary-color)',
              fontFamily: 'var(--font-ui)'
            }}>
              {collected || '—'}
            </span>
          </div>
          <div style={{ 
            flex: 1, 
            backgroundColor: 'rgba(255,255,255,0.05)', 
            borderRadius: '0.75rem', 
            padding: '1rem 0.5rem', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center' 
          }}>
            <span style={{ 
              fontSize: 'var(--font-size-xs)', 
              color: 'rgba(255,255,255,0.5)', 
              marginBottom: '0.25rem',
              fontFamily: 'var(--font-ui)',
              fontWeight: 'var(--font-weight-medium)'
            }}>
              Ціль
            </span>
            <span style={{ 
              fontWeight: 'var(--font-weight-bold)', 
              fontSize: 'var(--font-size-lg)', 
              color: 'var(--primary-color)',
              fontFamily: 'var(--font-ui)'
            }}>
              {target || '—'}
            </span>
          </div>
        </div>

        {/* Прогрес-бар */}
        <div style={{ width: '100%', marginTop: '0.5rem' }}>
          <div style={{ 
            width: '100%', 
            height: '0.5rem', 
            backgroundColor: 'rgba(255,255,255,0.1)', 
            borderRadius: '9999px', 
            overflow: 'hidden' 
          }}>
            <div
              className="animated-gradient"
              style={{ 
                height: '100%', 
                width: `${progress}%`, 
                background: 'var(--gradient)',
                transition: 'width 1s ease-in-out' 
              }}
            ></div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
            <span style={{ 
              fontSize: 'var(--font-size-xs)', 
              color: 'rgba(255,255,255,0.5)',
              fontFamily: 'var(--font-ui)'
            }}>
              Прогрес
            </span>
            <span style={{ 
              fontSize: 'var(--font-size-xs)', 
              fontWeight: 'var(--font-weight-medium)', 
              color: 'var(--primary-color)',
              fontFamily: 'var(--font-ui)'
            }}>
              {progress.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
} 