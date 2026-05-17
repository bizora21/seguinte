import { Component, ErrorInfo, ReactNode } from 'react'
import { Button } from './ui/button'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6">⚡</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Algo correu mal</h1>
          <p className="text-gray-500 mb-8">
            Ocorreu um erro inesperado. Tente recarregar a página.
            Se o problema persistir, contacte o suporte.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={() => window.location.reload()} className="bg-primary">
              Recarregar página
            </Button>
            <Button variant="outline" onClick={() => { window.location.href = '/' }}>
              Ir para a página inicial
            </Button>
          </div>
          {import.meta.env.DEV && this.state.error && (
            <pre className="mt-8 text-left text-xs bg-red-50 text-red-700 p-4 rounded-lg overflow-auto max-h-40 border border-red-200">
              {this.state.error.toString()}
            </pre>
          )}
        </div>
      </div>
    )
  }
}

export default ErrorBoundary
