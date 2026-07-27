const shouldLogClientErrors = (import.meta.env.VITE_ENABLE_CLIENT_LOGGING || 'true').toLowerCase() === 'true';

export function initializeTelemetry(): void {
  if (!shouldLogClientErrors) return;

  window.addEventListener('error', (event) => {
    console.error('[client-error]', {
      message: event.message,
      source: event.filename,
      line: event.lineno,
      col: event.colno,
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    console.error('[client-unhandled-rejection]', {
      reason: String(event.reason),
    });
  });
}
