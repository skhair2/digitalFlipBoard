import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Hook for WebRTC P2P communication
 * @param {object} socket - Socket.io instance
 * @param {string} sessionCode - Current session code
 * @param {string} role - 'controller' or 'display'
 */
export const useWebRTC = (socket, sessionCode, role) => {
  const [peerConnection, setPeerConnection] = useState(null);
  const [dataChannel, setDataChannel] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  
  const pcRef = useRef(null);
  const dcRef = useRef(null);
  
  const configuration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
    ]
  };

  const cleanup = useCallback(() => {
    if (dcRef.current) {
      dcRef.current.close();
      dcRef.current = null;
    }
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    setPeerConnection(null);
    setDataChannel(null);
    setConnectionStatus('disconnected');
  }, []);

  const createPeerConnection = useCallback((targetId = null) => {
    console.log(`[WebRTC] Creating PeerConnection for ${targetId || 'session'}`);
    
    const pc = new RTCPeerConnection(configuration);
    
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('webrtc:ice-candidate', {
          target: targetId,
          candidate: event.candidate
        });
      }
    };

    pc.onconnectionstatechange = () => {
      console.log(`[WebRTC] Connection state: ${pc.connectionState}`);
      setConnectionStatus(pc.connectionState);
      if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        cleanup();
      }
    };

    if (role === 'controller') {
      const dc = pc.createDataChannel('flipboard-data', { ordered: true });
      setupDataChannel(dc);
    } else {
      pc.ondatachannel = (event) => {
        setupDataChannel(event.channel);
      };
    }

    pcRef.current = pc;
    setPeerConnection(pc);
    return pc;
  }, [socket, role, cleanup]);

  const setupDataChannel = (dc) => {
    dc.onopen = () => {
      console.log('[WebRTC] Data channel opened');
      setConnectionStatus('connected');
    };
    dc.onclose = () => {
      console.log('[WebRTC] Data channel closed');
      setConnectionStatus('disconnected');
    };
    dc.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('[WebRTC] Received message:', message);
        // Dispatch custom event for the application to listen to
        window.dispatchEvent(new CustomEvent('webrtc:message', { detail: message }));
      } catch (e) {
        console.log('[WebRTC] Received raw message:', event.data);
      }
    };
    dcRef.current = dc;
    setDataChannel(dc);
  };

  const initiateConnection = useCallback(async (targetId = null) => {
    if (role !== 'controller') return;
    
    const pc = createPeerConnection(targetId);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    
    socket.emit('webrtc:offer', {
      target: targetId,
      offer
    });
  }, [role, createPeerConnection, socket]);

  useEffect(() => {
    if (!socket || !sessionCode) return;

    socket.on('webrtc:offer', async (data) => {
      const { from, offer } = data;
      console.log(`[WebRTC] Received offer from ${from}`);
      
      const pc = createPeerConnection(from);
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      
      socket.emit('webrtc:answer', {
        target: from,
        answer
      });
    });

    socket.on('webrtc:answer', async (data) => {
      const { from, answer } = data;
      console.log(`[WebRTC] Received answer from ${from}`);
      
      if (pcRef.current) {
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
      }
    });

    socket.on('webrtc:ice-candidate', async (data) => {
      const { from, candidate } = data;
      console.log(`[WebRTC] Received ICE candidate from ${from}`);
      
      if (pcRef.current) {
        try {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error('[WebRTC] Error adding ICE candidate', e);
        }
      }
    });

    return () => {
      socket.off('webrtc:offer');
      socket.off('webrtc:answer');
      socket.off('webrtc:ice-candidate');
      cleanup();
    };
  }, [socket, sessionCode, createPeerConnection, cleanup]);

  const sendMessage = useCallback((data) => {
    if (dcRef.current && dcRef.current.readyState === 'open') {
      dcRef.current.send(JSON.stringify(data));
      return true;
    }
    return false;
  }, []);

  return {
    connectionStatus,
    initiateConnection,
    sendMessage,
    isP2P: connectionStatus === 'connected'
  };
};
