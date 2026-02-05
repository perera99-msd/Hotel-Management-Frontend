"use client";

import { collection, deleteDoc, doc, limit, onSnapshot, orderBy, query, updateDoc, where } from 'firebase/firestore';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';

export interface NotificationItem {
    id: string;
    type: 'BOOKING' | 'ORDER' | 'SYSTEM' | 'TRIP';
    title: string;
    message: string;
    read: boolean;
    createdAt: any;
    data?: any;
    targetRoles?: string[];
    targetUserId?: string | null;
}

interface NotificationContextType {
    notifications: NotificationItem[];
    unreadCount: number;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    deleteNotification: (id: string) => Promise<void>;
    clearOldNotifications: (days?: number) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const { user, profile } = useAuth();

    // Track when the page loaded to prevent old sounds from playing
    const mountTimeRef = useRef(Date.now());
    const seenIdsRef = useRef<Set<string>>(new Set());

    // Audio ref to keep the instance available
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        // Pre-load audio
        if (typeof window !== 'undefined') {
            audioRef.current = new Audio('/sounds/notification.mp3');
        }
    }, []);

    useEffect(() => {
        if (!user || !profile) {
            setNotifications([]);
            seenIdsRef.current.clear();
            return;
        }

        const roleFilter = profile.roles?.length ? profile.roles : ['customer'];
        const unsubscribers: (() => void)[] = [];

        const handleSnapshot = (snapshot: any) => {
            let shouldPlaySound = false;

            snapshot.docChanges().forEach((change: any) => {
                if (change.type === 'added') {
                    const data = change.doc.data();
                    const docTime = data.createdAt?.seconds ? data.createdAt.seconds * 1000 : Date.now();

                    // Check if notification is new (arrived after page load & within last 30s)
                    const isRecent = docTime > mountTimeRef.current && (Date.now() - docTime) < 30000;

                    if (!data.read && isRecent && !seenIdsRef.current.has(change.doc.id)) {
                        shouldPlaySound = true;

                        // Show visual toast
                        toast.success(data.title, {
                            duration: 5000,
                            position: 'top-right',
                            icon: '🔔',
                            style: { border: '1px solid #2563eb', color: '#333' }
                        });
                    }
                }
            });

            setNotifications((prev) => {
                const merged = new Map<string, NotificationItem>();
                prev.forEach((n) => merged.set(n.id, n));

                snapshot.docs.forEach((doc: any) => {
                    const data = doc.data() as NotificationItem;
                    merged.set(doc.id, { ...data, id: doc.id } as NotificationItem);
                });

                const next = Array.from(merged.values()).sort((a, b) => {
                    const aTime = a.createdAt?.seconds || 0;
                    const bTime = b.createdAt?.seconds || 0;
                    return bTime - aTime;
                });

                // Add to seen set to prevent duplicate alerts
                next.forEach((n) => seenIdsRef.current.add(n.id));
                return next;
            });

            if (shouldPlaySound) playSound();
        };

        const handleError = (error: any) => {
            console.error('Notification Listener Error:', error);
        };

        const isCustomer = roleFilter.includes('customer') && roleFilter.length === 1;
        const isStaff = roleFilter.some(r => ['admin', 'receptionist', 'manager'].includes(r));

        // For customers: Only show notifications with their userId or targetUserId
        if (isCustomer && !isStaff && (profile as any)._id) {
            const customerQuery = query(
                collection(db, 'notifications'),
                where('userId', '==', (profile as any)._id),
                orderBy('createdAt', 'desc'),
                limit(50)
            );
            unsubscribers.push(onSnapshot(customerQuery, handleSnapshot, handleError));
        } else {
            // For staff: Show role-based notifications
            const roleQuery = query(
                collection(db, 'notifications'),
                where('targetRoles', 'array-contains-any', roleFilter),
                orderBy('createdAt', 'desc'),
                limit(50)
            );

            unsubscribers.push(onSnapshot(roleQuery, handleSnapshot, handleError));
        }

        return () => unsubscribers.forEach((unsub) => unsub());
    }, [user, profile]);

    const playSound = () => {
        try {
            if (audioRef.current) {
                const playPromise = audioRef.current.play();
                if (playPromise !== undefined) {
                    playPromise.catch((err) => {
                        console.warn('Audio playback blocked (user interaction required):', err);
                    });
                }
            }
        } catch (e) {
            console.error("Audio error:", e);
        }
    };

    const markAsRead = async (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        try {
            const notifRef = doc(db, 'notifications', id);
            await updateDoc(notifRef, { read: true });
        } catch (err) {
            console.error("Failed to mark as read in DB:", err);
        }
    };

    const markAllAsRead = async () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
        unreadIds.forEach(async (id) => {
            try {
                await updateDoc(doc(db, 'notifications', id), { read: true });
            } catch (e) { console.error(e) }
        });
    };

    const deleteNotification = async (id: string) => {
        setNotifications(prev => prev.filter((n) => n.id !== id));
        try {
            await deleteDoc(doc(db, 'notifications', id));
        } catch (err) {
            console.error('Failed to delete notification:', err);
        }
    };

    const clearOldNotifications = async (days = 30) => {
        const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
        const toDelete = notifications.filter((n) => {
            const ts = n.createdAt?.seconds ? n.createdAt.seconds * 1000 : Date.parse(n.createdAt);
            return ts && ts < cutoff;
        }).map((n) => n.id);

        if (toDelete.length === 0) return;

        setNotifications((prev) => prev.filter((n) => !toDelete.includes(n.id)));

        await Promise.all(toDelete.map(async (id) => {
            try {
                await deleteDoc(doc(db, 'notifications', id));
            } catch (err) {
                console.error('Failed to delete old notification', err);
            }
        }));
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, clearOldNotifications }}>
            {children}
            <Toaster />
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) throw new Error("useNotifications must be used within NotificationProvider");
    return context;
};