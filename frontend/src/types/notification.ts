export type NotificationType =
  | 'expense_added'
  | 'budget_updated'
  | 'photo_uploaded'
  | 'member_joined'
  | 'settlement_paid'

export interface NotificationItem {
  id: string
  trip: string
  notifType: NotificationType
  message: string
  isRead: boolean
  createdAt: string
}
