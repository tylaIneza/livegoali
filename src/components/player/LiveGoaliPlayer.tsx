"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Hls from "hls.js";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  Wifi, WifiOff, RefreshCw, AlertCircle, ChevronDown, Check,
} from "lucide-react";
import type { StreamSourceData } from "@/types";

interface PlayerProps {
  streams: StreamSourceData[];
  matchTitle?: string;
  homeTeam?: string;
  awayTeam?: string;
  homeScore?: number;
  awayScore?: number;
  isLive?: boolean;
  matchMinute?: number | null;
}

type StreamHealth = "good" | "poor" | "offline";

function isDirectStream(url: string): boolean {
  try {
    const u = new URL(url);
    const path = u.pathname.toLowerCase();
    return (
      path.endsWith(".m3u8") || path.endsWith(".mpd") ||
      path.endsWith(".mp4") || path.endsWith(".webm") ||
      path.endsWith(".ts") || path.includes("/hls/") ||
      path.includes("/dash/") || path.includes("/live/stream") ||
      url.includes(".m3u8") || url.includes(".mpd")
    );
  } catch { return false; }
}

function safePlay(video: HTMLVideoElement): void {
  if (!video || !video.isConnected) return;
  const p = video.play();
  if (p !== undefined) {
    p.catch((err: Error) => {
      if (err.name !== "AbortError") console.warn("[Player] play() error:", err.message);
    });
  }
}

