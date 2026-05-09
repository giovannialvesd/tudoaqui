import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Props {
  children?: ReactNode;
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

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-bg-base flex flex-col items-center justify-center p-6 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
            <AlertTriangle className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 mb-2">Ops! Algo deu errado</h1>
          <p className="text-zinc-600 mb-8 max-w-md">
            Ocorreu um erro inesperado. Nossa equipe técnica já foi notificada.
          </p>
          
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <div className="bg-red-50 p-4 rounded-xl text-left border border-red-200 w-full max-w-2xl overflow-auto mb-8 text-xs text-red-800">
              <p className="font-bold mb-2">{this.state.error.message}</p>
              <pre>{this.state.error.stack}</pre>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
            <button 
              onClick={() => window.location.reload()}
              className="flex-1 bg-zinc-900 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-zinc-800 transition-colors"
            >
              <RefreshCw className="w-4 h-4" /> Recarregar
            </button>
            <Link 
              to="/"
              onClick={() => this.setState({ hasError: false, error: null })}
              className="flex-1 bg-white text-zinc-900 border border-zinc-200 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-zinc-50 transition-colors"
            >
              <Home className="w-4 h-4" /> Início
            </Link>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
