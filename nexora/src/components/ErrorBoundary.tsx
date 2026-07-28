import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 my-4 bg-slate-900 border border-red-500/30 rounded-3xl text-center space-y-4 max-w-lg mx-auto shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center mx-auto border border-red-500/30">
            <AlertTriangle className="w-6 h-6" />
          </div>

          <div className="space-y-1">
            <h3 className="font-extrabold text-base text-slate-100">
              {this.props.fallbackTitle || 'Component Encountered an Issue'}
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {this.state.error?.message || 'An unexpected error occurred while rendering this module. You can try recovering.'}
            </p>
          </div>

          <button
            onClick={this.handleReset}
            className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-pink-600 text-slate-950 font-black text-xs rounded-2xl shadow-lg hover:opacity-90 inline-flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Try Reloading View
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
