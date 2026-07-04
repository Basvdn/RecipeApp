"use client";

import { useRef } from "react";

interface Props {
  onSelect: (file: File) => void;
  disabled?: boolean;
}

export function PhotoCapture({ onSelect, disabled }: Props) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onSelect(file);
    e.target.value = "";
  }

  return (
    <div className="flex flex-col gap-3">
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleChange}
        className="hidden"
      />
      <input
        ref={uploadInputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="hidden"
      />
      <button
        type="button"
        disabled={disabled}
        onClick={() => cameraInputRef.current?.click()}
        className="rounded bg-foreground px-4 py-3 font-medium text-background disabled:opacity-50"
      >
        Take photo
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => uploadInputRef.current?.click()}
        className="rounded border px-4 py-3 font-medium disabled:opacity-50"
      >
        Choose existing photo
      </button>
    </div>
  );
}
