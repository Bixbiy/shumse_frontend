/*
 * OPTIMIZED SocketContext.jsx - PREVENTS RE-RENDERS
 */
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { userContext } from '../App';
import toast from 'react-hot-toast';

const SocketContext = createContext();

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const { userAuth } = useContext(userContext);
    const socketRef = useRef(null); // Use ref to prevent re-renders

    useEffect(() => {
        // Only create socket once
        if (socketRef.current) return;

        console.log("🔄 Creating socket connection...");
        const newSocket = io(import.meta.env.VITE_SERVER_DOMAIN, {
            withCredentials: true,
        });

        socketRef.current = newSocket;

        newSocket.on('connect', () => {
            console.log("✅ Socket connected:", newSocket.id);
            setSocket(newSocket); // Only set state once when connected
        });

        newSocket.on('connect_error', (err) => {
            console.error("❌ Socket connection error:", err.message);
        });

        newSocket.on('new_notification', (notification) => {
            console.log('📢 New notification received');
            toast('You have a new notification!', { icon: '🔔' });
        });

        newSocket.on('readitPostVoted', ({ postId, votes }) => {
            console.log('👍 Post voted:', postId);
        });
        
        newSocket.on('newReaditComment', (comment) => {
            console.log('💬 New comment received');
        });

        // Join notification room when user logs in
        if (userAuth?.id) {
            newSocket.emit('joinNotificationRoom', { userId: userAuth.id });
        }

        return () => {
            console.log("🔌 Disconnecting socket...");
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, []); // Empty dependency array - only run once

    return (
        <SocketContext.Provider value={{ socket }}>
            {children}
        </SocketContext.Provider>
    );
};