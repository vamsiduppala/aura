import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props { children: ReactNode }
interface State { error: Error | null }

/** Catches any render error so the app degrades to a calm recovery, never a white screen. */
export class ErrorBoundary extends Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    // Log for diagnostics; never surface a stack trace to the user.
    // eslint-disable-next-line no-console
    console.error('aura render error:', error, info.componentStack);
  }

  private reset = (): void => {
    this.setState({ error: null });
    // Best-effort: clear session so a corrupt profile can't re-crash on reload.
    try { location.reload(); } catch { /* ignore */ }
  };

  override render(): ReactNode {
    if (!this.state.error) return this.props.children;
    return (
      <div className="app">
        <main className="main">
          <div className="content narrow">
            <div className="view" style={{ paddingTop: 48 }}>
              <div className="serif-h" style={{ fontSize: 26, marginBottom: 12 }}>
                Something slipped.
              </div>
              <p className="body" style={{ marginBottom: 24 }}>
                A small glitch on our side — nothing to do with your reading. Let’s reload and pick
                back up. Your details are safe on this device.
              </p>
              <button className="btn" style={{ maxWidth: 240 }} onClick={this.reset}>Reload</button>
            </div>
          </div>
        </main>
      </div>
    );
  }
}
