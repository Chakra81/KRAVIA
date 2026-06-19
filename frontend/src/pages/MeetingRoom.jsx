import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { liveSessionService } from '../services/liveSessionService';
import toast from 'react-hot-toast';

const POLL_INTERVAL_MS = 5000;
const JITSI_DOMAIN = 'meet.jit.si'; // Production Jitsi server — no time limits
const isHost = (role) => role === 'admin' || role === 'trainer';

// ── small UI screens ──────────────────────────────────────────────────────────
const LoadingScreen = () => (
  <div className="flex flex-col items-center justify-center h-full gap-6">
    <div className="relative w-20 h-20">
      <div className="absolute inset-0 rounded-full border-4 border-blue-500/30 animate-ping" />
      <div className="absolute inset-0 rounded-full border-4 border-t-blue-500 border-transparent animate-spin" />
    </div>
    <p className="text-white/70 text-lg font-medium animate-pulse">Connecting to live class…</p>
  </div>
);


const WaitingScreen = ({ sessionInfo, onLeave }) => (
  <div className="flex flex-col items-center justify-center h-full gap-8 px-6">
    <div className="relative">
      <div className="w-28 h-28 rounded-full bg-amber-500/10 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full border-2 border-amber-400/40 animate-ping" />
        <svg className="w-14 h-14 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" />
        </svg>
      </div>
    </div>
    <div className="text-center space-y-3 max-w-md">
      <h2 className="text-2xl font-bold text-white">Waiting for Session to Start…</h2>
      {sessionInfo?.title && (
        <p className="text-blue-300 font-medium">📚 {sessionInfo.title}</p>
      )}
      <p className="text-white/50 text-sm leading-relaxed">
        The admin/trainer has not started the session yet.<br />
        This page will automatically refresh when the class begins.
      </p>
      <div className="flex items-center justify-center gap-1.5 pt-2">
        {[0, 1, 2].map((i) => (
          <span key={i} className="w-2 h-2 rounded-full bg-blue-400"
            style={{ animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }} />
        ))}
      </div>
    </div>
    <button onClick={onLeave}
      className="mt-2 px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-all border border-white/10">
      ← Back to Sessions
    </button>
    <style>{`
      @keyframes bounce {
        0%,80%,100%{transform:translateY(0);opacity:.4}
        40%{transform:translateY(-8px);opacity:1}
      }
    `}</style>
  </div>
);

const EndedScreen = ({ onLeave }) => (
  <div className="flex flex-col items-center justify-center h-full gap-6">
    <div className="w-24 h-24 rounded-full bg-red-500/10 flex items-center justify-center">
      <svg className="w-12 h-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25V9m-3 0h12" />
      </svg>
    </div>
    <div className="text-center space-y-2">
      <h2 className="text-2xl font-bold text-white">Session Ended</h2>
      <p className="text-white/50">This live class has already ended.</p>
    </div>
    <button onClick={onLeave}
      className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-all">
      Back to Sessions
    </button>
  </div>
);

