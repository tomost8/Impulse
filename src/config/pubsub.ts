import { createPubSub } from '@graphql-yoga/subscription';

// Create a shared PubSub instance
export const pubsub = createPubSub();

// Chat related events
export const CHAT_MESSAGE_SENT = 'CHAT_MESSAGE_SENT';
export const CHAT_TYPING_STATUS = 'CHAT_TYPING_STATUS';
export const CHAT_USER_ONLINE = 'CHAT_USER_ONLINE';

// Post related events
export const POST_CREATED = 'POST_CREATED';
export const POST_UPDATED = 'POST_UPDATED';
export const POST_DELETED = 'POST_DELETED';
export const POST_LIKED = 'POST_LIKED';

// Activity related events
export const ACTIVITY_CREATED = 'ACTIVITY_CREATED';
export const ACTIVITY_STATUS_CHANGED = 'ACTIVITY_STATUS_CHANGED';
export const ACTIVITY_EXPIRED = 'ACTIVITY_EXPIRED';

// Notification related events
export const NOTIFICATION_CREATED = 'NOTIFICATION_CREATED';
export const NOTIFICATION_READ = 'NOTIFICATION_READ';

// Friendship related events
export const FRIEND_REQUEST_SENT = 'FRIEND_REQUEST_SENT';
export const FRIEND_REQUEST_ACCEPTED = 'FRIEND_REQUEST_ACCEPTED';
export const FRIEND_ONLINE_STATUS = 'FRIEND_ONLINE_STATUS'; 