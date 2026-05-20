import { StrictMode, Component, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

interface ErrorBoundaryState {
  error: Error | null;
}

class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('React error boundary caught:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, system-ui, sans-serif', background: '#f8fafc', padding: '2rem' }}>
          <div style={{ maxWidth: '28rem', textAlign: 'center' }}>
            <div style={{ width: '4rem', height: '4rem', background: '#fee2e2', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>Ndodhi nje gabim</h1>
            <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1.5rem' }}>Aplikacioni hasi ne nje problem te papritur.</p>
            <pre style={{ background: '#1e293b', color: '#f1f5f9', padding: '1rem', borderRadius: '0.75rem', fontSize: '0.75rem', textAlign: 'left', overflow: 'auto', maxHeight: '12rem', marginBottom: '1.5rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {this.state.error.message}
            </pre>
            <button
              onClick={() => window.location.reload()}
              style={{ background: '#1e40af', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '0.75rem', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' }}
            >
              Ringarko faqen
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

async function init() {
  try {
    const { default: App } = await import('./App');
    const root = document.getElementById('root');
    if (!root) {
      throw new Error('Root element not found');
    }
    createRoot(root).render(
      <StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </StrictMode>
    );
  } catch (err) {
    console.error('Failed to initialize app:', err);
    const root = document.getElementById('root');
    if (root) {
      root.innerHTML = `
        <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;font-family:system-ui,sans-serif;background:#f8fafc;padding:2rem">
          <div style="max-width:28rem;text-align:center">
            <h1 style="font-size:1.25rem;font-weight:700;color:#0f172a;margin-bottom:0.5rem">Gabim gjate ngarkimit</h1>
            <p style="color:#64748b;font-size:0.875rem;margin-bottom:1rem">${err instanceof Error ? err.message : 'Gabim i panjohur'}</p>
            <button onclick="location.reload()" style="background:#1e40af;color:white;border:none;padding:0.75rem 1.5rem;border-radius:0.75rem;font-weight:600;cursor:pointer">Ringarko</button>
          </div>
        </div>
      `;
    }
  }
}

init();
