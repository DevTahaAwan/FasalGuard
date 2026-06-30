'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'sans-serif' }}>
          <h2>FasalGuard Application Error</h2>
          <p>{error.message}</p>
          <button 
            onClick={() => reset()}
            style={{ padding: '0.75rem 1.5rem', background: '#012d1d', color: 'white', border: 'none', borderRadius: '0.5rem', marginTop: '1rem' }}
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  );
}
