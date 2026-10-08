"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Minimal typing for the Web Speech API, which TypeScript's DOM lib doesn't ship.
interface SpeechRecognitionResultLike {
  isFinal: boolean;
  0: { transcript: string };
}
interface SpeechRecognitionEventLike {
  results: ArrayLike<SpeechRecognitionResultLike>;
}
interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start(): void;
  stop(): void;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getRecognitionCtor(): SpeechRecognitionCtor | undefined {
  if (typeof window === "undefined") return undefined;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

/**
 * Push-to-talk dictation. Interim transcripts stream into the text box; when the user stops
 * talking the final transcript is handed to onFinal (which sends it).
 */
export function useSpeechInput({
  onInterim,
  onFinal,
}: {
  onInterim: (text: string) => void;
  onFinal: (text: string) => void;
}) {
  // Callers render this only on the client, so the browser check is safe at first render.
  const [supported] = useState(() => !!getRecognitionCtor());
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const transcriptRef = useRef("");
  const callbacks = useRef({ onInterim, onFinal });

  useEffect(() => {
    callbacks.current = { onInterim, onFinal };
  });

  const start = useCallback(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor || recognitionRef.current) return;
    const recognition = new Ctor();
    recognition.lang = navigator.language || "en-US";
    recognition.interimResults = true;
    recognition.continuous = false;
    transcriptRef.current = "";

    recognition.onresult = (event) => {
      const text = Array.from(event.results)
        .map((r) => r[0].transcript)
        .join("");
      transcriptRef.current = text;
      callbacks.current.onInterim(text);
    };
    recognition.onerror = () => {
      transcriptRef.current = "";
    };
    recognition.onend = () => {
      recognitionRef.current = null;
      setListening(false);
      const text = transcriptRef.current.trim();
      if (text) callbacks.current.onFinal(text);
    };

    recognitionRef.current = recognition;
    setListening(true);
    recognition.start();
  }, []);

  const stop = useCallback(() => recognitionRef.current?.stop(), []);

  useEffect(() => () => recognitionRef.current?.stop(), []);

  return { supported, listening, start, stop };
}
