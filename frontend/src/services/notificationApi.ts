import { api } from './api'
import type { NotificationItem } from '@/types/notification'

export async function listNotifications(tripId: string): Promise<NotificationItem[]> {
  const { data } = await api.get<NotificationItem[]>('/notifications/', { params: { trip: tripId } })
  return data
}

export async function markNotificationRead(id: string): Promise<NotificationItem> {
  const { data } = await api.patch<NotificationItem>(`/notifications/${id}/`, { isRead: true })
  return data
}

export async function markAllNotificationsRead(tripId: string): Promise<void> {
  await api.post('/notifications/mark-all-read/', { trip: tripId })
}
