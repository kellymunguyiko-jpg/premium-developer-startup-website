export type NotificationType = "follow" | "missed_video_call" | "video_call" | "message";

export interface AppNotification {
  id: string;
  toUid: string;
  fromUid: string;
  fromName: string;
  fromPhoto: string | null;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  createdAt: number;
  meta?: Record<string, string>;
}

export interface VideoItem {
  id: string;
  title: string;
  about: string;
  image: string;
  videoUrl: string;
  createdAt: number;
  createdBy: string;
}

export const VIDEO_CALL_LIMIT_SEC = 90; // 1 minute 30 seconds
