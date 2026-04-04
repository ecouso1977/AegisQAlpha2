import { useState, useEffect, useRef, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { getColorForUser } from "../components/ide/CollabBar";

function genSessionId() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export function useCollabSession({ activeFile, onContentChange, currentUser }) {
  const [sessionId, setSessionId] = useState(null);
  const [sessionRecord, setSessionRecord] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [remoteCursors, setRemoteCursors] = useState([]);
  const unsubRef = useRef(null);
  const localEditRef = useRef(false); // prevent echo
  const heartbeatRef = useRef(null);

  const userEmail = currentUser?.email || "anonymous@user.com";
  const userName = currentUser?.full_name || userEmail.split("@")[0];

  const leave = useCallback(async () => {
    clearInterval(heartbeatRef.current);
    if (unsubRef.current) { unsubRef.current(); unsubRef.current = null; }
    // Remove self from participants + cursors
    if (sessionRecord) {
      const updated = {
        participants: (sessionRecord.participants || []).filter((p) => p !== userEmail),
        cursors: (sessionRecord.cursors || []).filter((c) => c.user_email !== userEmail),
      };
      await base44.entities.CollabSession.update(sessionRecord.id, updated).catch(() => {});
    }
    setIsConnected(false);
    setSessionId(null);
    setSessionRecord(null);
    setParticipants([]);
    setRemoteCursors([]);
  }, [sessionRecord, userEmail]);

  const join = useCallback(async (id) => {
    const sid = id || genSessionId();
    setSessionId(sid);

    // Find or create session
    let records = await base44.entities.CollabSession.filter({ session_id: sid });
    let record;
    if (records.length > 0) {
      record = records[0];
    } else {
      record = await base44.entities.CollabSession.create({
        session_id: sid,
        file_name: activeFile?.name || "untitled.py",
        content: activeFile?.content || "",
        cursors: [],
        participants: [],
      });
    }

    // Add self to participants
    const newParticipants = [...new Set([...(record.participants || []), userEmail])];
    record = await base44.entities.CollabSession.update(record.id, { participants: newParticipants });
    setSessionRecord(record);
    setParticipants(newParticipants);
    setIsConnected(true);

    // If joining existing session, load its content
    if (records.length > 0 && record.content) {
      onContentChange(record.content, true); // true = remote
    }

    // Subscribe to changes
    unsubRef.current = base44.entities.CollabSession.subscribe((event) => {
      if (event.data?.session_id !== sid) return;
      const data = event.data;
      setSessionRecord(data);
      setParticipants(data.participants || []);

      // Update remote cursors (exclude self)
      const remote = (data.cursors || []).filter(
        (c) => c.user_email !== userEmail && Date.now() - c.last_seen < 10000
      );
      setRemoteCursors(remote);

      // Apply remote content change
      if (!localEditRef.current && data.content !== undefined) {
        onContentChange(data.content, true);
      }
    });

    // Heartbeat: keep participant alive
    heartbeatRef.current = setInterval(async () => {
      const fresh = await base44.entities.CollabSession.filter({ session_id: sid });
      if (fresh[0]) {
        const alive = [...new Set([...(fresh[0].participants || []), userEmail])];
        // Prune stale cursors (>10s)
        const aliveCursors = (fresh[0].cursors || []).filter((c) => Date.now() - c.last_seen < 10000);
        await base44.entities.CollabSession.update(fresh[0].id, { participants: alive, cursors: aliveCursors });
      }
    }, 8000);

    return sid;
  }, [activeFile, userEmail, onContentChange]);

  const pushContent = useCallback(async (content) => {
    if (!sessionRecord || !isConnected) return;
    localEditRef.current = true;
    await base44.entities.CollabSession.update(sessionRecord.id, { content });
    setTimeout(() => { localEditRef.current = false; }, 200);
  }, [sessionRecord, isConnected]);

  const pushCursor = useCallback(async (line, col) => {
    if (!sessionRecord || !isConnected) return;
    const fresh = await base44.entities.CollabSession.filter({ session_id: sessionId });
    if (!fresh[0]) return;
    const cursors = (fresh[0].cursors || []).filter((c) => c.user_email !== userEmail);
    cursors.push({
      user_email: userEmail,
      user_name: userName,
      color: getColorForUser(userEmail),
      line,
      col,
      last_seen: Date.now(),
    });
    await base44.entities.CollabSession.update(fresh[0].id, { cursors });
  }, [sessionRecord, sessionId, isConnected, userEmail, userName]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearInterval(heartbeatRef.current);
      if (unsubRef.current) unsubRef.current();
    };
  }, []);

  return { sessionId, isConnected, participants, remoteCursors, join, leave, pushContent, pushCursor };
}