/*
 * MODIFIED FILE
 * Path: src/context/SocketContext.jsx
 */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { userContext } from '../App';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

const SocketContext = createContext();

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const { userAuth } = useContext(userContext);
    
    // Safely get queryClient
    let queryClient;
    try {
        queryClient = useQueryClient();
    } catch (error) {
        console.warn('QueryClient not available in SocketProvider:', error.message);
    }

    useEffect(() => {
        // Connect to the socket server
        const newSocket = io(import.meta.env.VITE_SERVER_DOMAIN, {
            withCredentials: true, 
        });

        // Debugging listeners
        newSocket.on('connect', () => {
            console.log("Socket connected:", newSocket.id);
        });

        newSocket.on('connect_error', (err) => {
            console.error("Socket connection error:", err.message);
        });

        // --- NEW: Real-time listeners ---
        
        // Listener for new notifications
        newSocket.on('new_notification', (notification) => {
            console.log('New notification received:', notification);
            toast('You have a new notification!', { icon: '🔔' });
            
            if (queryClient) {
                queryClient.invalidateQueries({ queryKey: ['newNotificationCheck'] });
                queryClient.invalidateQueries({ queryKey: ['notifications'] });
            }
        });

        // Listener for post votes
        newSocket.on('readitPostVoted', ({ postId, votes, upvotedBy, downvotedBy }) => {
            if (queryClient) {
                queryClient.setQueryData(['readitPost', postId], (oldData) => {
                    if (!oldData) return;
                    return { ...oldData, votes, upvotedBy, downvotedBy };
                });
                queryClient.invalidateQueries({ queryKey: ['readitFeed'] });
                queryClient.invalidateQueries({ queryKey: ['communityPosts'] });
            }
        });
        
        // Listener for new comments
        newSocket.on('newReaditComment', (comment) => {
            if (queryClient) {
                queryClient.invalidateQueries({ queryKey: ['readitComments', comment.post] });
                queryClient.invalidateQueries({ queryKey: ['readitPost', comment.post] });
            }
        });

        setSocket(newSocket);

        // --- NEW: Join notification room when user logs in ---
        if (userAuth && userAuth.id) {
            newSocket.emit('joinNotificationRoom', { userId: userAuth.id });
        }

        // Disconnect on component unmount
        return () => {
            console.log("Disconnecting socket...");
            newSocket.disconnect();
        };
    }, [queryClient, userAuth]); // Add dependencies

    return (
        <SocketContext.Provider value={{ socket }}>
            {children}
        </SocketContext.Provider>
    );
};