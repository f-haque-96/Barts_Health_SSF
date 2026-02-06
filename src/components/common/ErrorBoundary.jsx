/**
 * Error Boundary Component
 * ARC-03: Prevents entire app from crashing when a component errors
 * Catches JavaScript errors anywhere in the child component tree
 */

import React from 'react';
import { WarningIcon, RotateIcon, HomeIcon } from './Icons';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError() {
    // Update state so the next render will show the fallback UI
    // Note: error parameter intentionally not used, but required by React
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console in development
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Update state with error details
    this.setState((prevState) => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1,
    }));

    // TODO: In production, send error to monitoring service (e.g., Sentry, Application Insights)
    if (import.meta.env.PROD) {
      // Example: logErrorToService(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Fallback UI
      return (
        <div style={styles.container}>
          <div style={styles.card}>
            <WarningIcon size={48} color="#dc2626" style={styles.icon} />

            <h1 style={styles.title}>Something Went Wrong</h1>

            <p style={styles.message}>
              We apologize for the inconvenience. An unexpected error has occurred.
            </p>

            {import.meta.env.DEV && this.state.error && (
              <details style={styles.details}>
                <summary style={styles.summary}>Error Details (Development Only)</summary>
                <pre style={styles.errorText}>
                  {this.state.error.toString()}
                  {this.state.errorInfo && this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}

            <div style={styles.actions}>
              <button onClick={this.handleReset} style={styles.primaryButton}>
                <RotateIcon size={16} style={styles.buttonIcon} />
                Try Again
              </button>

              <button onClick={this.handleGoHome} style={styles.secondaryButton}>
                <HomeIcon size={16} style={styles.buttonIcon} />
                Go to Home
              </button>
            </div>

            <p style={styles.helpText}>
              If this problem persists, please contact the IT Service Desk.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Inline styles for error boundary (to avoid CSS dependencies)
const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
    padding: '20px',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    padding: '40px',
    maxWidth: '600px',
    width: '100%',
    textAlign: 'center',
  },
  icon: {
    marginBottom: '20px',
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: '12px',
  },
  message: {
    fontSize: '16px',
    color: '#6b7280',
    marginBottom: '24px',
    lineHeight: '1.5',
  },
  details: {
    textAlign: 'left',
    marginBottom: '24px',
    padding: '16px',
    backgroundColor: '#fef2f2',
    borderRadius: '4px',
    border: '1px solid #fecaca',
  },
  summary: {
    cursor: 'pointer',
    fontWeight: '600',
    color: '#dc2626',
    marginBottom: '12px',
  },
  errorText: {
    fontSize: '12px',
    color: '#991b1b',
    overflow: 'auto',
    maxHeight: '200px',
  },
  actions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
    marginBottom: '20px',
  },
  primaryButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#005EB8',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  secondaryButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: 'white',
    color: '#005EB8',
    border: '2px solid #005EB8',
    borderRadius: '4px',
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  buttonIcon: {
    display: 'inline-block',
  },
  helpText: {
    fontSize: '14px',
    color: '#9ca3af',
  },
};

export default ErrorBoundary;
