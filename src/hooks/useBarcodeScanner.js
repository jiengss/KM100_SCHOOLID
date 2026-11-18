import { useEffect, useRef } from 'react';

/**
 * Custom hook to capture rapid keyboard events from hardware Barcode / RFID / NFC scanners.
 * Hardware scanners type character keys very rapidly (< 35ms between keys) and terminate with 'Enter'.
 *
 * @param {Function} onScan - Callback when a scan completes: (scannedText) => void
 * @param {Object} options - { minLength: 3, maxIntervalMs: 50, enabled: true }
 */
export function useBarcodeScanner(onScan, options = {}) {
  const {
    minLength = 3,
    maxIntervalMs = 60,
    enabled = true
  } = options;

  const bufferRef = useRef('');
  const lastTimeRef = useRef(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!enabled) return;

    function handleKeyDown(e) {
      // Don't intercept if user is actively typing in a form input/textarea that is not the kiosk scanner
      const targetTag = e.target.tagName.toLowerCase();
      const isInput = targetTag === 'input' || targetTag === 'textarea' || e.target.isContentEditable;
      const isKioskInput = e.target.getAttribute('data-kiosk-scanner') === 'true';

      if (isInput && !isKioskInput) {
        return;
      }

      const currentTime = performance.now();
      const diff = currentTime - lastTimeRef.current;
      lastTimeRef.current = currentTime;

      // Handle Enter (scan completed)
      if (e.key === 'Enter') {
        const scanned = bufferRef.current.trim();
        bufferRef.current = '';
        if (timerRef.current) clearTimeout(timerRef.current);

        if (scanned.length >= minLength) {
          e.preventDefault();
          onScan(scanned);
        }
        return;
      }

      // If too much time has passed between keystrokes and it's not the start of a buffer,
      // reset buffer if it wasn't typed at machine speed
      if (diff > maxIntervalMs && bufferRef.current.length > 0) {
        bufferRef.current = '';
      }

      // Only capture printable single characters
      if (e.key.length === 1) {
        bufferRef.current += e.key;

        // Safety fallback timer to clear buffer if Enter was never sent
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          bufferRef.current = '';
        }, 500);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [onScan, minLength, maxIntervalMs, enabled]);
}
