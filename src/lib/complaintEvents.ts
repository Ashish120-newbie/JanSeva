// Lightweight pub/sub so the OfficerResolutionPanel can tell the AnalyticsDashboard
// (and any other subscriber) to reload after a complaint status change.
// This avoids prop-drilling a refresh callback through routes.

type Listener = () => void;

const listeners = new Set<Listener>();

export function subscribeToComplaintChanges(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function notifyComplaintChanged(): void {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch (err) {
      console.error('complaint change listener threw:', err);
    }
  });
}
