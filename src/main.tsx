import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Failed to find the root element');
}

// Global error handler for top-level crashes
const showError = (error: any) => {
  if (!error) return;
  
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : '';

  // Filter out noisy, non-fatal errors that shouldn't block the app
  const noisyErrors = [
    'WebSocket closed without opened',
    'failed to connect to websocket',
    'ResizeObserver loop limit exceeded',
    'Script error.',
    'NetworkError when attempting to fetch resource',
    'createWebSocketModuleRunnerTransport'
  ];

  if (noisyErrors.some(noisy => errorMessage.includes(noisy) || (errorStack && errorStack.includes(noisy)))) {
    console.warn('Filtered noisy error:', errorMessage);
    return;
  }

  console.error('CRITICAL APP ERROR:', error);
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="min-height: 100vh; background: #0A0A0B; color: white; display: flex; align-items: center; justify-content: center; padding: 24px; font-family: 'Inter', sans-serif; text-align: center;">
        <div style="max-width: 540px; width: 100%; border: 1px solid rgba(242, 125, 38, 0.2); padding: 48px; border-radius: 32px; background: #151619; box-shadow: 0 24px 64px rgba(0,0,0,0.6); position: relative; overflow: hidden;">
          <div style="position: absolute; top: 0; left: 0; right: 0; height: 4px; background: linear-gradient(90deg, #F27D26, #FF5722);"></div>
          
          <div style="width: 64px; height: 64px; background: rgba(242, 125, 38, 0.1); border-radius: 20px; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px;">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#F27D26" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
          </div>

          <h1 style="font-size: 28px; font-weight: 800; color: white; margin-bottom: 12px; letter-spacing: -0.02em;">App Failed to Load</h1>
          <p style="color: rgba(255,255,255,0.5); font-size: 15px; line-height: 1.6; margin-bottom: 32px;">
            This is usually caused by missing or incorrect environment variables in your platform settings (like Supabase or Stripe keys).
          </p>

          <div style="background: #0A0A0B; padding: 20px; border-radius: 16px; font-size: 13px; color: #FF8A80; overflow: auto; text-align: left; max-height: 180px; margin-bottom: 32px; font-family: 'JetBrains Mono', monospace; border: 1px solid rgba(255,255,255,0.05); line-height: 1.5;">
            <div style="font-weight: bold; margin-bottom: 8px; color: #F27D26;">Error Details:</div>
            ${errorMessage}
            ${errorStack ? `<div style="margin-top: 12px; opacity: 0.5; font-size: 11px;">${errorStack}</div>` : ''}
          </div>

          <div style="display: flex; gap: 12px; justify-content: center;">
            <button onclick="window.location.reload()" style="background: #F27D26; color: white; border: none; padding: 14px 28px; border-radius: 16px; font-weight: 700; font-size: 15px; cursor: pointer; transition: all 0.2s; box-shadow: 0 8px 16px rgba(242, 125, 38, 0.2);">
              Reload Application
            </button>
          </div>
          
          <p style="margin-top: 24px; font-size: 12px; color: rgba(255,255,255,0.3);">
            Check your Vercel/Platform environment variables and redeploy.
          </p>
        </div>
      </div>
    `;
  }
};

window.addEventListener('error', (event) => showError(event.error));
window.addEventListener('unhandledrejection', (event) => showError(event.reason));

try {
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
} catch (error) {
  showError(error);
}
