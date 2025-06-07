import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export type RobotState = 'idle' | 'busy';

export interface RobotLocation {
  floor: number;
  room: string;
  x: number;
  y: number;
  yaw: number;
}

export interface RobotStatusMsg {
  status: RobotState;
  currentLocation: RobotLocation;
}

export function useRobotSocket(): RobotStatusMsg {
  // default initial state
  const [status, setStatus] = useState<RobotState>('idle');
  const [currentLocation, setCurrentLocation] = useState<RobotLocation>({
    floor: 1,
    room: 'Lobby',
    x: 0,
    y: 0,
    yaw: 0,
  });

  useEffect(() => {
    // connect to your backend’s Socket.IO server
    const socket: Socket = io('http://localhost:3001', {
      path: '/socket.io'
    });

    socket.on('connect', () => {
      console.log(' Socket connected');
    });

    // whenever the backend emits “robot_status”, update local state
    socket.on('robot_status', (msg: RobotStatusMsg) => {
      console.log('Received robot_status', msg);
      setStatus(msg.status);
      setCurrentLocation(msg.currentLocation);
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return { status, currentLocation };
}
