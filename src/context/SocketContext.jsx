/*
 * REFACTORED: SocketContext.jsx
 * Fixes: Memory leaks, Race conditions, Redundant re-renders
 * Update: Fixed connection logic to use Cloudflare Proxy
 */
import React, { createContext, useContext, useEffect, useState, useRef, useMemo } from 'react';
import { io } from 'socket.io-client';
import { UserContext } from '../App';
import toast from 'react-hot-toast';

const SocketContext = createContext();

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
    const socketRef = useRef(null);
    const { userAuth } = useContext(UserContext);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        // Create socket only once
        if (!socketRef.current) {
            console.log("🔄 Creating socket connection...");
            
            // CRITICAL FIX: Use window.location.origin to trigger Cloudflare Proxy
            // This ensures requests go to https://your-site.pages.dev/socket.io/
            // which Cloudflare then forwards to your Google Cloud Run backend.
            const newSocket = io(window.location.origin, {
                withCredentials: true,
                reconnection: true,
                reconnectionDelay: 1000,
                reconnectionAttempts: 5,
                autoConnect: true,
                transports: ['websocket', 'polling'] // Ensure specific transports are allowed
            });

            newSocket.on('connect', () => {
                console.log("✅ Socket connected:", newSocket.id);
                setIsConnected(true);
            });

            newSocket.on('connect_error', (err) => {
                console.error("❌ Socket connection error:", err.message);
                setIsConnected(false);
            });

            newSocket.on('disconnect', () => {
                console.log("🔌 Socket disconnected");
                setIsConnected(false);
            });

            // Global listeners
            newSocket.on('new_notification', () => {
                toast('You have a new notification!', { icon: '🔔' });
            });

            socketRef.current = newSocket;
        }

        return () => {
            if (socketRef.current) {
                console.log("🔌 Disconnecting socket...");
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, []);

    // Separate effect for user-specific room joining
    useEffect(() => {
        const socket = socketRef.current;
        if (socket && isConnected && userAuth?.id) {
            console.log(`Joining notification room for user: ${userAuth.id}`);
            socket.emit('joinNotificationRoom', { userId: userAuth.id });
        }
    }, [userAuth?.id, isConnected]);

    // Memoize value to prevent context re-renders
    const value = useMemo(() => ({
        socket: socketRef.current,
        isConnected
    }), [isConnected]);

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
};