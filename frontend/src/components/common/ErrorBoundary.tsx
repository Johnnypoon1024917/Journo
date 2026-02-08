import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="error-boundary">
          <div className="error-content">
            <h2 className="error-title">Something went wrong</h2>
            <p className="error-message">
              We encountered an unexpected error. Please try refreshing the page.
            </p>
            <button
              className="error-retry-button"
              onClick={() => this.setState({ hasError: false, error: undefined })}
            >
              Try Again
            </button>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="error-details">
                <summary>Error Details (Development)</summary>
                <pre className="error-stack">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>

          <style>{`
            .error-boundary {
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 400px;
              padding: 20px;
              background: #f9fafb;
            }

            .error-content {
              text-align: center;
              max-width: 500px;
              padding: 40px;
              background: white;
              border-radius: 12px;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            }

            .error-title {
              font-size: 24px;
              font-weight: 600;
              color: #dc2626;
              margin: 0 0 16px 0;
            }

            .error-message {
              font-size: 16px;
              color: #6b7280;
              margin: 0 0 24px 0;
              line-height: 1.5;
            }

            .error-retry-button {
              padding: 12px 24px;
              background: #3b82f6;
              color: white;
              border: none;
              border-radius: 8px;
              font-size: 16px;
              font-weight: 500;
              cursor: pointer;
              transition: background 0.2s;
            }

            .error-retry-button:hover {
              background: #2563eb;
            }

            .error-details {
              margin-top: 24px;
              text-align: left;
            }

            .error-details summary {
              cursor: pointer;
              font-weight: 500;
              color: #374151;
              margin-bottom: 8px;
            }

            .error-stack {
              background: #f3f4f6;
              padding: 16px;
              border-radius: 6px;
              font-size: 12px;
              color: #374151;
              overflow-x: auto;
              white-space: pre-wrap;
              word-break: break-all;
            }
          `}</style>
        </div>
      );
    }

    return this.props.children;
  }
}