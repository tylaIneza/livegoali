"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Hls from "hls.js";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  Settings, Wifi, WifiOff, RefreshCw, AlertCircle,
  ChevronDown, Check
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

/** Returns true if URL is a direct media stream (not a webpage) */
function isDirectStream(url: string): boolean {
  try {
    const u = new URL(url);
    const path = u.pathname.toLowerCase();
    return (
      path.endsWith(".m3u8") ||
      path.endsWith(".mpd") ||
      path.endsWith(".mp4") ||
      path.endsWith(".webm") ||
      path.endsWith(".ts") ||
      // Common CDN stream paths
      path.includes("/hls/") ||
      path.includes("/dash/") ||
      path.includes("/live/stream") ||
      url.includes(".m3u8") ||
      url.includes(".mpd")
    );
  } catch {
    return false;
  }
}

function safePlay(video: HTMLVideoElement): void {
  if (!video || !video.isConnected) return;
  const p = video.play();
  if (p !== undefined) {
    p.catch((err: Error) => {
      if (err.name !== "AbortError") {
        console.warn("[Player] play() error:", err.message);
      }
    });
  }
}

export function LiveGoaliPlayer({
  streams,
  homeTeam,
  awayTeam,
  homeScore,
  awayScore,
  isLive = true,
  matchMinute,
}: PlayerProps) {
  // Auto-extract real stream URL from webpage links
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);
  const videoRef   = useRef<HTMLVideoElement>(null);
  const hlsRef     = useRef<Hls | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const [isPlaying,          setIsPlaying]          = useState(false);
  const [isMuted,            setIsMuted]            = useState(true); // start muted — browser autoplay policy requires muted
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

  const activeStreams = streams.filter((s) => s.isActive).sort((a, b) => a.priority - b.priority);
  const currentStream = activeStreams[currentStreamIndex];

  // Raw URL — might be a webpage; resolvedUrl is the actual stream after extraction
  const rawUrl = currentStream?.url ?? "";
  const isWebpage = rawUrl ? !isDirectStream(rawUrl) : false;
  // Effective stream URL: use resolved if available, else raw
  const effectiveUrl = resolvedUrl ?? (isWebpage ? null : rawUrl);

  const isMounted = () => mountedRef.current;

  // Auto-extract real .m3u8 from webpage links
  useEffect(() => {
    if (!rawUrl || !isWebpage) return;
    setResolvedUrl(null);
    setExtracting(true);

    fetch(`/api/stream/extract?url=${encodeURIComponent(rawUrl)}`)
      .then((r) => r.json())
      .then((data) => {
        if (!mountedRef.current) return;
        if (data.url) setResolvedUrl(data.url);
      })
      .catch(() => {})
      .finally(() => {
        if (mountedRef.current) setExtracting(false);
      });
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
    const stream = activeStreams[streamIndex];
    const video = videoRef.current;

    if (!stream) return;

    // Use override URL (resolved from webpage) or raw URL
    const urlToLoad = overrideUrl ?? stream.url;

    // If the URL doesn't look like a direct stream, bail — it's a webpage or unresolved
    if (!isDirectStream(urlToLoad)) {
      if (isMounted()) { setIsLoading(false); setError(null); }
      return;
    }

    if (!video) { if (isMounted()) setIsLoading(false); return; }

    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
    video.pause();
    video.removeAttribute("src");
    video.load();

    if (!isMounted()) return;
    setIsLoading(true);
    setError(null);
    setIsPlaying(false);

    const hlsUrl = stream.type === "HLS" || urlToLoad.includes(".m3u8");

    if (hlsUrl && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 30,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
      });
      hlsRef.current = hls;

      hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        if (!mountedRef.current) return;
        setQualityLevels(data.levels.map((l) => ({ height: l.height, bitrate: l.bitrate })));
        // Disable subtitle tracks on mobile
        if (window.matchMedia("(max-width: 767px)").matches) {
          hls.subtitleTrack = -1;
        }
        setIsLoading(false);
        setStreamHealth("good");
        safePlay(video);
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
        if (!mountedRef.current) return;
        setCurrentQuality(data.level);
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (!mountedRef.current) return;
        if (!data.fatal) return;
        if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
          setStreamHealth("poor");
          if (retryCountRef.current < 3) {
            retryCountRef.current++;
            setTimeout(() => { if (mountedRef.current) hls.startLoad(); }, 2000);
          } else {
            retryCountRef.current = 0;
            setStreamHealth("offline");
            switchToNextStream(streamIndex);
          }
        } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
          hls.recoverMediaError();
        } else {
          setError("Stream error. Switching to backup…");
          switchToNextStream(streamIndex);
        }
      });

      hls.loadSource(urlToLoad);
      hls.attachMedia(video);
    } else if (hlsUrl && video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = urlToLoad;
      video.addEventListener("loadedmetadata", () => {
        if (!mountedRef.current) return;
        setIsLoading(false);
        safePlay(video);
      }, { once: true });
    } else {
      video.src = urlToLoad;
      video.addEventListener("loadeddata", () => {
        if (!mountedRef.current) return;
        setIsLoading(false);
        safePlay(video);
      }, { once: true });
    }
  }, [activeStreams, switchToNextStream]);

  // Load stream when index changes
  useEffect(() => {
    mountedRef.current = true;
    if (activeStreams.length > 0) {
      loadStream(currentStreamIndex);
    } else {
      setIsLoading(false);
    }
    return () => {
      mountedRef.current = false;
      if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
      const video = videoRef.current;
      if (video) { video.pause(); video.removeAttribute("src"); video.load(); }
      if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStreamIndex]);

  // When extraction succeeds, load the resolved URL into the player
  useEffect(() => {
    if (resolvedUrl && activeStreams.length > 0) {
      loadStream(currentStreamIndex, resolvedUrl);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedUrl]);

  // Safety net: if loading takes more than 20 s, surface an error rather than spinning forever
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
    video.addEventListener("waiting",  onWaiting);
    video.addEventListener("playing",  onPlaying);
    video.addEventListener("pause",    onPause);
    video.addEventListener("play",     onPlay);
    video.addEventListener("error",    onError);
    video.addEventListener("stalled",  onStalled);
    return () => {
      video.removeEventListener("waiting",  onWaiting);
      video.removeEventListener("playing",  onPlaying);
      video.removeEventListener("pause",    onPause);
      video.removeEventListener("play",     onPlay);
      video.removeEventListener("error",    onError);
      video.removeEventListener("stalled",  onStalled);
    };
  // Re-run when effectiveUrl changes so listeners attach even if component initially rendered without a video element
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveUrl]);

  // Disable subtitle/caption tracks on mobile devices
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !window.matchMedia("(max-width: 767px)").matches) return;
    const disable = () => {
      for (let i = 0; i < video.textTracks.length; i++) {
        video.textTracks[i].mode = "disabled";
      }
    };
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

  const showControlsFor3s = () => {
    setShowControls(true);
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    controlsTimerRef.current = setTimeout(() => {
      if (mountedRef.current && isPlaying) setShowControls(false);
    }, 3000);
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) safePlay(video); else video.pause();
  };
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
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };
  const setQuality = (level: number) => {
    if (hlsRef.current) hlsRef.current.currentLevel = level;
    setCurrentQuality(level);
    setShowQuality(false);
  };
  const switchStream = (index: number) => {
    retryCountRef.current = 0;
    setCurrentStreamIndex(index);
    setShowSources(false);
  };
  const retry = () => {
    retryCountRef.current = 0;
    setError(null);
    loadStream(currentStreamIndex);
  };

  // ── IFRAME EMBED — site allows framing, play inline ─────────────
  if (isWebpage && !resolvedUrl) {
    return (
      <div ref={containerRef} className="relative rounded-2xl overflow-hidden aspect-video bg-black">
        {/* The iframe — fills the entire player */}
        <iframe
          src={rawUrl}
          className="absolute inset-0 w-full h-full border-0"
          allowFullScreen
          allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
          title={homeTeam && awayTeam ? `${homeTeam} vs ${awayTeam}` : "Live Stream"}
        />

        {/* Branding — non-interactive overlay */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 pointer-events-none z-10">
          <img src="/livegoali.png" alt="LiveGoali" className="w-6 h-6 object-contain" />
          <span className="text-white text-xs font-bold drop-shadow-lg">LiveGoali</span>
        </div>

        {/* Live badge */}
        {isLive && (
          <div className="absolute top-3 right-3 pointer-events-none z-10">
            <div className="flex items-center gap-1.5 bg-red-600/90 text-white text-xs font-bold px-2.5 py-1 rounded-full backdrop-blur-sm shadow-lg">
              <span className="w-1.5 h-1.5 rounded-full bg-white live-pulse" />
              LIVE {matchMinute ? `${matchMinute}'` : ""}
            </div>
          </div>
        )}

        {/* Bottom bar: source switcher + fullscreen */}
        <div className="absolute bottom-0 left-0 right-0 z-10 flex items-center justify-between px-3 py-2 bg-gradient-to-t from-black/70 to-transparent pointer-events-none">
          <div />
          <div className="flex items-center gap-2 pointer-events-auto">
            {activeStreams.length > 1 && activeStreams.map((s, i) => (
              <button
                key={s.id}
                onClick={() => switchStream(i)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                  i === currentStreamIndex
                    ? "bg-[#00FF84] text-[#0B0F14]"
                    : "bg-black/60 text-white hover:bg-white/20"
                }`}
              >
                {s.label || `S${i + 1}`}
              </button>
            ))}
            <button
              onClick={toggleFullscreen}
              className="p-1.5 rounded-lg bg-black/60 text-white hover:text-[#00FF84] hover:bg-black/80 transition-colors"
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── NATIVE VIDEO PLAYER ──────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      className="relative bg-black rounded-2xl overflow-hidden aspect-video select-none group"
      onMouseMove={showControlsFor3s}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      onClick={togglePlay}
    >
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        playsInline
        autoPlay
        muted          /* always muted in HTML attr — JS controls unmuting */
        preload="auto"
      />

      {/* Watermark */}
      <div className="absolute top-3 left-3 flex items-center gap-1.5 opacity-75 pointer-events-none z-10">
        <img src="/livegoali.png" alt="LiveGoali" className="w-6 h-6 object-contain" />
        <span className="text-white text-xs font-bold drop-shadow-lg">LiveGoali</span>
      </div>

      {/* Live badge */}
      {isLive && (
        <div className="absolute top-3 right-3 pointer-events-none z-10">
          <div className="flex items-center gap-1.5 bg-red-600/90 text-white text-xs font-bold px-2.5 py-1 rounded-full backdrop-blur-sm shadow-lg">
            <span className="w-1.5 h-1.5 rounded-full bg-white live-pulse" />
            LIVE {matchMinute ? `${matchMinute}'` : ""}
          </div>
        </div>
      )}

      {/* Team names overlay */}
      {(homeTeam || awayTeam) && (
        <div className="absolute bottom-14 left-1/2 -translate-x-1/2 pointer-events-none z-10">
          <div className="flex items-center gap-3 glass px-4 py-1.5 rounded-xl text-sm shadow-xl">
            <span className="text-white font-bold">{homeTeam}</span>
            <span className="text-[#00FF84] font-black">vs</span>
            <span className="text-white font-bold">{awayTeam}</span>
          </div>
        </div>
      )}

      {/* Unmute banner — shown while muted and playing */}
      {isMuted && isPlaying && !isLoading && !error && (
        <button
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex items-center gap-2 px-5 py-2.5 rounded-full bg-black/70 backdrop-blur-sm border border-white/20 text-white text-sm font-semibold hover:bg-black/90 transition-all"
          onClick={(e) => { e.stopPropagation(); setIsMuted(false); }}
        >
          <VolumeX className="w-4 h-4 text-white/75" />
          Click to unmute
        </button>
      )}

      {/* Loading/Buffering */}
      <AnimatePresence>
        {(isLoading || isBuffering) && !error && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-20 gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full border-2 border-[#00FF84]/30 border-t-[#00FF84] animate-spin" />
            <p className="text-white text-sm font-medium">{isLoading ? "Loading stream…" : "Buffering…"}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 z-20 gap-4 p-6 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <AlertCircle className="w-12 h-12 text-red-400" />
            <p className="text-white font-semibold">{error}</p>
            <button onClick={retry} className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#00FF84] text-[#0B0F14] font-bold text-sm hover:bg-[#00C864] transition-colors">
              <RefreshCw className="w-4 h-4" /> Retry
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* No stream */}
      {activeStreams.length === 0 && !isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0B0F14] gap-4">
          <img src="/livegoali.png" alt="LiveGoali" className="w-16 h-16 object-contain" />
          <p className="text-white font-bold text-lg">No Stream Available</p>
          <p className="text-white/70 text-sm">Stream will begin at kickoff</p>
        </div>
      )}

      {/* Controls */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-0 left-0 right-0 z-30"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-16 bg-gradient-to-t from-black/90 to-transparent pointer-events-none" />
            <div className="bg-black/70 backdrop-blur-sm px-4 py-2.5">
              <div className="flex items-center gap-3">
                <button onClick={togglePlay} className="text-white hover:text-[#00FF84] transition-colors shrink-0">
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </button>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={toggleMute} className="text-white hover:text-[#00FF84] transition-colors">
                    {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                  <input type="range" min="0" max="1" step="0.05" value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange} className="w-16 h-1 accent-[#00FF84] cursor-pointer" />
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {streamHealth === "good"
                    ? <Wifi className="w-3.5 h-3.5 text-[#00FF84]" />
                    : streamHealth === "poor"
                    ? <Wifi className="w-3.5 h-3.5 text-yellow-400" />
                    : <WifiOff className="w-3.5 h-3.5 text-red-400" />
                  }
                  <span className="text-[10px] text-white/75 hidden sm:block">
                    {streamHealth === "good" ? "HD" : streamHealth === "poor" ? "Weak" : "Offline"}
                  </span>
                </div>

                <div className="flex-1" />

                {/* Source switcher */}
                {activeStreams.length > 1 && (
                  <div className="relative">
                    <button onClick={() => { setShowSources((p) => !p); setShowQuality(false); }}
                      className="flex items-center gap-1 text-white hover:text-[#00FF84] text-xs transition-colors">
                      Src {currentStreamIndex + 1}<ChevronDown className="w-3 h-3" />
                    </button>
                    <AnimatePresence>
                      {showSources && (
                        <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
                          className="absolute bottom-full right-0 mb-2 w-36 glass rounded-xl overflow-hidden shadow-xl">
                          {activeStreams.map((s, i) => (
                            <button key={s.id} onClick={() => switchStream(i)}
                              className={`w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-white/8 transition-colors ${i === currentStreamIndex ? "text-[#00FF84]" : "text-white"}`}>
                              {s.label || `Stream ${i + 1}`}
                              {i === currentStreamIndex && <Check className="w-3 h-3" />}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Quality */}
                {qualityLevels.length > 0 && (
                  <div className="relative">
                    <button onClick={() => { setShowQuality((p) => !p); setShowSources(false); }}
                      className="flex items-center gap-1 text-white hover:text-[#00FF84] text-xs transition-colors">
                      {currentQuality === -1 ? "Auto" : `${qualityLevels[currentQuality]?.height ?? "?"}p`}
                      <ChevronDown className="w-3 h-3" />
                    </button>
                    <AnimatePresence>
                      {showQuality && (
                        <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
                          className="absolute bottom-full right-0 mb-2 w-28 glass rounded-xl overflow-hidden shadow-xl">
                          {[{ label: "Auto", level: -1 }, ...qualityLevels.map((q, i) => ({ label: `${q.height}p`, level: i }))].map(({ label, level }) => (
                            <button key={level} onClick={() => setQuality(level)}
                              className={`w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-white/8 transition-colors ${currentQuality === level ? "text-[#00FF84]" : "text-white"}`}>
                              {label}{currentQuality === level && <Check className="w-3 h-3" />}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                <button onClick={() => { setShowQuality(false); setShowSources(false); }}
                  className="text-white hover:text-[#00FF84] transition-colors" title="Settings">
                  <Settings className="w-4 h-4" />
                </button>

                <button onClick={toggleFullscreen} className="text-white hover:text-[#00FF84] transition-colors">
                  {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

