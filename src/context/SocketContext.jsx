import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        // Connect to the socket server
        const newSocket = io(import.meta.env.VITE_SERVER_DOMAIN, {
            // --------------------------------------------------------
            // THE FIX: Client Credentials
            // --------------------------------------------------------
            // This tells the client to send the cookies/auth info
            // required by the server's "credentials: true" policy.
            // --------------------------------------------------------
            withCredentials: true, 
        });

        // Debugging listeners
        newSocket.on('connect', () => {
            console.log("Socket connected:", newSocket.id);
        });

        newSocket.on('connect_error', (err) => {
            console.error("Socket connection error:", err.message);
        });

        setSocket(newSocket);

        // Disconnect on component unmount
        return () => {
            console.log("Disconnecting socket...");
            newSocket.disconnect();
        };
    }, []);

    return (
        <SocketContext.Provider value={{ socket }}>
            {children}
        </SocketContext.Provider>
    );
};