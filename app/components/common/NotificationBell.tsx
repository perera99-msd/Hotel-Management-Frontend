/* Notification Bell Icon Component with Dropdown */
"use client";

import { Bell, Check, Trash2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNotifications } from '../../context/NotificationContext';

interface NotificationBellProps {
    className?: string;
}

export default function NotificationBell({ className = '' }: NotificationBellProps) {
    const { notifications, unreadCount, markAsRead, deleteNotification, markAllAsRead } = useNotifications();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isOpen]);

    const recentNotifications = notifications.slice(0, 10); // Show last 10

    // Get icon color based on type
    const getNotificationColor = (type: string) => {
        switch (type) {
            case 'BOOKING':
                return 'border-l-blue-500';
            case 'ORDER':
                return 'border-l-orange-500';
            case 'TRIP':
                return 'border-l-green-500';
            case 'SYSTEM':
                return 'border-l-purple-500';
            default:
                return 'border-l-gray-400';
        }
    };

    // Get icon emoji based on type
    const getNotificationEmoji = (type: string) => {
        switch (type) {
            case 'BOOKING':
                return '🏨';
            case 'ORDER':
                return '🍽️';
            case 'TRIP':
                return '✈️';
            case 'SYSTEM':
                return '💬';
            default:
                return '📢';
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Icon Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`relative p-2 rounded-lg hover:bg-gray-100 transition-colors ${className}`}
                title={`${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`}
            >
                <Bell className="w-6 h-6 text-gray-700" />

                {/* Unread Badge */}
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute right-0 top-12 w-96 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-50 to-blue-100 border-b border-gray-200">
                        <h3 className="font-semibold text-gray-800">Notifications</h3>
                        <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                                    title="Mark all as read"
                                >
                                    <Check className="w-3 h-3 inline mr-1" />
                                    Mark All
                                </button>
                            )}
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-gray-600 hover:text-gray-800 transition-colors p-1"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Notification List */}
                    <div className="max-h-96 overflow-y-auto">
                        {recentNotifications.length > 0 ? (
                            recentNotifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`border-l-4 px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${getNotificationColor(notification.type)} ${!notification.read ? 'bg-blue-50' : ''
                                        }`}
                                >
                                    {/* Notification Content */}
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg">{getNotificationEmoji(notification.type)}</span>
                                                <p className={`font-semibold text-sm ${!notification.read ? 'text-blue-900' : 'text-gray-800'}`}>
                                                    {notification.title}
                                                </p>
                                                {!notification.read && (
                                                    <span className="w-2 h-2 bg-blue-500 rounded-full ml-auto"></span>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">{notification.message}</p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                {notification.createdAt?.seconds
                                                    ? new Date(notification.createdAt.seconds * 1000).toLocaleTimeString('en-US', {
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })
                                                    : 'Just now'}
                                            </p>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex items-center gap-1 ml-2">
                                            {!notification.read && (
                                                <button
                                                    onClick={() => markAsRead(notification.id)}
                                                    className="text-blue-500 hover:text-blue-700 p-1 hover:bg-blue-100 rounded transition-colors"
                                                    title="Mark as read"
                                                >
                                                    <Check className="w-4 h-4" />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => deleteNotification(notification.id)}
                                                className="text-red-500 hover:text-red-700 p-1 hover:bg-red-100 rounded transition-colors"
                                                title="Delete notification"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="px-4 py-8 text-center text-gray-500">
                                <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">No notifications yet</p>
                            </div>
                        )}
                    </div>

                    {/* Footer - Show Older Notifications Link */}
                    {notifications.length > 10 && (
                        <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-center">
                            <button className="text-xs text-blue-500 hover:text-blue-700 font-medium">
                                View all {notifications.length} notifications
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
