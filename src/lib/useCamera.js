import { useCallback, useEffect, useRef, useState } from 'react';
import { CAPTURE_MAX_EDGE } from './detector';

/**
 * The real device camera.
 *
 * Requests the rear-facing stream, exposes its status so the UI can explain
 * itself when permission is refused, and captures full-resolution stills into
 * JPEG blobs that stay on the device.
 *
 * `getUserMedia` needs a secure context — https:// or localhost. On plain http
 * over a LAN address the browser reports the API as missing, which surfaces
 * here as `status: 'unsupported'`.
 */
export function useCamera(active, retryNonce = 0) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [status, setStatus] = useState('idle');
  const [torchAvailable, setTorchAvailable] = useState(false);
  const [torchOn, setTorchOn] = useState(false);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setTorchOn(false);
    setTorchAvailable(false);
  }, []);

  useEffect(() => {
    if (!active) {
      stop();
      setStatus('idle');
      return undefined;
    }

    let cancelled = false;

    (async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setStatus('unsupported');
        return;
      }
      setStatus('starting');
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        const [track] = stream.getVideoTracks();
        setTorchAvailable(Boolean(track?.getCapabilities?.().torch));
        setStatus('live');
      } catch (error) {
        if (cancelled) return;
        // NotAllowedError covers both an explicit refusal and a blocked prompt.
        setStatus(error?.name === 'NotAllowedError' ? 'denied' : 'error');
      }
    })();

    return () => {
      cancelled = true;
      stop();
    };
  }, [active, retryNonce, stop]);

  /** Grabs the current frame as a JPEG blob, scaled to a sane upload-free size. */
  const capture = useCallback(async () => {
    const video = videoRef.current;
    if (!video?.videoWidth) return null;

    const scale = Math.min(1, CAPTURE_MAX_EDGE / Math.max(video.videoWidth, video.videoHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.82));
    if (!blob) return null;
    return { blob, url: URL.createObjectURL(blob), w: canvas.width, h: canvas.height };
  }, []);

  const toggleTorch = useCallback(async () => {
    const [track] = streamRef.current?.getVideoTracks() || [];
    if (!track?.getCapabilities?.().torch) return;
    const next = !torchOn;
    try {
      await track.applyConstraints({ advanced: [{ torch: next }] });
      setTorchOn(next);
    } catch {
      /* some devices advertise torch but refuse the constraint — leave it off */
    }
  }, [torchOn]);

  return { videoRef, status, capture, torchAvailable, torchOn, toggleTorch };
}
