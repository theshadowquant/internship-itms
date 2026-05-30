import React, { Component } from 'react';
import { AlertCircle } from 'lucide-react';
import Button from '../ui/Button';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an exception:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[50vh] flex flex-col items-center justify-center text-center p-8 border border-red-500/10 rounded-xl bg-red-500/5 my-6 max-w-lg mx-auto">
          <div className="p-3 rounded-full bg-red-500/10 text-red-400 mb-4 border border-red-500/20">
            <AlertCircle className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-100 mb-2">
            Something went wrong
          </h3>
          <p className="text-sm text-slate-500 mb-6 max-w-sm leading-relaxed">
            An unexpected error occurred while rendering this page view.
            {this.state.error?.message && (
              <code className="block mt-2 p-2 bg-slate-950 text-red-400 text-xs rounded border border-slate-800 font-mono text-left break-all max-h-32 overflow-y-auto">
                {this.state.error.message}
              </code>
            )}
          </p>
          <Button onClick={this.handleReset} variant="outline" size="sm">
            Reload Platform
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