export function LiveGoaliPlayer({
  streams,
  matchTitle,
  homeTeam,
  awayTeam,
  homeScore,
  awayScore,
  isLive = true,
  matchMinute,
}: PlayerProps) {
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);
  const videoRef       = useRef<HTMLVideoElement>(null);
  const hlsRef         = useRef<Hls | null>(null);
  const containerRef   = useRef<HTMLDivElement>(null);
  const controlsTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef     = useRef(true);

  const [isPlaying,          setIsPlaying]          = useState(false);
  const [isMuted,            setIsMuted]            = useState(true);
  const [volume,             setVolume]             = useState(1);
  const [isFullscreen,       setIsFullscreen]       = useState(false);
  const [showControls,       setShowControls]       = useState(true);
  const [showQuality,        setShowQuality]        = useState(false);
  const [showSources,        setShowSources]        = useState(false);
  const [currentStreamIndex, setCurrentStreamIndex] = useState(0);
  const [streamHealth,       setStreamHealth]       = useState<StreamHealth>("good");
  const [isBuffering,        setIsBuffering]        = useState(false);
  const [isLoading,          setIsLoading]          = useState(true);
  const [error,              setError]              = useState<string | null>(null);
  const [qualityLevels,      setQualityLevels]      = useState<Array<{ height: number; bitrate: number }>>([]);
  const [currentQuality,     setCurrentQuality]     = useState(-1);
  const retryCountRef = useRef(0);
  const justShowedControlsRef = useRef(false);

  const activeStreams  = streams.filter((s) => s.isActive).sort((a, b) => a.priority - b.priority);
  const currentStream  = activeStreams[currentStreamIndex];
  const rawUrl         = currentStream?.url ?? "";
  const isWebpage      = rawUrl ? !isDirectStream(rawUrl) : false;
  const effectiveUrl   = resolvedUrl ?? (isWebpage ? null : rawUrl);
  const isMounted      = () => mountedRef.current;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _extracting = extracting; // keep linter happy — used indirectly via setExtracting

  useEffect(() => {
    if (!rawUrl || !isWebpage) return;
    setResolvedUrl(null);
    setExtracting(true);
    fetch(`/api/stream/extract?url=${encodeURIComponent(rawUrl)}`)
      .then((r) => r.json())
      .then((data) => { if (mountedRef.current && data.url) setResolvedUrl(data.url); })
      .catch(() => {})
      .finally(() => { if (mountedRef.current) setExtracting(false); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawUrl]);

  const switchToNextStream = useCallback((currentIndex: number) => {
    if (!isMounted()) return;
    const next = currentIndex + 1;
    if (next < activeStreams.length) {
      retryCountRef.current = 0;
      setCurrentStreamIndex(next);
    } else {
      setError("All streams unavailable. Please try again later.");
      setStreamHealth("offline");
    }
  }, [activeStreams.length]);

  const loadStream = useCallback((streamIndex: number, overrideUrl?: string) => {
    const stream   = activeStreams[streamIndex];
    const video    = videoRef.current;
    if (!stream) return;
    const urlToLoad = overrideUrl ?? stream.url;
    if (!isDirectStream(urlToLoad)) {
      if (isMounted()) { setIsLoading(false); setError(null); }
      return;
    }
    if (!video) { if (isMounted()) setIsLoading(false); return; }
    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
    video.pause(); video.removeAttribute("src"); video.load();
    if (!isMounted()) return;
    setIsLoading(true); setError(null); setIsPlaying(false);
    const hlsUrl = stream.type === "HLS" || urlToLoad.includes(".m3u8");
    if (hlsUrl && Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true, lowLatencyMode: true, backBufferLength: 30, maxBufferLength: 30, maxMaxBufferLength: 60 });
      hlsRef.current = hls;
      hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        if (!mountedRef.current) return;
        setQualityLevels(data.levels.map((l) => ({ height: l.height, bitrate: l.bitrate })));
        if (window.matchMedia("(max-width: 767px)").matches) hls.subtitleTrack = -1;
        setIsLoading(false); setStreamHealth("good"); safePlay(video);
      });
      hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => { if (mountedRef.current) setCurrentQuality(data.level); });
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (!mountedRef.current || !data.fatal) return;
        if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
          setStreamHealth("poor");
          if (retryCountRef.current < 3) { retryCountRef.current++; setTimeout(() => { if (mountedRef.current) hls.startLoad(); }, 2000); }
          else { retryCountRef.current = 0; setStreamHealth("offline"); switchToNextStream(streamIndex); }
        } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) { hls.recoverMediaError(); }
        else { setError("Stream error. Switching to backup…"); switchToNextStream(streamIndex); }
      });
      hls.loadSource(urlToLoad); hls.attachMedia(video);
    } else if (hlsUrl && video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = urlToLoad;
      video.addEventListener("loadedmetadata", () => { if (!mountedRef.current) return; setIsLoading(false); safePlay(video); }, { once: true });
    } else {
      video.src = urlToLoad;
      video.addEventListener("loadeddata", () => { if (!mountedRef.current) return; setIsLoading(false); safePlay(video); }, { once: true });
    }
  }, [activeStreams, switchToNextStream]);

  useEffect(() => {
    mountedRef.current = true;
    if (activeStreams.length > 0) loadStream(currentStreamIndex);
    else setIsLoading(false);
    return () => {
      mountedRef.current = false;
      if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
      const video = videoRef.current;
      if (video) { video.pause(); video.removeAttribute("src"); video.load(); }
      if (controlsTimer.current) clearTimeout(controlsTimer.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStreamIndex]);

  useEffect(() => {
    if (resolvedUrl && activeStreams.length > 0) loadStream(currentStreamIndex, resolvedUrl);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedUrl]);

  useEffect(() => {
    if (!isLoading) return;
    const t = setTimeout(() => {
      if (!mountedRef.current) return;
      setIsLoading(false);
      setError("Stream is taking too long to load. Check the stream URL or try another source.");
    }, 20000);
    return () => clearTimeout(t);
  }, [isLoading]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onWaiting  = () => { if (mountedRef.current) setIsBuffering(true); };
    const onPlaying  = () => { if (mountedRef.current) { setIsBuffering(false); setIsLoading(false); setIsPlaying(true); } };
    const onPause    = () => { if (mountedRef.current) setIsPlaying(false); };
    const onPlay     = () => { if (mountedRef.current) setIsPlaying(true); };
    const onError    = () => { if (mountedRef.current) setError("Video playback error"); };
    const onStalled  = () => { if (mountedRef.current) setIsBuffering(true); };
    video.addEventListener("waiting", onWaiting); video.addEventListener("playing", onPlaying);
    video.addEventListener("pause",   onPause);   video.addEventListener("play",    onPlay);
    video.addEventListener("error",   onError);   video.addEventListener("stalled", onStalled);
    return () => {
      video.removeEventListener("waiting", onWaiting); video.removeEventListener("playing", onPlaying);
      video.removeEventListener("pause",   onPause);   video.removeEventListener("play",    onPlay);
      video.removeEventListener("error",   onError);   video.removeEventListener("stalled", onStalled);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveUrl]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !window.matchMedia("(max-width: 767px)").matches) return;
    const disable = () => { for (let i = 0; i < video.textTracks.length; i++) video.textTracks[i].mode = "disabled"; };
    disable();
    video.textTracks.addEventListener("addtrack", disable);
    return () => video.textTracks.removeEventListener("addtrack", disable);
  }, [effectiveUrl]);

  useEffect(() => {
    const onChange = () => { if (mountedRef.current) setIsFullscreen(!!document.fullscreenElement); };
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === "INPUT") return;
      switch (e.key) {
        case " ": e.preventDefault(); togglePlay(); break;
        case "m": case "M": toggleMute(); break;
        case "f": case "F": toggleFullscreen(); break;
        case "ArrowUp":   e.preventDefault(); setVolume((v) => Math.min(1, parseFloat((v + 0.1).toFixed(1)))); break;
        case "ArrowDown": e.preventDefault(); setVolume((v) => Math.max(0, parseFloat((v - 0.1).toFixed(1)))); break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = volume;
    video.muted  = isMuted || volume === 0;
  }, [volume, isMuted]);

  const showControlsFor3s = useCallback(() => {
    setShowControls(true);
    if (controlsTimer.current) clearTimeout(controlsTimer.current);
    controlsTimer.current = setTimeout(() => {
      if (mountedRef.current && isPlaying) setShowControls(false);
    }, 3000);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) safePlay(video); else video.pause();
  };

  const handleContainerTouchStart = useCallback(() => {
    if (!showControls) {
      showControlsFor3s();
      justShowedControlsRef.current = true;
    } else {
      showControlsFor3s();
      justShowedControlsRef.current = false;
    }
  }, [showControls, showControlsFor3s]);

  const handleContainerClick = useCallback(() => {
    if (justShowedControlsRef.current) {
      justShowedControlsRef.current = false;
      return;
    }
    togglePlay();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    setIsMuted(v === 0);
  };
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) containerRef.current.requestFullscreen().catch(() => {});
    else document.exitFullscreen().catch(() => {});
  };
  const setQuality = (level: number) => {
    if (hlsRef.current) hlsRef.current.currentLevel = level;
    setCurrentQuality(level); setShowQuality(false);
  };
  const switchStream = (index: number) => {
    retryCountRef.current = 0;
    setCurrentStreamIndex(index); setShowSources(false);
  };
  const retry = () => {
    retryCountRef.current = 0;
    setError(null); loadStream(currentStreamIndex);
  };

  const hasMatchInfo = !!(homeTeam || awayTeam || matchTitle);
  const displayTitle = matchTitle ?? (homeTeam && awayTeam ? `${homeTeam} vs ${awayTeam}` : homeTeam ?? awayTeam ?? "Live Event");
  const showScore    = homeScore !== undefined && awayScore !== undefined;
  const qualityLabel = currentQuality === -1 ? "Auto" : `${qualityLevels[currentQuality]?.height ?? "?"}p`;

  // ── Shared: watermark ──────────────────────────────────────────────
  const Watermark = () => (
    <div className="absolute top-13 right-4 pointer-events-none z-20">
      <div className="flex items-center gap-2.5 bg-black/30 backdrop-blur-md border border-white/10 rounded-2xl px-3.5 py-2 shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
        <img
          src="/livegoali.png"
          alt="LiveGoali"
          className="w-9 h-9 object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
        />
        <div className="flex flex-col leading-none">
          <span
            className="text-white font-black text-sm tracking-widest uppercase"
            style={{ textShadow: "0 1px 8px rgba(0,0,0,0.9)" }}
          >
            LiveGoali
          </span>
          <span className="text-[#00FF84]/70 text-[9px] font-bold tracking-[0.2em] uppercase mt-0.5">
            Live Streaming
          </span>
        </div>
      </div>
    </div>
  );

  // ── Shared: LIVE indicator dot ─────────────────────────────────────
  const LiveDot = () => (
    <span className="inline-flex items-center gap-1 bg-red-500/20 border border-red-500/30 text-red-400 text-[10px] font-black tracking-wider px-2 py-0.5 rounded-full">
      <span className="w-1.5 h-1.5 rounded-full bg-red-500 live-pulse shrink-0" />
      LIVE
    </span>
  );

  // ── IFRAME EMBED ────────────────────────────────────────────────────
  if (isWebpage && !resolvedUrl) {
    return (
      <div ref={containerRef} className="relative rounded-2xl overflow-hidden aspect-video bg-[#080C10] group">
        <iframe
          src={rawUrl}
          className="absolute inset-0 w-full h-full border-0"
          allowFullScreen
          allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
          title={displayTitle}
        />

        {/* Top gradient */}
        <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/60 to-transparent pointer-events-none z-10" />

        {/* Bottom gradient + controls */}
        <div className="absolute inset-x-0 bottom-0 z-20" style={{ pointerEvents: "auto" }}>
          <div className="h-20 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
          <div className="bg-black/70 backdrop-blur-md px-4 py-2.5 flex items-center justify-between gap-3">
            {/* Match info */}
            <div className="flex items-center gap-2 min-w-0">
              {isLive && <LiveDot />}
              {hasMatchInfo && (
                <span className="text-white/70 text-xs font-medium truncate hidden sm:block">
                  {displayTitle}
                </span>
              )}
            </div>

            {/* Source tabs + fullscreen */}
            <div className="flex items-center gap-2 shrink-0">
              {activeStreams.length > 1 && activeStreams.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => switchStream(i)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                    i === currentStreamIndex
                      ? "bg-[#00FF84] text-black shadow-[0_0_12px_rgba(0,255,132,0.4)]"
                      : "bg-white/10 text-white/80 hover:bg-white/20"
                  }`}
                >
                  {s.label || `S${i + 1}`}
                </button>
              ))}
              <button
                onClick={toggleFullscreen}
                className="p-1.5 rounded-lg bg-white/10 text-white/80 hover:bg-white/20 hover:text-white transition-all"
              >
                {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        <Watermark />
      </div>
    );
  }

  // ── NATIVE VIDEO PLAYER ─────────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      className="relative bg-[#080C10] rounded-2xl overflow-hidden aspect-video select-none"
      onMouseMove={showControlsFor3s}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      onTouchStart={handleContainerTouchStart}
      onClick={handleContainerClick}
      style={{ cursor: isPlaying && !showControls ? "none" : "default" }}
    >
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        playsInline autoPlay muted preload="auto"
      />

      {/* Persistent bottom vignette */}
      <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/70 to-transparent pointer-events-none z-10" />
      {/* Persistent top vignette */}
      <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/50 to-transparent pointer-events-none z-10" />

      {/* Watermark */}
      <Watermark />

      {/* Score / match info overlay — fades with controls */}
      <AnimatePresence>
        {showControls && hasMatchInfo && (
          <motion.div
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-[60px] left-4 z-20 pointer-events-none"
          >
            <div className="flex items-center gap-2.5 bg-black/70 backdrop-blur-md border border-white/10 rounded-2xl px-3.5 py-2 shadow-2xl max-w-[90vw]">
              {showScore ? (
                <>
                  <span className="text-white/90 font-bold text-sm leading-none truncate max-w-[100px]">{homeTeam}</span>
                  <span className="text-[#00FF84] font-black text-xl tabular-nums leading-none shrink-0">
                    {homeScore} <span className="text-white/30 mx-0.5">–</span> {awayScore}
                  </span>
                  <span className="text-white/90 font-bold text-sm leading-none truncate max-w-[100px]">{awayTeam}</span>
                </>
              ) : (
                <span className="text-white/90 font-semibold text-sm leading-none truncate">{displayTitle}</span>
              )}
              {isLive && (
                <span className="inline-flex items-center gap-1 bg-red-500/20 border border-red-500/30 text-red-400 text-[10px] font-black tracking-wider px-2 py-0.5 rounded-full shrink-0 ml-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 live-pulse" />
                  LIVE
                  {matchMinute != null && <span className="ml-0.5 text-red-300">{matchMinute}&apos;</span>}
                </span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Center play button — when paused */}
      <AnimatePresence>
        {!isPlaying && !isLoading && !error && activeStreams.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none"
          >
            <div className="w-16 h-16 rounded-full bg-white/15 backdrop-blur-sm border border-white/25 flex items-center justify-center shadow-[0_0_40px_rgba(255,255,255,0.15)]">
              <Play className="w-7 h-7 text-white fill-white ml-1" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Unmute banner */}
      <AnimatePresence>
        {isMuted && isPlaying && !isLoading && !error && (
          <motion.button
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="absolute top-14 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-4 py-2 rounded-full bg-black/80 backdrop-blur-md border border-white/15 text-white text-xs font-semibold hover:bg-black/95 hover:border-[#00FF84]/40 transition-all shadow-xl"
            onClick={(e) => { e.stopPropagation(); setIsMuted(false); }}
          >
            <VolumeX className="w-3.5 h-3.5 text-white/70" />
            Tap to unmute
          </motion.button>
        )}
      </AnimatePresence>

      {/* Loading / Buffering */}
      <AnimatePresence>
        {(isLoading || isBuffering) && !error && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-[#080C10]/90 z-20 gap-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Spinner */}
            <div className="relative w-14 h-14">
              <div className="absolute inset-0 rounded-full border-2 border-white/8" />
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#00FF84] animate-spin" />
              <div className="absolute inset-2 rounded-full border border-transparent border-t-[#00FF84]/30 animate-spin" style={{ animationDuration: "1.5s", animationDirection: "reverse" }} />
            </div>
            <div className="text-center">
              <p className="text-white font-semibold text-sm">{isLoading ? "Loading stream…" : "Buffering…"}</p>
              {hasMatchInfo && (
                <p className="text-white/40 text-xs mt-1 truncate max-w-xs">{displayTitle}</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-[#080C10]/95 z-20 gap-4 p-6 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <AlertCircle className="w-7 h-7 text-red-400" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm mb-1">{error}</p>
              <p className="text-white/40 text-xs">Check your connection or try another source</p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); retry(); }}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#00FF84] text-black font-bold text-sm hover:bg-[#00E876] active:scale-95 transition-all shadow-[0_0_20px_rgba(0,255,132,0.3)]"
            >
              <RefreshCw className="w-4 h-4" /> Retry
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* No stream placeholder */}
      {activeStreams.length === 0 && !isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#080C10] z-20 gap-5">
          {/* Background grid pattern */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: "repeating-linear-gradient(0deg, #fff 0, #fff 1px, transparent 1px, transparent 40px), repeating-linear-gradient(90deg, #fff 0, #fff 1px, transparent 1px, transparent 40px)"
          }} />
          <div className="relative flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-3xl bg-[#00FF84]/8 border border-[#00FF84]/15 flex items-center justify-center">
                <img src="/livegoali.png" alt="LiveGoali" className="w-11 h-11 object-contain opacity-70" />
              </div>
              <div className="absolute -inset-3 rounded-full bg-[#00FF84]/5 animate-ping" style={{ animationDuration: "3s" }} />
            </div>
            <div className="text-center">
              <p className="text-white font-bold text-base mb-1">
                {isLive ? "Stream Starting Soon" : "No Stream Available"}
              </p>
              <p className="text-white/40 text-xs max-w-xs">
                {isLive
                  ? "The broadcast will begin shortly. Stay tuned."
                  : "The stream will appear here when the event starts."}
              </p>
            </div>
            {hasMatchInfo && (
              <div className="flex items-center gap-2 bg-white/5 border border-white/8 rounded-xl px-4 py-2">
                {isLive && <LiveDot />}
                <span className="text-white/60 text-xs font-medium">{displayTitle}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Controls bar ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="absolute bottom-0 left-0 right-0 z-30"
            onClick={(e) => e.stopPropagation()}
          >
            {/* LIVE progress line */}
            {isLive && (
              <div className="h-0.5 bg-gradient-to-r from-transparent via-red-500/70 to-transparent" />
            )}

            <div className="bg-black/80 backdrop-blur-md px-4 py-3">
              <div className="flex items-center gap-2 sm:gap-3">

                {/* Play / Pause */}
                <button
                  onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                  className="w-8 h-8 flex items-center justify-center text-white hover:text-[#00FF84] transition-colors shrink-0"
                >
                  {isPlaying
                    ? <Pause className="w-5 h-5 fill-current" />
                    : <Play className="w-5 h-5 fill-current ml-0.5" />}
                </button>

                {/* Volume */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleMute(); }}
                    className="text-white/80 hover:text-[#00FF84] transition-colors"
                  >
                    {isMuted || volume === 0
                      ? <VolumeX className="w-4 h-4" />
                      : <Volume2 className="w-4 h-4" />}
                  </button>
                  <input
                    type="range" min="0" max="1" step="0.05"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    onClick={(e) => e.stopPropagation()}
                    className="hidden sm:block w-20 h-1 rounded-full cursor-pointer accent-[#00FF84] opacity-80 hover:opacity-100 transition-opacity"
                  />
                </div>

                {/* LIVE badge */}
                {isLive && (
                  <span className="hidden sm:inline-flex items-center gap-1 bg-red-500/15 border border-red-500/25 text-red-400 text-[10px] font-black tracking-wider px-2 py-0.5 rounded-full shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 live-pulse" />
                    LIVE
                  </span>
                )}

                {/* Stream health */}
                <div className="hidden sm:flex items-center gap-1.5 shrink-0">
                  {streamHealth === "good"
                    ? <Wifi className="w-3.5 h-3.5 text-[#00FF84]" />
                    : streamHealth === "poor"
                    ? <Wifi className="w-3.5 h-3.5 text-yellow-400 animate-pulse" />
                    : <WifiOff className="w-3.5 h-3.5 text-red-400" />}
                  <span className="text-[10px] text-white/50 font-medium">
                    {streamHealth === "good" ? "HD" : streamHealth === "poor" ? "Weak" : "No signal"}
                  </span>
                </div>

                {/* Spacer */}
                <div className="flex-1" />

                {/* Source switcher */}
                {activeStreams.length > 1 && (
                  <div className="relative">
                    <button
                      onClick={(e) => { e.stopPropagation(); setShowSources((p) => !p); setShowQuality(false); }}
                      className="flex items-center gap-1 text-white/75 hover:text-white text-xs font-semibold transition-colors bg-white/8 hover:bg-white/14 px-2.5 py-1 rounded-lg border border-white/8"
                    >
                      Src {currentStreamIndex + 1}
                      <ChevronDown className="w-3 h-3" />
                    </button>
                    <AnimatePresence>
                      {showSources && (
                        <motion.div
                          initial={{ opacity: 0, y: 6, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 6, scale: 0.95 }}
                          transition={{ duration: 0.12 }}
                          className="absolute bottom-full right-0 mb-2 w-40 bg-[#0D1117]/95 backdrop-blur-xl border border-white/12 rounded-xl overflow-hidden shadow-2xl"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="px-3 py-2 border-b border-white/8">
                            <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Sources</span>
                          </div>
                          {activeStreams.map((s, i) => (
                            <button key={s.id} onClick={() => switchStream(i)}
                              className={`w-full flex items-center justify-between px-3 py-2.5 text-xs hover:bg-white/8 transition-colors ${i === currentStreamIndex ? "text-[#00FF84]" : "text-white/80"}`}>
                              <span>{s.label || `Stream ${i + 1}`}</span>
                              {i === currentStreamIndex && <Check className="w-3 h-3" />}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Quality selector */}
                {qualityLevels.length > 0 && (
                  <div className="relative">
                    <button
                      onClick={(e) => { e.stopPropagation(); setShowQuality((p) => !p); setShowSources(false); }}
                      className="flex items-center gap-1 text-white/75 hover:text-white text-xs font-semibold transition-colors bg-white/8 hover:bg-white/14 px-2.5 py-1 rounded-lg border border-white/8"
                    >
                      {qualityLabel}
                      <ChevronDown className="w-3 h-3" />
                    </button>
                    <AnimatePresence>
                      {showQuality && (
                        <motion.div
                          initial={{ opacity: 0, y: 6, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 6, scale: 0.95 }}
                          transition={{ duration: 0.12 }}
                          className="absolute bottom-full right-0 mb-2 w-32 bg-[#0D1117]/95 backdrop-blur-xl border border-white/12 rounded-xl overflow-hidden shadow-2xl"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="px-3 py-2 border-b border-white/8">
                            <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Quality</span>
                          </div>
                          {[{ label: "Auto", level: -1 }, ...qualityLevels.map((q, i) => ({ label: `${q.height}p`, level: i }))].map(({ label, level }) => (
                            <button key={level} onClick={() => setQuality(level)}
                              className={`w-full flex items-center justify-between px-3 py-2.5 text-xs hover:bg-white/8 transition-colors ${currentQuality === level ? "text-[#00FF84]" : "text-white/80"}`}>
                              <span>{label}</span>
                              {currentQuality === level && <Check className="w-3 h-3" />}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Fullscreen */}
                <button
                  onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }}
                  className="text-white/75 hover:text-white transition-colors"
                >
                  {isFullscreen ? <Minimize className="w-4.5 h-4.5" /> : <Maximize className="w-4.5 h-4.5" />}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
