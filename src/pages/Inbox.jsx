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
        const res = await API.get("/messages/conversations", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = Array.isArray(res.data) ? res.data : (res.data?.conversations ?? []);
        if (initialConversation) {
          const listKeys = new Set(data.map(convKeyOf));
          const initKey = convKeyOf(initialConversation);
          if (initKey && !listKeys.has(initKey)) data.unshift(initialConversation);
        }
        setConversations(data);
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
    <div className="flex h-[100dvh] bg-gradient-to-b from-gray-50 to-gray-100">
      {/* List pane */}
      <aside
        className={`${
          showListMobile ? "flex" : "hidden"
        } md:flex md:w-1/3 lg:w-1/4 w-full bg-white border-r border-gray-200 flex-col`}
      >
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b px-4 py-3">
          <h2 className="font-semibold text-lg tracking-tight">Inbox</h2>
          <div className="mt-3 relative">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 pl-9 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
              placeholder="Search name, property, message…"
            />
            <svg
              className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-4.35-4.35M16.65 16.65A7.5 7.5 0 101.5 9.15a7.5 7.5 0 0015.15 7.5z"
              />
            </svg>
          </div>
        </div>

        <div className="overflow-y-auto divide-y divide-gray-100">
          {loadingConvs ? (
            [...Array(6)].map((_, i) => (
              <div key={i} className="p-4 animate-pulse">
                <div className="h-4 w-24 bg-gray-200 rounded mb-2" />
                <div className="h-3 w-40 bg-gray-100 rounded mb-2" />
                <div className="h-2 w-32 bg-gray-100 rounded" />
              </div>
            ))
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No conversations</div>
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
                  className={`w-full text-left p-4 transition relative ${
                    active ? "bg-blue-50/70" : "hover:bg-gray-50"
                  } focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40`}
                >
                  <div className="flex items-start gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-white grid place-items-center font-semibold shadow-sm">
                        {initials(name)}
                      </div>
                      {unread && (
                        <span className="absolute -right-1 -top-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-gray-900 truncate">{name}</p>
                        {time && <span className="text-[11px] text-gray-400 ml-2">{time}</span>}
                      </div>
                      <p className="text-xs text-gray-500 italic truncate">
                        {conv.property?.title || "Property"}
                      </p>
                      <p className={`text-sm truncate mt-0.5 ${unread ? "text-gray-900 font-medium" : "text-gray-600"}`}>
                        {conv.lastMessage || "Tap to view messages"}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* Chat pane */}
      <section
        className={`${
          showListMobile ? "hidden" : "flex"
        } md:flex flex-1 flex-col min-w-0`}
      >
        {selectedConversation ? (
          <>
            {/* Header */}
            <div className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur px-4 py-3">
              <div className="flex items-center gap-3">
                <button
                  className="md:hidden -ml-2 mr-1 px-2 py-1 rounded hover:bg-gray-100"
                  onClick={() => setSelectedConversation(null)}
                  aria-label="Back to conversations"
                  type="button"
                >
                  ←
                </button>
                <div className="w-9 h-9 rounded-full bg-gray-200 grid place-items-center text-sm font-semibold">
                  {initials(headerName)}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold truncate">{headerName}</p>
                  <p className="text-xs text-gray-500 truncate">{headerProp}</p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div
              ref={listRef}
              className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-50 via-white to-white"
            >
              {loadingMsgs ? (
                [...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className={`flex gap-2 items-start ${i % 2 ? "justify-end" : "justify-start"} animate-pulse`}
                  >
                    <div className="w-8 h-8 rounded-full bg-gray-200" />
                    <div className="h-14 w-56 max-w-[70%] rounded-2xl bg-gray-200" />
                  </div>
                ))
              ) : messages.length === 0 ? (
                <div className="h-full grid place-items-center text-gray-500">
                  Say hello and start the conversation
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
                      {!mine && (
                        <div className="w-8 h-8 rounded-full bg-gray-200 grid place-items-center text-[11px] font-medium">
                          {initials(headerName)}
                        </div>
                      )}
                      <div
                        className={`max-w-[85%] sm:max-w-[75%] md:max-w-[65%] rounded-2xl px-4 py-2.5 shadow-sm ${
                          mine
                            ? "bg-blue-600 text-white rounded-br-md"
                            : "bg-gray-100 text-gray-900 rounded-bl-md"
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                        <div className={`mt-1.5 text-[11px] ${mine ? "text-white/80" : "text-gray-500"}`}>
                          {formatTime(msg.createdAt)}
                        </div>
                      </div>
                      {mine && (
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 grid place-items-center text-[11px] font-semibold">
                          {initials("You")}
                        </div>
                      )}
                    </div>
                  );
                })
              )}

              {/* Typing indicator */}
              {partnerTyping && (
                <div className="flex items-end gap-2 justify-start">
                  <div className="w-8 h-8 rounded-full bg-gray-200 grid place-items-center text-[11px] font-medium">
                    {initials(headerName)}
                  </div>
                  <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3 flex gap-1">
                    {[0, 150, 300].map((delay) => (
                      <span
                        key={delay}
                        className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                        style={{ animationDelay: `${delay}ms` }}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Composer */}
            <div
              className="border-t bg-white/80 backdrop-blur px-3 py-3 sticky bottom-0"
              style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)" }}
            >
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Type a message…"
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition"
                  value={newMessage}
                  onChange={handleTypingInput}
                  onKeyDown={onKeyDown}
                  disabled={sending}
                />
                <button
                  onClick={handleSend}
                  disabled={sending || !newMessage.trim()}
                  className="bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition shadow-sm"
                  type="button"
                >
                  {sending ? "Sending…" : "Send"}
                </button>
              </div>
              <p className="mt-1 text-[11px] text-gray-500">
                Press Enter to send • Shift+Enter for newline
              </p>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center flex-1 text-gray-500">
            Select a conversation to start chatting
          </div>
        )}
      </section>
    </div>
  );
}
