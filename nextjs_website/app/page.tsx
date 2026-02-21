"use client";

import { useState, useRef, useCallback } from "react";

const BACKEND_URL = "http://localhost:5073";

const MODELS = [
  { value: "KittenML/kitten-tts-mini-0.8", label: "kitten-tts-mini (80M)" },
  { value: "KittenML/kitten-tts-micro-0.8", label: "kitten-tts-micro (40M)" },
  { value: "KittenML/kitten-tts-nano-0.8", label: "kitten-tts-nano (15M)" },
  {
    value: "KittenML/kitten-tts-nano-0.8-int8",
    label: "kitten-tts-nano-int8 (15M)",
  },
];

const VOICES = [
  "Bella",
  "Jasper",
  "Luna",
  "Bruno",
  "Rosie",
  "Hugo",
  "Kiki",
  "Leo",
];

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <rect x="6" y="4" width="4" height="16" />
      <rect x="14" y="4" width="4" height="16" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg
      className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

export default function Home() {
  const [text, setText] = useState("");
  const [model, setModel] = useState(MODELS[0].value);
  const [voice, setVoice] = useState("Jasper");
  const [loading, setLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const clearAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setIsPlaying(false);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
  }, [audioUrl]);

  const handleGenerate = async () => {
    const input = text || "The quick brown fox jumps over the lazy dog";
    setLoading(true);
    setError(null);
    clearAudio();

    try {
      const params = new URLSearchParams({ text: input, voice, model });
      const res = await fetch(`${BACKEND_URL}/tts?${params.toString()}`);
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.detail || "TTS generation failed");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to generate audio. Is the backend running?"
      );
    } finally {
      setLoading(false);
    }
  };

  const togglePlayback = () => {
    if (!audioUrl) return;

    // Pause: keep the audio element alive so we can resume
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }

    // Resume existing audio if it hasn't finished
    if (audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
      return;
    }

    // First play: create a new Audio element
    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    audio.play();
    setIsPlaying(true);
    audio.onended = () => {
      setIsPlaying(false);
      audioRef.current = null;
    };
  };

  const handleDownload = () => {
    if (!audioUrl) return;
    const a = document.createElement("a");
    a.href = audioUrl;
    a.download = "output.wav";
    a.click();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-100 px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Card */}
        <div className="rounded-2xl border border-stone-200 bg-white p-8 shadow-xl">
          {/* Header */}
          <div className="mb-6 text-center">
            <h1 className="text-xl font-semibold tracking-tight text-stone-900">
              KittenTTS
            </h1>
            <p className="mt-1 text-sm text-stone-500">
              Generate speech from text
            </p>
          </div>

          {/* Text input */}
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-stone-500">
              Text
            </label>
            <textarea
              className="w-full resize-none rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-900 placeholder-stone-400 transition-colors focus:border-stone-400 focus:bg-white focus:outline-none"
              rows={3}
              placeholder="The quick brown fox jumps over the lazy dog"
              value={text}
              onChange={(e) => { setText(e.target.value); clearAudio(); }}
            />
          </div>

          {/* Dropdowns */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-stone-500">
                Model
              </label>
              <div className="relative">
                <select
                  className="w-full appearance-none rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 pr-9 text-sm text-stone-900 transition-colors focus:border-stone-400 focus:bg-white focus:outline-none"
                  value={model}
                  onChange={(e) => { setModel(e.target.value); clearAudio(); }}
                >
                  {MODELS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
                <ChevronDownIcon />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-stone-500">
                Voice
              </label>
              <div className="relative">
                <select
                  className="w-full appearance-none rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 pr-9 text-sm text-stone-900 transition-colors focus:border-stone-400 focus:bg-white focus:outline-none"
                  value={voice}
                  onChange={(e) => { setVoice(e.target.value); clearAudio(); }}
                >
                  {VOICES.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
                <ChevronDownIcon />
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="my-6 border-t border-stone-100" />

          {/* Buttons */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#2563eb] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-[#1d4ed8] active:scale-[0.98] disabled:pointer-events-none disabled:bg-[#93b4f5] disabled:shadow-none"
            >
              Generate
              {loading && <Spinner />}
            </button>

            {audioUrl && (
              <>
                <button
                  onClick={togglePlayback}
                  title={isPlaying ? "Pause" : "Play"}
                  className="inline-flex h-10 w-14 shrink-0 items-center justify-center rounded-xl bg-[#059669] text-white shadow-sm transition-all hover:bg-[#047857] active:scale-[0.95]"
                >
                  {isPlaying ? <PauseIcon /> : <PlayIcon />}
                </button>

                <button
                  onClick={handleDownload}
                  title="Download"
                  className="inline-flex h-10 w-14 shrink-0 items-center justify-center rounded-xl bg-[#059669] text-white shadow-sm transition-all hover:bg-[#047857] active:scale-[0.95]"
                >
                  <DownloadIcon />
                </button>
              </>
            )}
          </div>

          {/* Error message */}
          {error && (
            <p className="mt-4 text-center text-sm text-red-600">{error}</p>
          )}
        </div>

        {/* Footer */}
        <p className="mt-4 text-center text-xs text-stone-400">
          Powered by{" "}
          <a
            href="https://github.com/KittenML/KittenTTS"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 transition-colors hover:text-stone-600"
          >
            KittenTTS
          </a>
        </p>
      </div>
    </div>
  );
}
