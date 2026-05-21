import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '../constants/config';

let socket: Socket | null = null;

export const connectSocket = (token: string): Socket => {
  if (socket?.connected) return socket;

  socket = io(`${SOCKET_URL}/live`, {
    auth: { token },
    transports: ['websocket'],
  });

  return socket;
};

export const disconnectSocket = () => {
  socket?.disconnect();
  socket = null;
};

export const getSocket = () => socket;

export const joinOrderRoom = (orderId: string) => {
  socket?.emit('join:order', { orderId });
};

export const onOrderStatus = (
  callback: (data: { orderId: string; status: string }) => void,
) => {
  socket?.on('order:status', callback);
  return () => socket?.off('order:status', callback);
};

export const onRiderLocation = (
  callback: (data: {
    orderId: string;
    latitude: number;
    longitude: number;
    heading?: number;
  }) => void,
) => {
  socket?.on('rider:location', callback);
  return () => socket?.off('rider:location', callback);
};

export const emitRiderLocation = (data: {
  orderId: string;
  latitude: number;
  longitude: number;
  heading?: number;
}) => {
  socket?.emit('rider:location', data);
};
