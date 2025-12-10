export type MessageType = 'ALERT' | 'UPDATE_STATE' | 'INIT';

export interface WebviewMessage {
  type: MessageType;
  payload: any;
}

export const createMessage = (type: MessageType, payload: any): WebviewMessage => ({
  type,
  payload,
});
