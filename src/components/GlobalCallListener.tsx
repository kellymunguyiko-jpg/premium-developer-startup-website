import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  acceptCall,
  declineCall,
  listenIncomingCalls,
  type CallInvite,
} from "../services/calls";
import { IncomingCallModal } from "./IncomingCallModal";
import { VideoCallModal } from "./VideoCallModal";

/**
 * Mount once near app root (when logged in).
 * Shows incoming ring UI and joins Agora when accepted.
 */
export function GlobalCallListener() {
  const { profile } = useAuth();
  const [incoming, setIncoming] = useState<CallInvite | null>(null);
  const [activeCall, setActiveCall] = useState<{
    channel: string;
    isCaller: boolean;
    peer: { uid: string; displayName: string; photoURL: string | null };
  } | null>(null);
  const seenRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!profile) return;

    return listenIncomingCalls(profile.uid, (call) => {
      // Don't ring yourself / already handled channels
      if (call.fromUid === profile.uid) return;
      if (seenRef.current.has(call.channel)) return;
      // If already in a call, ignore
      if (activeCall) return;

      seenRef.current.add(call.channel);
      setIncoming(call);
    });
  }, [profile?.uid, activeCall]);

  if (!profile) return null;

  return (
    <>
      {incoming && !activeCall && (
        <IncomingCallModal
          call={incoming}
          onAccept={() => {
            const call = incoming;
            setIncoming(null);
            void acceptCall(call.channel).then(() => {
              setActiveCall({
                channel: call.channel,
                isCaller: false,
                peer: {
                  uid: call.fromUid,
                  displayName: call.fromName,
                  photoURL: call.fromPhoto,
                },
              });
            });
          }}
          onDecline={() => {
            const call = incoming;
            setIncoming(null);
            void declineCall({
              ...call,
              toName: profile.displayName,
              toPhoto: profile.photoURL,
            });
          }}
        />
      )}

      {activeCall && (
        <VideoCallModal
          open
          channel={activeCall.channel}
          isCaller={activeCall.isCaller}
          me={{
            uid: profile.uid,
            displayName: profile.displayName,
            photoURL: profile.photoURL,
          }}
          peer={activeCall.peer}
          onClose={() => setActiveCall(null)}
        />
      )}
    </>
  );
}