// ── main component ─────────────────────────────────────────────────────────────
const MeetingRoom = () => {
  const navigate     = useNavigate();
  const location     = useLocation();
  const { user }     = useAuth();

  const jitsiContainerRef = useRef(null);
  const jitsiApiRef       = useRef(null);
  const pollingRef        = useRef(null);
  const joinedRef         = useRef(false);

  const [uiState, setUiState]         = useState('loading');
  const [sessionInfo, setSessionInfo] = useState(null);
  const [isRecording, setIsRecording] = useState(false);

  const searchParams = new URLSearchParams(location.search);
  const sessionId    = searchParams.get('id') || '';
  const userRole     = user?.role || 'student';
  const userIsHost   = isHost(userRole);

  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);

  // ── local screen recording ──────────────────────────────────────────────────
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });
      
      let mimeType = 'video/webm;codecs=vp8,opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'video/mp4';
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = ''; // Let browser choose default
          }
        }
      }
      
      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = mediaRecorder;
      recordedChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: mimeType || 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        document.body.appendChild(a);
        a.style = 'display: none';
        a.href = url;
        const dateStr = new Date().toISOString().split('T')[0];
        const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
        a.download = `Class_Recording_${sessionInfo?.title?.replace(/[^a-zA-Z0-9]/g, '_') || 'Session'}_${dateStr}.${ext}`;
        a.click();
        window.URL.revokeObjectURL(url);
        setIsRecording(false);
      };

      // Handle user stopping screen share from browser controls
      stream.getVideoTracks()[0].onended = () => {
        if (mediaRecorder.state !== 'inactive') {
          mediaRecorder.stop();
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast.success('Recording started! Screen is being captured.');
    } catch (err) {
      console.error('Error starting recording:', err);
      toast.error('Failed to start recording. Permission denied or unsupported.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      toast.success('Recording saved to your computer!');
    }
  };

  // ── cleanup ────────────────────────────────────────────────────────────────
  const cleanup = useCallback(() => {
    if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    if (jitsiApiRef.current) {
      try { jitsiApiRef.current.dispose(); } catch (_) {}
      jitsiApiRef.current = null;
    }
  }, []);

  useEffect(() => cleanup, [cleanup]);

  const goBack = useCallback(() => { cleanup(); navigate('/live-sessions'); }, [cleanup, navigate]);

  // ── Jitsi init ─────────────────────────────────────────────────────────────
  const initJitsi = useCallback((session) => {
    if (joinedRef.current || !jitsiContainerRef.current) return;
    joinedRef.current = true;
    setUiState('joining');

    // ✅ KEY FIX: tracks whether the user ACTUALLY entered the video conference.
    // If readyToClose fires BEFORE this is true (Jitsi internal failure), we
    // must NOT call endSession() — that was causing the premature "Session Ended" state.
    let conferenceJoined = false;

    // Load Jitsi external API script dynamically
    const loadJitsi = () => {
      return new Promise((resolve, reject) => {
        if (window.JitsiMeetExternalAPI) { resolve(); return; }
        const script = document.createElement('script');
        script.src = `https://${JITSI_DOMAIN}/external_api.js`;
        script.onload = resolve;
        script.onerror = () => reject(new Error('Failed to load Jitsi API script. Please check your internet connection.'));
        document.head.appendChild(script);
      });
    };

    loadJitsi().then(() => {
      if (!window.JitsiMeetExternalAPI || !jitsiContainerRef.current) {
        toast.error('Could not initialize video call. Please retry.');
        setUiState('error');
        joinedRef.current = false;
        return;
      }

      const safeTitle = (session?.title || 'Session').replace(/[^a-zA-Z0-9]/g, '');
      const roomName = `${safeTitle}-${session?.id || sessionId}`;
      const displayName = user?.name || user?.username || user?.email || 'Student';

      try {
        const api = new window.JitsiMeetExternalAPI(JITSI_DOMAIN, {
          roomName,
          parentNode: jitsiContainerRef.current,
          width: '100%',
          height: '100%',
          userInfo: {
            displayName,
            email: user?.email || '',
          },
          configOverwrite: {
            startWithAudioMuted: true,
            startWithVideoMuted: true,
            disableDeepLinking: true,
            prejoinPageEnabled: false,
            enableWelcomePage: false,
          },
        });

        jitsiApiRef.current = api;

        api.addEventListener('videoConferenceJoined', () => {
          // ✅ User is now actually inside the video room
          conferenceJoined = true;
          setUiState('joined');
          if (session?.title) {
            api.executeCommand('subject', session.title);
          }
          liveSessionService.joinSession(sessionId).catch(() => {});
        });

        api.addEventListener('readyToClose', async () => {
          if (!conferenceJoined) {
            // ⚠️ readyToClose fired BEFORE videoConferenceJoined — Jitsi failed
            // to connect (network error, permissions denied, etc.).
            // Do NOT end the session here — show error and let user retry.
            toast.error('Could not connect to the video room. Please retry.');
            setUiState('error');
            joinedRef.current = false;
            cleanup();
            return;
          }

          // Normal exit: user was inside the room and clicked hang-up.
          // ✅ IMPORTANT: Do NOT call endSession() here automatically.
          // The session stays "live" on the backend so other students remain
          // unaffected if the host's Jitsi connection drops or times out.
          // The host must explicitly click "End Session" from the Live Sessions
          // page to close the class for everyone.
          try { await liveSessionService.leaveSession(sessionId); } catch (_) {}
          toast.success('You left the meeting room. Use "End Session" on the sessions page to close the class.');
          cleanup();
          navigate('/live-sessions');
        });

      } catch (err) {
        console.error('Jitsi init error:', err);
        toast.error('Failed to start video call: ' + (err.message || 'Unknown error'));
        setUiState('error');
        joinedRef.current = false;
      }
    }).catch((err) => {
      console.error('Jitsi load error:', err);
      toast.error(err.message || 'Failed to load video conferencing library.');
      setUiState('error');
      joinedRef.current = false;
    });
  }, [sessionId, user, userIsHost, navigate, cleanup]);

  // ── student polling ────────────────────────────────────────────────────────
  const startPolling = useCallback((session) => {
    setSessionInfo(session);
    setUiState('waiting');

    pollingRef.current = setInterval(async () => {
      try {
        const rs = await liveSessionService.getRoomStatus(sessionId);
        if (rs.status === 'live') {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
          initJitsi(rs);
        } else if (rs.status === 'ended') {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
          setUiState('ended');
        }
      } catch (_) { /* network hiccup — keep polling */ }
    }, POLL_INTERVAL_MS);
  }, [sessionId, initJitsi]);

  // ── boot ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user || !sessionId) {
      setUiState('error');
      return;
    }

    (async () => {
      try {
        const session = await liveSessionService.getSessionDetails(sessionId);
        setSessionInfo(session);

        if (userIsHost) {
          // Admin/trainer: go straight into the room and mark it live
          try { await liveSessionService.startSession(sessionId); } catch (_) {}
          initJitsi(session);
        } else {
          if (session.status === 'live')    initJitsi(session);
          else if (session.status === 'ended') setUiState('ended');
          else startPolling(session);
        }
      } catch (err) {
        console.error(err);
        setUiState('error');
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div className="w-screen h-screen bg-[#060b18] overflow-hidden relative">
      {/* Jitsi iframe container — visible only when joining or joined */}
      <div
        ref={jitsiContainerRef}
        className="w-full h-full relative z-10"
        style={{ display: uiState === 'joined' || uiState === 'joining' ? 'block' : 'none' }}
      />

      {/* Floating Host Controls (Local Recording) */}
      {userIsHost && uiState === 'joined' && (
        <div className="absolute top-4 right-4 z-50 flex gap-3">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm shadow-lg backdrop-blur-md transition-all ${
              isRecording 
                ? 'bg-red-500/90 hover:bg-red-600 text-white animate-pulse shadow-red-500/30 border border-red-400' 
                : 'bg-[#1a1f33]/80 hover:bg-[#252a40]/90 text-white border border-[#303650] shadow-xl'
            }`}
          >
            {isRecording ? (
              <>
                <div className="w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                Stop Recording
              </>
            ) : (
              <>
                <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="8" />
                </svg>
                Record Class
              </>
            )}
          </button>
        </div>
      )}

      {/* Overlay screens for all other states */}
      {uiState !== 'joined' && (
        <div className="absolute inset-0 flex flex-col pointer-events-none">
          {uiState === 'loading'  && <LoadingScreen />}
          {uiState === 'waiting'  && <div className="pointer-events-auto h-full"><WaitingScreen sessionInfo={sessionInfo} onLeave={goBack} /></div>}
          {uiState === 'ended'    && <div className="pointer-events-auto h-full"><EndedScreen onLeave={goBack} /></div>}
          {uiState === 'error'    && (
            <div className="flex flex-col items-center justify-center h-full gap-6 px-6 pointer-events-auto">
              <div className="w-24 h-24 rounded-full bg-rose-500/10 flex items-center justify-center">
                <svg className="w-12 h-12 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
              </div>
              <div className="text-center space-y-2 max-w-sm">
                <h2 className="text-2xl font-bold text-white">Could not load session</h2>
                <p className="text-white/50 text-sm">Please check your internet connection and try again.</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => window.location.reload()}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-all">
                  Retry
                </button>
                <button onClick={goBack}
                  className="px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm transition-all border border-white/10">
                  Leave
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MeetingRoom;
