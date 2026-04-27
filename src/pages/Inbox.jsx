import { useEffect, useRef, useState, useCallback, useMemo, useDeferredValue } from "react";
import { io } from "socket.io-client";
import API from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useLocation } from "react-router-dom";

const SOCKET_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace("/api", "");

const initials = (name = "U") =>
  name.trim().split(/\s+/).map((s) => s?.[0]?.toUpperCase() || "").slice(0, 2).join("") || "U";

const formatTime = (iso) =>
  iso ? new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";

const getRoomKey = (a, b, propId) => {
  const parts = [String(a), String(b)];
  if (propId) parts.push(String(propId));
  return `conv_${parts.sort().join("_")}`;
};

export default function Inbox() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  const [convStats, setConvStats] = useState({ count: 0, unread: 0 });
  const [query, setQuery] = useState("");
  const [partnerTyping, setPartnerTyping] = useState(false);
  const location = useLocation();
  const initialConversation = location.state?.conversation || null;

  const listRef = useRef(null);
  const bottomRef = useRef(null);
  const socketRef = useRef(null);
  const typingTimerRef = useRef(null);

  // Debounce search with useDeferredValue
  const deferredQuery = useDeferredValue(query);

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, partnerTyping]);

  const convKeyOf = (c) =>
    c ? `${c.partner?._id || ""}_${c.property?._id || "noProperty"}` : "";

  // --- Socket.io setup ---
  useEffect(() => {
    const token = localStorage.getItem("token");
    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket"],
    });
    socketRef.current = socket;
    return () => socket.disconnect();
  }, []);

  // Join room and listen for events when conversation changes
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !selectedConversation || !user) return;

    const partnerId = selectedConversation.partner?._id;
    const propId = selectedConversation.property?._id;
    const roomKey = getRoomKey(user._id, partnerId, propId);

    socket.emit("join_room", { senderId: user._id, receiverId: partnerId, propertyId: propId });

    const handleReceive = (msg) => {
      // Only append if from partner (our own messages already appended optimistically)
      const senderId = msg.sender?._id?.toString() || msg.sender?.toString();
      if (senderId !== user._id?.toString()) {
        setMessages((prev) => [...prev, msg]);
        // Update conversation preview
        setConversations((prev) =>
          prev.map((c) =>
            convKeyOf(c) === convKeyOf(selectedConversation)
              ? { ...c, lastMessage: msg.content, updatedAt: msg.createdAt }
              : c
          )
        );
      }
    };

    const handleTyping = ({ senderId }) => {
      if (senderId !== user._id?.toString()) setPartnerTyping(true);
    };

    const handleStopTyping = ({ senderId }) => {
      if (senderId !== user._id?.toString()) setPartnerTyping(false);
    };

    socket.on("receive_message", handleReceive);
    socket.on("user_typing", handleTyping);
    socket.on("user_stop_typing", handleStopTyping);

    return () => {
      socket.off("receive_message", handleReceive);
      socket.off("user_typing", handleTyping);
      socket.off("user_stop_typing", handleStopTyping);
      setPartnerTyping(false);
    };
  }, [selectedConversation, user]);

  // Fetch conversations
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setLoadingConvs(true);
        const token = localStorage.getItem("token");
        const [listRes, countRes] = await Promise.all([
          API.get("/messages/conversations", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          API.get("/messages/conversations/count", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        const data = Array.isArray(listRes.data) ? listRes.data : (listRes.data?.conversations ?? []);
        if (initialConversation) {
          const listKeys = new Set(data.map(convKeyOf));
          const initKey = convKeyOf(initialConversation);
          if (initKey && !listKeys.has(initKey)) data.unshift(initialConversation);
        }
        setConversations(data);
        setConvStats({
          count: Number(countRes.data?.count) || data.length,
          unread: Number(countRes.data?.unread) || 0,
        });
        if (initialConversation) setSelectedConversation(initialConversation);
      } catch (err) {
        console.error("Failed to load conversations", err);
      } finally {
        setLoadingConvs(false);
      }
    };
    fetchConversations();
  }, [initialConversation]);

  // Filtered list (debounced)
  const filtered = useMemo(() => {
    if (!deferredQuery.trim()) return conversations;
    const q = deferredQuery.toLowerCase();
    return conversations.filter((c) => {
      const name = c.partner?.ownerKYC?.ownerName || c.partner?.name || "";
      return (
        name.toLowerCase().includes(q) ||
        (c.property?.title || "").toLowerCase().includes(q) ||
        (c.lastMessage || "").toLowerCase().includes(q)
      );
    });
  }, [deferredQuery, conversations]);

  // Fetch messages for selected conversation
  useEffect(() => {
    if (!selectedConversation) return;
    const fetchMessages = async () => {
      try {
        setLoadingMsgs(true);
        const token = localStorage.getItem("token");
        const partnerId = selectedConversation.partner?._id;
        const propId = selectedConversation.property?._id;
        const url = propId
          ? `/messages/${partnerId}?propertyId=${propId}`
          : `/messages/${partnerId}`;
        const res = await API.get(url, { headers: { Authorization: `Bearer ${token}` } });
        setMessages(res.data || []);
        setConversations((prev) =>
          prev.map((c) =>
            convKeyOf(c) === convKeyOf(selectedConversation) ? { ...c, unreadCount: 0 } : c
          )
        );
        requestAnimationFrame(() => {
          listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
        });
      } catch (err) {
        console.error("Failed to load messages", err);
      } finally {
        setLoadingMsgs(false);
      }
    };
    fetchMessages();
  }, [selectedConversation]);

  // Emit typing events
  const handleTypingInput = useCallback(
    (e) => {
      setNewMessage(e.target.value);
      if (!selectedConversation || !user || !socketRef.current) return;
      const partnerId = selectedConversation.partner?._id;
      const propId = selectedConversation.property?._id;
      const roomKey = getRoomKey(user._id, partnerId, propId);
      socketRef.current.emit("typing", { senderId: user._id, receiverId: partnerId, propertyId: propId });
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        socketRef.current?.emit("stop_typing", { senderId: user._id, receiverId: partnerId, propertyId: propId });
      }, 1500);
    },
    [selectedConversation, user]
  );

  const handleSend = useCallback(async () => {
    if (!newMessage.trim() || !selectedConversation || sending) return;
    // Stop typing indicator immediately
    if (socketRef.current && user && selectedConversation) {
      const partnerId = selectedConversation.partner?._id;
      const propId = selectedConversation.property?._id;
      const roomKey = getRoomKey(user._id, partnerId, propId);
      socketRef.current.emit("stop_typing", { senderId: user._id, receiverId: partnerId, propertyId: selectedConversation.property?._id });
      clearTimeout(typingTimerRef.current);
    }
    try {
      setSending(true);
      const token = localStorage.getItem("token");
      const payload = {
        propertyId: selectedConversation.property?._id || undefined,
        receiverId: selectedConversation.partner?._id,
        content: newMessage.trim(),
      };
      const res = await API.post("/messages", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages((prev) => [...prev, res.data]);
      setNewMessage("");
      setConversations((prev) => {
        const key = convKeyOf(selectedConversation);
        return prev.map((c) =>
          convKeyOf(c) === key
            ? { ...c, lastMessage: res.data?.content, updatedAt: res.data?.createdAt }
            : c
        );
      });
      requestAnimationFrame(() => {
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
      });
    } catch (err) {
      console.error("Failed to send", err);
    } finally {
      setSending(false);
    }
  }, [newMessage, selectedConversation, sending, user]);

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const headerName = useMemo(
    () =>
      selectedConversation?.partner?.ownerKYC?.ownerName ||
      selectedConversation?.partner?.name ||
      "User",
    [selectedConversation]
  );
  const headerProp = selectedConversation?.property?.title || "Property";

  const showListMobile = !selectedConversation;

  return (
    <div className="flex h-[100dvh] bg-paper">

      {/* ── Left sidebar: conversation list ── */}
      <aside
        className={`${
          showListMobile ? "flex" : "hidden"
        } md:flex flex-col bg-card border-r border-rule`}
        style={{ width: "280px", minWidth: "280px" }}
      >
        {/* Sidebar header */}
        <div className="px-5 pt-6 pb-4 border-b border-rule">
          <h2 className="font-display text-2xl text-ink tracking-tight">Inbox</h2>
          <p className="font-eyebrow text-muted mt-0.5">
            {convStats.unread > 0
              ? `${convStats.unread} unread across ${convStats.count} conversations`
              : "Messages"}
          </p>

          {/* Search */}
          <div className="relative mt-4">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="input-warm pl-9 py-2 text-sm"
              placeholder="Search conversations…"
            />
            <svg
              className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.75}
                d="M21 21l-4.35-4.35M16.65 16.65A7.5 7.5 0 101.5 9.15a7.5 7.5 0 0015.15 7.5z"
              />
            </svg>
          </div>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {loadingConvs ? (
            [...Array(7)].map((_, i) => (
              <div key={i} className="flex items-start gap-3 px-4 py-4 border-b border-rule animate-pulse">
                <div className="w-10 h-10 rounded-full bg-[#e8e2d3] flex-shrink-0" />
                <div className="flex-1 min-w-0 space-y-2 pt-0.5">
                  <div className="flex justify-between">
                    <div className="h-3.5 w-28 bg-[#e8e2d3] rounded-full" />
                    <div className="h-3 w-10 bg-[#e8e2d3] rounded-full" />
                  </div>
                  <div className="h-2.5 w-3/4 bg-[#e8e2d3] rounded-full" />
                  <div className="h-2.5 w-1/2 bg-[#e8e2d3] rounded-full" />
                </div>
              </div>
            ))
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <span className="font-display text-3xl text-rule select-none">✦</span>
              <p className="mt-3 text-sm text-muted">No conversations found</p>
            </div>
          ) : (
            filtered.map((conv, idx) => {
              const active =
                selectedConversation &&
                conv.partner?._id === selectedConversation.partner?._id &&
                (conv.property?._id || "noProperty") ===
                  (selectedConversation.property?._id || "noProperty");
              const name = conv.partner?.ownerKYC?.ownerName || conv.partner?.name || "Unknown";
              const unread = Number(conv.unreadCount) > 0;
              const time = formatTime(conv.updatedAt || conv.lastMessageAt);

              return (
                <button
                  key={`${conv.partner?._id}_${conv.property?._id || idx}`}
                  onClick={() => setSelectedConversation(conv)}
                  className={`
                    w-full text-left px-4 py-4 flex items-start gap-3 transition-colors
                    border-b border-rule focus:outline-none focus-visible:ring-2
                    focus-visible:ring-accent/40
                    ${active
                      ? "bg-accent/10 border-l-2 border-l-accent pl-[14px]"
                      : "hover:bg-paper border-l-2 border-l-transparent"
                    }
                  `}
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div
                      className={`
                        w-10 h-10 rounded-full flex items-center justify-center
                        text-sm font-semibold select-none
                        ${active ? "bg-accent text-white" : "bg-accent/15 text-accent"}
                      `}
                    >
                      {initials(name)}
                    </div>
                    {/* Unread dot */}
                    {unread && (
                      <span className="absolute -right-0.5 -top-0.5 w-2.5 h-2.5 rounded-full bg-accent ring-2 ring-card" />
                    )}
                  </div>

                  {/* Text content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className={`text-sm truncate ${unread ? "font-semibold text-ink" : "font-medium text-ink"}`}>
                        {name}
                      </p>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {time && (
                          <span className="font-eyebrow text-[10px] text-muted">{time}</span>
                        )}
                        {unread && (
                          <span className="bg-accent text-white text-xs rounded-full px-1.5 py-px font-semibold leading-none">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-muted truncate mt-0.5 italic">
                      {conv.property?.title || "Property"}
                    </p>
                    <p className={`text-sm truncate mt-0.5 ${unread ? "text-ink" : "text-muted"}`}>
                      {conv.lastMessage || "Tap to view messages"}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* ── Center: chat area ── */}
      <section
        className={`${
          showListMobile ? "hidden" : "flex"
        } md:flex flex-1 flex-col min-w-0 bg-card`}
      >
        {selectedConversation ? (
          <>
            {/* Chat header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-rule bg-card sticky top-0 z-10">
              {/* Mobile back button */}
              <button
                className="md:hidden -ml-1 mr-0.5 w-8 h-8 rounded-full flex items-center justify-center
                  hover:bg-paper transition-colors text-muted hover:text-ink"
                onClick={() => setSelectedConversation(null)}
                aria-label="Back to conversations"
                type="button"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {/* Partner avatar */}
              <div className="w-9 h-9 rounded-full bg-accent/15 text-accent flex items-center justify-center
                text-sm font-semibold flex-shrink-0 select-none">
                {initials(headerName)}
              </div>

              {/* Names */}
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-ink text-sm truncate">{headerName}</p>
                <p className="font-eyebrow text-muted truncate">{headerProp}</p>
              </div>
            </div>

            {/* Messages scroll area */}
            <div
              ref={listRef}
              className="flex-1 overflow-y-auto px-5 py-6 space-y-3 bg-paper/40 scrollbar-hide"
            >
              {loadingMsgs ? (
                [...Array(7)].map((_, i) => (
                  <div
                    key={i}
                    className={`flex items-end gap-2 animate-pulse ${i % 2 ? "justify-end" : "justify-start"}`}
                  >
                    {!(i % 2) && <div className="w-7 h-7 rounded-full bg-[#e8e2d3] flex-shrink-0" />}
                    <div
                      className={`rounded-2xl bg-[#e8e2d3] ${i % 2 ? "w-44 h-10" : "w-56 h-12"}`}
                      style={{ maxWidth: "65%" }}
                    />
                  </div>
                ))
              ) : messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center gap-3 text-center select-none">
                  <span className="font-display text-5xl text-rule">✦</span>
                  <p className="font-display text-xl text-ink/60">
                    Say hello and start the conversation
                  </p>
                  <p className="text-sm text-muted">Your messages will appear here</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const mine =
                    msg.sender?._id?.toString() === user._id?.toString() ||
                    msg.sender?.toString() === user._id?.toString();
                  return (
                    <div
                      key={msg._id}
                      className={`flex w-full items-end gap-2 ${mine ? "justify-end" : "justify-start"}`}
                    >
                      {/* Partner avatar on received messages */}
                      {!mine && (
                        <div className="w-7 h-7 rounded-full bg-accent/15 text-accent flex items-center
                          justify-center text-[10px] font-semibold flex-shrink-0 select-none mb-0.5">
                          {initials(headerName)}
                        </div>
                      )}

                      {/* Bubble */}
                      <div
                        className={`
                          max-w-[85%] sm:max-w-[72%] md:max-w-[60%] px-4 py-2.5
                          ${mine
                            ? "bg-accent text-white rounded-2xl rounded-tr-sm shadow-sm"
                            : "bg-paper border border-rule text-ink rounded-2xl rounded-tl-sm"
                          }
                        `}
                      >
                        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                          {msg.content}
                        </p>
                        <p className={`mt-1 text-[10px] ${mine ? "text-white/70" : "text-muted"} text-right`}>
                          {formatTime(msg.createdAt)}
                        </p>
                      </div>

                      {/* Own avatar on sent messages */}
                      {mine && (
                        <div className="w-7 h-7 rounded-full bg-accent/20 text-accent flex items-center
                          justify-center text-[10px] font-semibold flex-shrink-0 select-none mb-0.5">
                          {initials(user?.name || "Me")}
                        </div>
                      )}
                    </div>
                  );
                })
              )}

              {/* Typing indicator */}
              {partnerTyping && (
                <div className="flex items-end gap-2 justify-start">
                  <div className="w-7 h-7 rounded-full bg-accent/15 text-accent flex items-center
                    justify-center text-[10px] font-semibold flex-shrink-0 select-none mb-0.5">
                    {initials(headerName)}
                  </div>
                  <div className="bg-paper border border-rule rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1">
                    {[0, 150, 300].map((delay) => (
                      <span
                        key={delay}
                        className="w-2 h-2 rounded-full bg-muted animate-bounce"
                        style={{ animationDelay: `${delay}ms` }}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Message composer */}
            <div
              className="bg-card border-t border-rule px-3 py-3 sticky bottom-0"
              style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)" }}
            >
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Type a message…"
                  className="input-warm flex-1 rounded-full py-2.5 text-sm"
                  value={newMessage}
                  onChange={handleTypingInput}
                  onKeyDown={onKeyDown}
                  disabled={sending}
                />
                <button
                  onClick={handleSend}
                  disabled={sending || !newMessage.trim()}
                  className="btn-accent rounded-full w-10 h-10 p-0 flex-shrink-0 disabled:opacity-40
                    disabled:cursor-not-allowed disabled:active:scale-100"
                  type="button"
                  aria-label="Send message"
                >
                  {sending ? (
                    /* Spinner */
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                  ) : (
                    /* Send arrow */
                    <svg className="w-4 h-4 translate-x-px" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2}
                        d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                    </svg>
                  )}
                </button>
              </div>
              <p className="mt-1.5 text-center font-eyebrow text-muted" style={{ fontSize: "10px" }}>
                Enter to send &nbsp;·&nbsp; Shift+Enter for newline
              </p>
            </div>
          </>
        ) : (
          /* Empty state — no conversation selected */
          <div className="flex-1 flex flex-col items-center justify-center gap-4 px-8 text-center select-none">
            <span className="font-display text-6xl text-rule leading-none">✦</span>
            <h3 className="font-display text-2xl text-ink/70 leading-snug">
              Select a conversation<br />to start chatting
            </h3>
            <p className="text-sm text-muted max-w-xs">
              Choose someone from the list on the left and your messages will appear here.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
