import React from "react";

type Props = {
  children: React.ReactNode;
  fallback?: (props: { error: Error }) => React.ReactNode;
};
type State = { hasError: boolean; error?: Error };

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("ErrorBoundary caught error", error, info);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback && this.state.error) {
        return this.props.fallback({ error: this.state.error }) as JSX.Element;
      }

      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded">
          <h3 className="text-lg font-semibold text-red-700">
            Component failed to render
          </h3>
          <pre className="text-sm text-red-600 mt-2">
            {String(this.state.error)}
          </pre>
        </div>
      );
    }
    return this.props.children as JSX.Element;
  }
}
