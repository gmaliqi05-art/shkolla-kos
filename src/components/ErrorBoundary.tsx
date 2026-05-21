import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-rose-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 p-8 text-center">
          <div className="w-16 h-16 bg-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-rose-600" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Ndodhi një gabim</h1>
          <p className="text-sm text-slate-500 mb-6">
            Aplikacioni hasi në një gabim të papritur. Ju lutemi provoni përsëri ose kthehuni në faqen kryesore.
          </p>
          {this.state.error?.message && (
            <pre className="text-xs text-left bg-slate-50 border border-slate-100 rounded-lg p-3 mb-6 overflow-auto max-h-32 text-slate-700">
              {this.state.error.message}
            </pre>
          )}
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Provo përsëri
            </button>
            <button
              onClick={this.handleGoHome}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-900 text-white rounded-xl text-sm font-medium hover:bg-blue-800 transition-colors"
            >
              <Home className="w-4 h-4" />
              Faqja kryesore
            </button>
          </div>
        </div>
      </div>
    );
  }
}
