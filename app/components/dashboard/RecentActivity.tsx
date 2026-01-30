"use client";

import { Bed, Clock, User, Utensils, X } from "lucide-react";
import React, { useEffect, useState } from "react";

interface ActivityItem {
  id: string;
  type: "checkin" | "checkout" | "booking" | "order" | "order-ready" | "trip";
  description: string;
  time: string;
  room?: string;
}

const formatTime = (time: string) => {
  const parsed = time ? new Date(time) : new Date();
  return parsed.toLocaleString();
};

const REMOVED_ACTIVITIES_KEY = "removedActivityIds";

export default function RecentActivity({ items = [] }: { items?: ActivityItem[] }): React.ReactElement {
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  // Load removed IDs from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(REMOVED_ACTIVITIES_KEY);
      if (stored) {
        setRemovedIds(new Set(JSON.parse(stored)));
      }
    } catch (error) {
      console.error("Failed to load removed activities", error);
    }
  }, []);

  // Filter activities whenever items or removedIds change
  useEffect(() => {
    const filtered = items.filter(item => !removedIds.has(item.id));
    setActivities(filtered);
  }, [items, removedIds]);

  const removeActivity = (id: string) => {
    const newRemovedIds = new Set(removedIds);
    newRemovedIds.add(id);
    setRemovedIds(newRemovedIds);

    // Persist to localStorage
    try {
      localStorage.setItem(REMOVED_ACTIVITIES_KEY, JSON.stringify(Array.from(newRemovedIds)));
    } catch (error) {
      console.error("Failed to save removed activity", error);
    }
  };

  const getIcon = (type: string) => {
    const iconBaseClasses = "h-4 w-4 text-white"; // uniform icon size and default color
    switch (type) {
      case "checkin":
        return (
          <User className={`${iconBaseClasses} bg-blue-500 rounded-full p-1`} />
        );
      case "checkout":
        return (
          <User className={`${iconBaseClasses} bg-red-500 rounded-full p-1`} />
        );
      case "booking":
        return (
          <Bed className={`${iconBaseClasses} bg-gray-500 rounded-full p-1`} />
        );
      case "order":
        return (
          <Utensils
            className={`${iconBaseClasses} bg-yellow-500 rounded-full p-1`}
          />
        );
      case "order-ready":
        return (
          <Utensils
            className={`${iconBaseClasses} bg-green-500 rounded-full p-1`}
          />
        );
      case "trip":
        return (
          <Clock className={`${iconBaseClasses} bg-indigo-500 rounded-full p-1`} />
        );
      default:
        return (
          <Clock
            className={`${iconBaseClasses} bg-gray-300 rounded-full p-1`}
          />
        );
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Recent Activity
      </h3>
      {activities.length === 0 ? (
        <div className="text-sm text-gray-500">No recent activity yet.</div>
      ) : (
        <div className="space-y-3">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3 p-2 hover:bg-gray-50 rounded-lg transition-colors group">
              <div className="flex-shrink-0 mt-1">{getIcon(activity.type)}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900">{activity.description}</p>
                {activity.room && (
                  <p className="text-xs text-gray-500">{activity.room}</p>
                )}
                <p className="text-xs text-gray-400 mt-1">{formatTime(activity.time)}</p>
              </div>
              <button
                onClick={() => removeActivity(activity.id)}
                className="flex-shrink-0 ml-2 text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                title="Remove activity"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
