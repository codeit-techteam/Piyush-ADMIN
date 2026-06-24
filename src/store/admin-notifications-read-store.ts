import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AdminNotificationsReadState {
  readIds: string[];
  markRead: (ids: string[]) => void;
  markAllRead: (ids: string[]) => void;
  isRead: (id: string) => boolean;
}

export const useAdminNotificationsReadStore = create<AdminNotificationsReadState>()(
  persist(
    (set, get) => ({
      readIds: [],
      markRead: (ids) =>
        set((state) => ({
          readIds: [...new Set([...state.readIds, ...ids])],
        })),
      markAllRead: (ids) => get().markRead(ids),
      isRead: (id) => get().readIds.includes(id),
    }),
    { name: "admin-notifications-read" },
  ),
);
