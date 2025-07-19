import admin from 'firebase-admin';

export class NotificationService {
  async sendTaskCompletionNotification(userId: string, taskId: number): Promise<void> {
    // Use Firebase to send push
    const message = { notification: { title: 'Task Completion', body: 'Confirm if task is done?' } };
    await admin.messaging().sendToDevice('user_token', message);
  }
}

export const notificationService = new NotificationService(); 