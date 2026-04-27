import { useCallback, useEffect, useRef, useState } from "react";
import API from "../services/api";
import { getSocket } from "../services/socket";
import { useAuth } from "../context/AuthContext";

export function useNotifications() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const handlerRef = useRef(null);

  const fetchList = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      setLoading(true);
      const [listRes, countRes] = await Promise.all([
        API.get("/notifications?limit=20", { headers: { Authorization: `Bearer ${token}` } }),
        API.get("/notifications/unread-count", { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setItems(Array.isArray(listRes.data) ? listRes.data : []);
      setUnread(Number(countRes.data?.count) || 0);
    } catch (e) { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  // Initial load
  useEffect(() => {
    if (!user?._id) { setItems([]); setUnread(0); return; }
    fetchList();
  }, [user?._id, fetchList]);

  // Socket subscription
  useEffect(() => {
    if (!user?._id) return;
    const socket = getSocket();

    const onConnect = () => {
      socket.emit("auth:join", { userId: user._id });
    };
    const onNew = (n) => {
      setItems((prev) => [n, ...prev].slice(0, 20));
      setUnread((c) => c + 1);
    };
    handlerRef.current = onNew;

    if (socket.connected) onConnect();
    socket.on("connect", onConnect);
    socket.on("notification:new", onNew);
    return () => {
      socket.off("connect", onConnect);
      socket.off("notification:new", onNew);
    };
  }, [user?._id]);

  const markOneRead = useCallback(async (id) => {
    setItems((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
    setUnread((c) => Math.max(0, c - 1));
    try {
      const token = localStorage.getItem("token");
      await API.patch(`/notifications/${id}/read`, {}, { headers: { Authorization: `Bearer ${token}` } });
    } catch (e) { /* rollback? keep optimistic */ }
  }, []);

  const markAllRead = useCallback(async () => {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnread(0);
    try {
      const token = localStorage.getItem("token");
      await API.patch("/notifications/read-all", {}, { headers: { Authorization: `Bearer ${token}` } });
    } catch (e) { /* ignore */ }
  }, []);

  const removeOne = useCallback(async (id) => {
    const removed = items.find((n) => n._id === id);
    setItems((prev) => prev.filter((n) => n._id !== id));
    if (removed && !removed.read) setUnread((c) => Math.max(0, c - 1));
    try {
      const token = localStorage.getItem("token");
      await API.delete(`/notifications/${id}`, { headers: { Authorization: `Bearer ${token}` } });
    } catch (e) { /* ignore */ }
  }, [items]);

  return { items, unread, loading, fetchList, markOneRead, markAllRead, removeOne };
}
