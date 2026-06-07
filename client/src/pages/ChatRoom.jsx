import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, MessageCircle, Send } from 'lucide-react';
import { io } from 'socket.io-client';
import { Link, useParams } from 'react-router-dom';
import { API_BASE_URL, apiUrl } from '../config.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function ChatRoom() {
  const { roomId } = useParams();
  const { user, userProfile } = useAuth();
  const socketRef = useRef(null);
  const messageEndRef = useRef(null);
  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const loadChat = async () => {
      try {
        const [roomResponse, messagesResponse] = await Promise.all([
          fetch(apiUrl(`/api/chat-rooms/${roomId}`)),
          fetch(apiUrl(`/api/chat-rooms/${roomId}/messages`)),
        ]);
        const roomData = await roomResponse.json();
        const messageData = await messagesResponse.json();

        if (!roomResponse.ok) {
          throw new Error(roomData.message || '상담방 정보를 불러오지 못했습니다.');
        }

        if (!messagesResponse.ok) {
          throw new Error(messageData.message || '메시지를 불러오지 못했습니다.');
        }

        setRoom(roomData);
        setMessages(messageData);
      } catch (requestError) {
        setError(requestError.message);
      }
    };

    loadChat();
  }, [roomId]);

  useEffect(() => {
    // 배포 환경에서는 Render Web Service 주소로 Socket.io에 연결합니다.
    const socket = io(API_BASE_URL || undefined);
    socketRef.current = socket;

    socket.emit('join-room', { roomId, userId: user?.uid }, (result) => {
      if (!result.ok) {
        setError(result.message);
      }
    });

    socket.on('receive-message', (message) => {
      setMessages((currentMessages) => [...currentMessages, message]);
    });

    socket.on('connect_error', () => {
      setError('채팅 서버에 연결하지 못했습니다.');
    });

    return () => {
      socket.off('receive-message');
      socket.disconnect();
    };
  }, [roomId, user?.uid]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (event) => {
    event.preventDefault();

    if (!user || !text.trim() || !socketRef.current) {
      return;
    }

    setSending(true);
    setError('');

    socketRef.current.emit(
      'send-message',
      {
        roomId,
        senderId: user.uid,
        senderName: userProfile?.name || user.email,
        text,
      },
      (result) => {
        setSending(false);

        if (!result.ok) {
          setError(result.message);
          return;
        }

        setText('');
      },
    );
  };

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8">
      <section className="mx-auto flex min-h-[700px] max-w-3xl flex-col rounded-xl bg-white p-6 shadow-lg">
        <Link className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600" to="/">
          <ArrowLeft size={17} />
          차량 목록
        </Link>

        {room && (
          <div className="mt-6 flex items-center gap-3 border-b border-slate-200 pb-5">
            <div className="rounded-full bg-blue-100 p-3 text-blue-700">
              <MessageCircle size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-950">{room.carName} 상담</h1>
              <p className="mt-1 text-sm text-slate-500">담당 딜러: {room.dealerName}</p>
            </div>
          </div>
        )}

        {error && <p className="mt-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

        <div className="flex-1 space-y-3 overflow-y-auto py-5">
          {messages.length === 0 && (
            <p className="py-16 text-center text-slate-500">딜러에게 첫 메시지를 보내보세요.</p>
          )}

          {messages.map((message) => {
            const isMine = message.senderId === user?.uid;

            return (
              <div key={message._id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] rounded-xl px-4 py-3 ${isMine ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-900'}`}>
                  <p className={`mb-1 text-xs font-semibold ${isMine ? 'text-blue-100' : 'text-slate-500'}`}>
                    {message.senderName}
                  </p>
                  <p className="whitespace-pre-wrap break-words">{message.text}</p>
                  <p className={`mt-1 text-right text-[11px] ${isMine ? 'text-blue-100' : 'text-slate-400'}`}>
                    {new Date(message.createdAt).toLocaleTimeString('ko-KR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={messageEndRef} />
        </div>

        <form className="flex gap-2 border-t border-slate-200 pt-4" onSubmit={sendMessage}>
          <input
            className="input flex-1"
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="메시지를 입력하세요"
            disabled={!user || sending}
          />
          <button
            className="primary-button bg-blue-600 px-5 hover:bg-blue-700"
            type="submit"
            disabled={!user || !text.trim() || sending}
          >
            <Send size={18} />
            전송
          </button>
        </form>
      </section>
    </main>
  );
}
