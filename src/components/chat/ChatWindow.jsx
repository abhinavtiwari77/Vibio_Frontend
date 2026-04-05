import { useRef, useState, useEffect } from 'react';
import { Send, Paperclip, MoreVertical, Trash2, Phone, Video, PhoneOff, Mic, MicOff, Camera, CameraOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';
import { getSocket } from '../../utils/socket';
import { uploadService } from '../../services';
import toast from 'react-hot-toast';

const ChatWindow = ({ conversation, messages, onSendMessage, loading, onlineUserIds = [], onDeleteChat }) => {
    const { user } = useAuth();
    const [newMessage, setNewMessage] = useState('');
    const [uploading, setUploading] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [callState, setCallState] = useState('idle');
    const [isVideoCall, setIsVideoCall] = useState(false);
    const [incomingCall, setIncomingCall] = useState(null);
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isCameraOff, setIsCameraOff] = useState(false);
    const [callError, setCallError] = useState('');
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const fileInputRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const peerConnectionRef = useRef(null);
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const callMetaRef = useRef({ callId: null, peerUserId: null, conversationId: null });

    const getParticipantId = (participant) => String(participant?._id || participant || '');
    const otherParticipant = conversation?.participants?.find((p) => getParticipantId(p) !== String(user?._id)) || conversation?.participants?.[0];
    const otherParticipantId = getParticipantId(otherParticipant);
    const isOnline = Boolean(otherParticipantId) && onlineUserIds.includes(otherParticipantId);

    const cleanupPeerConnection = () => {
        if (peerConnectionRef.current) {
            try {
                peerConnectionRef.current.onicecandidate = null;
                peerConnectionRef.current.ontrack = null;
                peerConnectionRef.current.onconnectionstatechange = null;
                peerConnectionRef.current.close();
            } catch (e) {
                console.warn('Peer cleanup warning', e);
            }
            peerConnectionRef.current = null;
        }
    };

    const stopMediaStreams = () => {
        if (localStream) {
            localStream.getTracks().forEach((track) => track.stop());
        }
        if (remoteStream) {
            remoteStream.getTracks().forEach((track) => track.stop());
        }
        setLocalStream(null);
        setRemoteStream(null);
    };

    const resetCallState = () => {
        cleanupPeerConnection();
        stopMediaStreams();
        setIncomingCall(null);
        setCallError('');
        setCallState('idle');
        setIsVideoCall(false);
        setIsMuted(false);
        setIsCameraOff(false);
        callMetaRef.current = { callId: null, peerUserId: null, conversationId: null };
    };

    const getMediaConstraints = (videoEnabled) => ({
        audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
        },
        video: videoEnabled
            ? {
                width: { ideal: 1280, max: 1920 },
                height: { ideal: 720, max: 1080 },
                frameRate: { ideal: 30, max: 30 }
            }
            : false
    });

    const tuneSenderBitrate = (pc) => {
        pc.getSenders().forEach(async (sender) => {
            if (!sender.track) return;
            const params = sender.getParameters();
            if (!params.encodings) params.encodings = [{}];

            if (sender.track.kind === 'video') {
                params.encodings[0].maxBitrate = 2_500_000;
                params.encodings[0].maxFramerate = 30;
            }
            if (sender.track.kind === 'audio') {
                params.encodings[0].maxBitrate = 96_000;
            }

            try {
                await sender.setParameters(params);
            } catch (err) {
                console.warn('Sender params not applied', err);
            }
        });
    };

    const createPeerConnection = (peerUserId, conversationId, callId) => {
        cleanupPeerConnection();
        const socket = getSocket();

        const pc = new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' }
            ],
            iceCandidatePoolSize: 10
        });

        pc.onicecandidate = (event) => {
            if (event.candidate && socket && peerUserId) {
                socket.emit('call:ice-candidate', {
                    toUserId: peerUserId,
                    fromUserId: user?._id,
                    conversationId,
                    candidate: event.candidate,
                    callId
                });
            }
        };

        pc.ontrack = (event) => {
            const [stream] = event.streams || [];
            if (stream) setRemoteStream(stream);
        };

        pc.onconnectionstatechange = () => {
            const state = pc.connectionState;
            if (state === 'connected') {
                setCallState('in_call');
            } else if (state === 'failed' || state === 'disconnected' || state === 'closed') {
                setCallError('Call disconnected');
                resetCallState();
            }
        };

        peerConnectionRef.current = pc;
        return pc;
    };

    const startCall = async (videoEnabled) => {
        if (!conversation?._id || !otherParticipantId) return;
        const socket = getSocket();
        if (!socket) {
            toast.error('Socket not connected');
            return;
        }

        try {
            setCallError('');
            setIsVideoCall(videoEnabled);
            setCallState('connecting');

            const stream = await navigator.mediaDevices.getUserMedia(getMediaConstraints(videoEnabled));
            setLocalStream(stream);

            const callId = `call_${Date.now()}_${user?._id}`;
            callMetaRef.current = { callId, peerUserId: otherParticipantId, conversationId: conversation._id };

            const pc = createPeerConnection(otherParticipantId, conversation._id, callId);
            stream.getTracks().forEach((track) => pc.addTrack(track, stream));
            tuneSenderBitrate(pc);

            const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: videoEnabled });
            await pc.setLocalDescription(offer);

            socket.emit('call:initiate', {
                toUserId: otherParticipantId,
                fromUserId: user?._id,
                conversationId: conversation._id,
                offer,
                isVideo: videoEnabled,
                callId
            });

            setCallState('outgoing');
        } catch (err) {
            console.error('Call start error', err);
            setCallError('Unable to access microphone/camera');
            resetCallState();
        }
    };

    const acceptIncomingCall = async () => {
        if (!incomingCall) return;
        const socket = getSocket();
        if (!socket) return;

        try {
            setCallError('');
            setIsVideoCall(Boolean(incomingCall.isVideo));
            setCallState('connecting');

            const stream = await navigator.mediaDevices.getUserMedia(getMediaConstraints(Boolean(incomingCall.isVideo)));
            setLocalStream(stream);

            callMetaRef.current = {
                callId: incomingCall.callId,
                peerUserId: incomingCall.fromUserId,
                conversationId: incomingCall.conversationId
            };

            const pc = createPeerConnection(incomingCall.fromUserId, incomingCall.conversationId, incomingCall.callId);
            stream.getTracks().forEach((track) => pc.addTrack(track, stream));
            tuneSenderBitrate(pc);

            await pc.setRemoteDescription(new RTCSessionDescription(incomingCall.offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            socket.emit('call:accept', {
                toUserId: incomingCall.fromUserId,
                fromUserId: user?._id,
                conversationId: incomingCall.conversationId,
                answer,
                callId: incomingCall.callId
            });

            setIncomingCall(null);
        } catch (err) {
            console.error('Call accept error', err);
            setCallError('Unable to start call');
            rejectIncomingCall();
        }
    };

    const rejectIncomingCall = () => {
        const socket = getSocket();
        if (socket && incomingCall) {
            socket.emit('call:reject', {
                toUserId: incomingCall.fromUserId,
                fromUserId: user?._id,
                conversationId: incomingCall.conversationId,
                callId: incomingCall.callId
            });
        }
        resetCallState();
    };

    const endCall = (notifyPeer = true) => {
        const socket = getSocket();
        const meta = callMetaRef.current;
        if (notifyPeer && socket && meta.peerUserId && meta.conversationId) {
            socket.emit('call:end', {
                toUserId: meta.peerUserId,
                fromUserId: user?._id,
                conversationId: meta.conversationId,
                callId: meta.callId
            });
        }
        resetCallState();
    };

    const toggleMute = () => {
        if (!localStream) return;
        const next = !isMuted;
        localStream.getAudioTracks().forEach((track) => {
            track.enabled = !next;
        });
        setIsMuted(next);
    };

    const toggleCamera = () => {
        if (!localStream) return;
        const next = !isCameraOff;
        localStream.getVideoTracks().forEach((track) => {
            track.enabled = !next;
        });
        setIsCameraOff(next);
    };

    useEffect(() => {
        const socket = getSocket();
        if (!socket || !conversation) return;

        const handleTyping = ({ conversationId, typistId }) => {
            if (conversationId === conversation._id && typistId !== user._id) {
                setIsTyping(true);
            }
        };

        const handleStopTyping = ({ conversationId, typistId }) => {
            if (conversationId === conversation._id && typistId !== user._id) {
                setIsTyping(false);
            }
        };

        socket.on('typing', handleTyping);
        socket.on('stopTyping', handleStopTyping);

        return () => {
            socket.off('typing', handleTyping);
            socket.off('stopTyping', handleStopTyping);
        };
    }, [conversation, user._id]);

    useEffect(() => {
        const socket = getSocket();
        if (!socket || !user?._id) return;

        const handleIncomingCall = (payload) => {
            const isForCurrentConversation = String(payload?.conversationId) === String(conversation?._id);
            if (!isForCurrentConversation) return;

            if (callState === 'in_call' || callState === 'connecting' || callState === 'outgoing') {
                socket.emit('call:reject', {
                    toUserId: payload?.fromUserId,
                    fromUserId: user?._id,
                    conversationId: payload?.conversationId,
                    callId: payload?.callId
                });
                return;
            }

            setIsVideoCall(Boolean(payload?.isVideo));
            setIncomingCall(payload);
            setCallState('incoming');
        };

        const handleCallAccepted = async (payload) => {
            const meta = callMetaRef.current;
            const shouldHandle =
                String(payload?.conversationId) === String(meta.conversationId) &&
                String(payload?.fromUserId) === String(meta.peerUserId);
            if (!shouldHandle || !peerConnectionRef.current) return;

            try {
                await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(payload.answer));
                setCallState('in_call');
            } catch (err) {
                console.error('Accept description error', err);
                setCallError('Failed to establish call');
                endCall(false);
            }
        };

        const handleCallRejected = (payload) => {
            const meta = callMetaRef.current;
            const shouldHandle =
                String(payload?.conversationId) === String(meta.conversationId) &&
                String(payload?.fromUserId) === String(meta.peerUserId);
            if (!shouldHandle) return;

            toast.error('Call declined');
            resetCallState();
        };

        const handleCallEnded = (payload) => {
            const meta = callMetaRef.current;
            if (meta.conversationId && String(payload?.conversationId) !== String(meta.conversationId)) return;
            toast('Call ended');
            resetCallState();
        };

        const handleIceCandidate = async (payload) => {
            const meta = callMetaRef.current;
            const shouldHandle =
                String(payload?.conversationId) === String(meta.conversationId) &&
                String(payload?.fromUserId) === String(meta.peerUserId);
            if (!shouldHandle || !peerConnectionRef.current || !payload?.candidate) return;

            try {
                await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(payload.candidate));
            } catch (err) {
                console.warn('ICE add error', err);
            }
        };

        socket.on('call:incoming', handleIncomingCall);
        socket.on('call:accepted', handleCallAccepted);
        socket.on('call:rejected', handleCallRejected);
        socket.on('call:ended', handleCallEnded);
        socket.on('call:ice-candidate', handleIceCandidate);

        return () => {
            socket.off('call:incoming', handleIncomingCall);
            socket.off('call:accepted', handleCallAccepted);
            socket.off('call:rejected', handleCallRejected);
            socket.off('call:ended', handleCallEnded);
            socket.off('call:ice-candidate', handleIceCandidate);
        };
    }, [conversation?._id, user?._id, callState]);

    useEffect(() => {
        if (localVideoRef.current) {
            localVideoRef.current.srcObject = localStream || null;
        }
    }, [localStream]);

    useEffect(() => {
        if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream || null;
        }
    }, [remoteStream]);

    useEffect(() => {
        return () => {
            endCall(false);
        };
    }, []);

    const handleInputChange = (e) => {
        setNewMessage(e.target.value);

        const socket = getSocket();
        if (socket && conversation) {
            socket.emit('typing', { conversationId: conversation._id, typistId: user._id });

            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

            typingTimeoutRef.current = setTimeout(() => {
                socket.emit('stopTyping', { conversationId: conversation._id, typistId: user._id });
            }, 2000);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;
        onSendMessage(newMessage);
        setNewMessage('');
    };

    const handleFileSelect = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            toast.error('File size too large (max 5MB)');
            return;
        }

        setUploading(true);
        try {
            const data = await uploadService.uploadImage(file);
            // Send as object with mediaUrl
            await onSendMessage({
                text: '',
                mediaUrl: data.url
            });
            toast.success('Image sent');
        } catch (error) {
            console.error('Upload failed', error);
            toast.error('Failed to send image');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    if (!conversation) {
        return (
            <div className="flex-1 flex items-center justify-center bg-transparent h-full">
                <div className="text-center text-slate-500">
                    <p className="text-[2rem] font-semibold tracking-[-0.02em] text-slate-700">Select a conversation</p>
                    <p className="text-sm">or start a new chat from the suggestions</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full bg-white/85 backdrop-blur-sm relative">
            {/* Header */}
            <div className="px-4 sm:px-6 py-3.5 border-b border-blue-100/80 flex items-center justify-between flex-shrink-0 bg-white/95 backdrop-blur-sm z-10 shadow-[0_2px_10px_rgba(37,99,235,0.06)]">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-100 to-cyan-100 border border-blue-200/70 flex items-center justify-center text-blue-700 font-semibold text-lg shadow-sm">
                        {otherParticipant?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-900 tracking-[-0.01em]">{otherParticipant?.name}</h3>
                        {isOnline ? (
                            <p className="text-xs text-emerald-600 font-medium flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-100"></span>
                                Online
                            </p>
                        ) : (
                            <p className="text-xs text-slate-400 font-medium">Offline</p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2 text-slate-400 relative">
                    <button
                        onClick={() => startCall(false)}
                        disabled={!otherParticipantId || callState === 'connecting' || callState === 'outgoing' || callState === 'in_call'}
                        className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-blue-100 bg-white hover:bg-blue-50 hover:text-blue-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        title="Audio call"
                    >
                        <Phone className="w-4.5 h-4.5" />
                    </button>
                    <button
                        onClick={() => startCall(true)}
                        disabled={!otherParticipantId || callState === 'connecting' || callState === 'outgoing' || callState === 'in_call'}
                        className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-blue-100 bg-white hover:bg-blue-50 hover:text-blue-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        title="Video call"
                    >
                        <Video className="w-4.5 h-4.5" />
                    </button>
                    <button
                        onClick={() => setShowMenu(!showMenu)}
                        className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-blue-100 bg-white hover:bg-blue-50 hover:text-blue-600 transition-all"
                    >
                        <MoreVertical className="w-4.5 h-4.5" />
                    </button>

                    {showMenu && (
                        <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-blue-100 py-1 z-50">
                            <button
                                onClick={() => {
                                    if (window.confirm('Are you sure you want to delete this conversation? It will be removed from your list.')) {
                                        onDeleteChat(conversation._id);
                                    }
                                    setShowMenu(false);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                            >
                                <Trash2 className="w-4 h-4" />
                                Delete Chat
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {(callState !== 'idle' || incomingCall) && (
                <div className="absolute inset-0 z-30 bg-slate-900/65 backdrop-blur-[2px] flex items-center justify-center p-4">
                    <div className="w-full max-w-3xl rounded-2xl bg-slate-900 text-white border border-white/10 shadow-2xl overflow-hidden">
                        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between">
                            <div>
                                <p className="font-semibold text-base sm:text-lg">{otherParticipant?.name || 'Contact'}</p>
                                <p className="text-xs sm:text-sm text-slate-300">
                                    {incomingCall
                                        ? `${isVideoCall ? 'Incoming video call' : 'Incoming voice call'}`
                                        : callState === 'outgoing'
                                            ? `Calling... ${isVideoCall ? 'Video' : 'Audio'}`
                                            : callState === 'connecting'
                                                ? 'Connecting...'
                                                : isVideoCall ? 'Video call in progress' : 'Voice call in progress'}
                                </p>
                            </div>
                            {callError && <p className="text-xs text-red-300">{callError}</p>}
                        </div>

                        <div className="relative p-4 sm:p-5">
                            {isVideoCall ? (
                                <div className="relative w-full rounded-xl bg-black/50 overflow-hidden aspect-video">
                                    {remoteStream ? (
                                        <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-300 text-sm">Waiting for remote video...</div>
                                    )}

                                    <div className="absolute right-3 bottom-3 w-28 sm:w-36 rounded-lg overflow-hidden border border-white/15 bg-black/50 aspect-[3/4]">
                                        {localStream ? (
                                            <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-300">Local video</div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="h-52 sm:h-64 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center justify-center text-center">
                                    <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center text-xl font-semibold mb-3">
                                        {otherParticipant?.name?.charAt(0)?.toUpperCase() || '?'}
                                    </div>
                                    <p className="text-slate-100 font-medium">{otherParticipant?.name || 'Contact'}</p>
                                    <p className="text-slate-300 text-sm">Audio call</p>
                                </div>
                            )}
                        </div>

                        <div className="p-4 sm:p-5 border-t border-white/10 flex items-center justify-center gap-3 sm:gap-4">
                            {callState === 'incoming' ? (
                                <>
                                    <button
                                        onClick={rejectIncomingCall}
                                        className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 bg-red-500 hover:bg-red-600 transition-colors"
                                    >
                                        <PhoneOff className="w-4 h-4" />
                                        Decline
                                    </button>
                                    <button
                                        onClick={acceptIncomingCall}
                                        className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 transition-colors"
                                    >
                                        <Phone className="w-4 h-4" />
                                        Accept
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        onClick={toggleMute}
                                        className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                                        title={isMuted ? 'Unmute' : 'Mute'}
                                    >
                                        {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                                    </button>

                                    {isVideoCall && (
                                        <button
                                            onClick={toggleCamera}
                                            className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                                            title={isCameraOff ? 'Turn camera on' : 'Turn camera off'}
                                        >
                                            {isCameraOff ? <CameraOff className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
                                        </button>
                                    )}

                                    <button
                                        onClick={() => endCall(true)}
                                        className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 bg-red-500 hover:bg-red-600 transition-colors"
                                    >
                                        <PhoneOff className="w-4 h-4" />
                                        End
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[radial-gradient(circle_at_12%_0%,rgba(59,130,246,0.08),transparent_40%),linear-gradient(180deg,rgba(248,251,255,0.95)_0%,rgba(242,247,255,0.9)_100%)] custom-scrollbar">
                {loading ? (
                    <div className="flex justify-center py-4">
                        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {messages.length === 0 && (
                            <div className="py-12 text-center">
                                <p className="text-slate-700 font-semibold">No messages yet</p>
                                <p className="text-sm text-slate-500 mt-1">Start the conversation with a quick hello.</p>
                            </div>
                        )}
                        {messages.map((msg, idx) => {
                            const isMe = msg.sender._id === user._id || msg.sender === user._id;

                            return (
                                <div key={msg._id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group`}>
                                    <div className={`flex max-w-[88%] sm:max-w-[76%] ${isMe ? 'flex-row-reverse' : 'flex-row'} gap-2.5`}>
                                        {!isMe && (
                                            <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-200/70 flex-shrink-0 flex items-center justify-center text-blue-700 font-bold text-xs self-end mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {otherParticipant?.name?.charAt(0).toUpperCase()}
                                            </div>
                                        )}

                                        <div className={`px-3.5 py-2.5 rounded-2xl shadow-sm ${isMe
                                            ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-br-md shadow-blue-300/35'
                                            : 'bg-white text-slate-800 border border-blue-100 rounded-bl-md'
                                            }`}>
                                            {msg.mediaUrl && (
                                                <div className="mb-2 rounded-xl overflow-hidden border border-blue-100/70">
                                                    <img
                                                        src={msg.mediaUrl}
                                                        alt="Attached media"
                                                        className="max-w-full max-h-64 object-cover"
                                                        loading="lazy"
                                                    />
                                                </div>
                                            )}
                                            {msg.text && <p className="text-[13.5px] leading-relaxed whitespace-pre-wrap">{msg.text}</p>}
                                            <p className={`text-[10px] mt-1.5 text-right ${isMe ? 'text-blue-100' : 'text-slate-400'}`}>
                                                {format(new Date(msg.createdAt), 'h:mm a')}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {isTyping && (
                            <div className="flex justify-start">
                                <div className="bg-white border border-blue-100 rounded-2xl p-3 rounded-bl-md text-slate-500 text-sm flex items-center gap-1 shadow-sm">
                                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            {/* Input */}
            <div className="p-3 sm:p-4 bg-white/95 backdrop-blur-sm border-t border-blue-100">
                <form onSubmit={handleSubmit} className="flex items-center gap-2.5 rounded-2xl border border-blue-100 bg-white px-2 py-1.5 shadow-[0_8px_18px_rgba(37,99,235,0.08)]">
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className={`inline-flex items-center justify-center w-9 h-9 rounded-full text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <Paperclip className="w-4.5 h-4.5" />
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileSelect}
                    />
                    <input
                        ref={inputRef}
                        type="text"
                        value={newMessage}
                        onChange={handleInputChange}
                        placeholder="Type your message..."
                        className="flex-1 bg-transparent border-0 rounded-full px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:ring-0 focus:outline-none"
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-full hover:brightness-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-blue-300/40"
                    >
                        <Send className="w-4.5 h-4.5" />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChatWindow;
