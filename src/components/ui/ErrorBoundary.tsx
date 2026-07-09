import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen w-full flex items-center justify-center bg-background p-6">
          <div className="relative max-w-md w-full bg-surface-base/40 backdrop-blur-xl border border-surface-border rounded-3xl p-8 shadow-2xl overflow-hidden group">
            {/* Ambient background glow */}
            <div className="absolute -inset-24 bg-gradient-to-br from-red-500/20 via-orange-500/10 to-transparent blur-3xl -z-10 group-hover:opacity-100 opacity-70 transition-opacity duration-700"></div>
            
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="h-20 w-20 rounded-full bg-red-500/10 flex items-center justify-center relative">
                <div className="absolute inset-0 rounded-full border border-red-500/20 animate-ping"></div>
                <AlertCircle className="w-10 h-10 text-red-400" />
              </div>
              
              <div className="space-y-2">
                <h1 className="text-2xl font-bold text-text-primary tracking-tight">Application Error</h1>
                <p className="text-text-secondary text-sm">
                  We encountered an unexpected issue while rendering this view.
                </p>
              </div>

              {this.state.error && (
                <div className="w-full bg-background/50 rounded-xl p-4 text-left border border-surface-border overflow-x-auto">
                  <p className="text-red-400 font-mono text-xs whitespace-pre-wrap break-words">
                    {this.state.error.message}
                  </p>
                </div>
              )}

              <button
                onClick={this.handleReload}
                className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-red-500/10 to-orange-500/10 hover:from-red-500/20 hover:to-orange-500/20 text-red-300 font-medium py-3 px-6 rounded-xl border border-red-500/20 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg hover:shadow-red-500/10 active:scale-[0.98]"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload Application</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
