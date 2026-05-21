"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Send, MessageSquare, Loader2, ChevronLeft } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
import { toast } from "@/components/ui/Toast";
import { getSocket, joinUser } from "@/lib/socket";

interface ConvoUser {
  id: string;
  username: string;
  avatarUrl?: string;
}

interface Conversation {
  id: string;
  other: ConvoUser;
  lastMessage: { body: string; createdAt: string; senderId: string; read: boolean } | null;
  unreadCount: number;
  lastMessageAt: string;
}

interface Message {
  id: string;
  body: string;
  senderId: string;
  createdAt: string;
  sender: ConvoUser;
  read: boolean;
}

function Avatar({ user, size = "md" }: { user: ConvoUser; size?: "sm" | "md" }) {
  const cls = size === "sm" ? "h-8 w-8 text-sm" : "h-10 w-10 text-base";
  return (
    <div className={`${cls} flex-shrink-0 flex items-center justify-center rounded-full bg-gradient-to-br from-[#009DFF] to-[#00C8FF] font-bold font-heading text-white`}>
      {user.username?.[0]?.toUpperCase() || "?"}
    </div>
  );
}

function MessagesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, token } = useAuthStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const [showThread, setShowThread] = useState(!isMobile);

  const activeConvo = conversations.find((c) => c.id === activeId);

  const fetchConversations = useCallback(async () => {
    try {
      const data = await api.get("/messages").then((r) => r.data as Conversation[]);
      setConversations(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMessages = useCallback(async (convId: string) => {
    setLoadingMsgs(true);
    try {
      const data = await api.get(`/messages/${convId}`).then((r) => r.data);
      setMessages(data.messages || []);
    } catch {
      toast("error", "Nepodařilo se načíst zprávy");
    } finally {
      setLoadingMsgs(false);
    }
  }, []);

  useEffect(() => {
    if (!token) { router.push("/login?from=/messages"); return; }
    fetchConversations();
  }, [token, fetchConversations, router]);

  // Open conversation from URL param (?with=userId)
  useEffect(() => {
    const withUserId = searchParams.get("with");
    if (!withUserId || !token) return;
    api.post(`/messages/with/${withUserId}`).then((r) => {
      const convo: Conversation = {
        id: r.data.id,
        other: r.data.user1Id === user?.id ? r.data.user2 : r.data.user1,
        lastMessage: null,
        unreadCount: 0,
        lastMessageAt: r.data.lastMessageAt,
      };
      setConversations((prev) => {
        const exists = prev.find((c) => c.id === convo.id);
        return exists ? prev : [convo, ...prev];
      });
      setActiveId(convo.id);
      if (isMobile) setShowThread(true);
    }).catch(() => {});
  }, [searchParams, token, user?.id, isMobile]);

  useEffect(() => {
    if (!activeId) return;
    loadMessages(activeId);
    setConversations((prev) =>
      prev.map((c) => (c.id === activeId ? { ...c, unreadCount: 0 } : c))
    );
  }, [activeId, loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Real-time incoming messages
  useEffect(() => {
    if (!token) return;
    joinUser();
    const socket = getSocket();
    if (!socket) return;

    const handleNewMessage = (data: { conversationId: string; message: Message }) => {
      if (data.conversationId === activeId) {
        setMessages((prev) => [...prev, data.message]);
      }
      setConversations((prev) =>
        prev.map((c) =>
          c.id === data.conversationId
            ? {
                ...c,
                lastMessage: { body: data.message.body, createdAt: data.message.createdAt, senderId: data.message.senderId, read: c.id === activeId },
                unreadCount: c.id === activeId ? 0 : c.unreadCount + 1,
                lastMessageAt: data.message.createdAt,
              }
            : c
        ).sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime())
      );
    };

    socket.on("new_message", handleNewMessage);
    return () => { socket.off("new_message", handleNewMessage); };
  }, [token, activeId]);

  const handleSend = async () => {
    if (!body.trim() || !activeId || sending) return;
    const text = body.trim();
    setBody("");
    setSending(true);
    try {
      const msg = await api.post(`/messages/${activeId}`, { body: text }).then((r) => r.data as Message);
      setMessages((prev) => [...prev, msg]);
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeId
            ? { ...c, lastMessage: { body: text, createdAt: msg.createdAt, senderId: msg.senderId, read: true }, lastMessageAt: msg.createdAt }
            : c
        ).sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime())
      );
    } catch {
      toast("error", "Zprávu se nepodařilo odeslat");
      setBody(text);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const selectConvo = (id: string) => {
    setActiveId(id);
    if (isMobile) setShowThread(true);
  };

  if (!token) return null;

  return (
    <div className="container-premium py-6">
      <h1 className="heading-lg text-white mb-6">Zprávy</h1>

      <div className="flex h-[calc(100vh-200px)] min-h-[500px] rounded-xl border border-[rgba(0,200,255,0.1)] overflow-hidden">
        {/* Sidebar */}
        <div className={`w-full md:w-80 flex-shrink-0 border-r border-[rgba(0,200,255,0.1)] bg-[#0B1220] flex flex-col ${isMobile && showThread ? "hidden" : "flex"}`}>
          <div className="p-4 border-b border-[rgba(0,200,255,0.06)]">
            <h2 className="font-heading font-bold text-sm text-gray-400 uppercase tracking-wider">Konverzace</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-[#00C8FF]" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-16 px-4">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-600" />
                <p className="text-gray-500 text-sm">Zatím žádné zprávy</p>
                <p className="text-gray-600 text-xs mt-1">Zprávy lze zahájit z profilu prodejce</p>
              </div>
            ) : (
              conversations.map((c) => (
                <button
                  key={c.id}
                  onClick={() => selectConvo(c.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-[rgba(0,200,255,0.04)] transition-colors text-left ${activeId === c.id ? "bg-[rgba(0,200,255,0.06)] border-l-2 border-[#00C8FF]" : ""}`}
                >
                  <div className="relative">
                    <Avatar user={c.other} size="sm" />
                    {c.unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-[#FF3366] text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">{c.unreadCount}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-heading font-semibold text-sm text-white truncate">{c.other.username}</p>
                    {c.lastMessage && (
                      <p className={`text-xs truncate ${c.unreadCount > 0 ? "text-gray-200 font-medium" : "text-gray-500"}`}>
                        {c.lastMessage.senderId === user?.id ? "Ty: " : ""}{c.lastMessage.body}
                      </p>
                    )}
                  </div>
                  {c.lastMessageAt && (
                    <span className="text-[10px] text-gray-600 flex-shrink-0">
                      {new Date(c.lastMessageAt).toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Message thread */}
        <div className={`flex-1 flex flex-col bg-[#050A12] ${isMobile && !showThread ? "hidden" : "flex"}`}>
          {activeConvo ? (
            <>
              {/* Thread header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-[rgba(0,200,255,0.06)] bg-[#0B1220]">
                {isMobile && (
                  <button onClick={() => setShowThread(false)} className="btn-ghost p-1 mr-1">
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                )}
                <Avatar user={activeConvo.other} size="sm" />
                <div>
                  <p className="font-heading font-bold text-sm">{activeConvo.other.username}</p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loadingMsgs ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-5 w-5 animate-spin text-[#00C8FF]" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500 text-sm">Začni konverzaci!</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.senderId === user?.id;
                    return (
                      <div key={msg.id} className={`flex items-end gap-2 ${isMe ? "flex-row-reverse" : ""}`}>
                        {!isMe && <Avatar user={msg.sender} size="sm" />}
                        <div className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm ${isMe ? "bg-[#00C8FF] text-[#050A12] font-medium rounded-br-sm" : "bg-[#0B1220] border border-[rgba(0,200,255,0.1)] text-gray-100 rounded-bl-sm"}`}>
                          <p className="whitespace-pre-wrap break-words">{msg.body}</p>
                          <p className={`text-[10px] mt-1 ${isMe ? "text-[rgba(5,10,18,0.6)]" : "text-gray-600"}`}>
                            {new Date(msg.createdAt).toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="p-3 border-t border-[rgba(0,200,255,0.06)] bg-[#0B1220] flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder="Napiš zprávu... (Enter odešle)"
                  rows={1}
                  className="input flex-1 resize-none min-h-[40px] max-h-[120px] py-2 text-sm"
                  style={{ height: "auto" }}
                />
                <button
                  onClick={handleSend}
                  disabled={!body.trim() || sending}
                  className="btn-primary p-2.5 flex-shrink-0 disabled:opacity-50"
                >
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="h-16 w-16 mx-auto mb-4 text-gray-700" />
                <p className="text-gray-500 text-sm">Vyber konverzaci vlevo</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="container-premium py-6"><div className="skeleton h-96 rounded-xl" /></div>}>
      <MessagesContent />
    </Suspense>
  );
}
