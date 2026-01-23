import React from "react";
import { Clock, User, Bed, Utensils } from "lucide-react";

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

export default function RecentActivity({ items = [] }: { items?: ActivityItem[] }): React.ReactElement {
  const activities = items;

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
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-1">{getIcon(activity.type)}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900">{activity.description}</p>
                {activity.room && (
                  <p className="text-xs text-gray-500">{activity.room}</p>
                )}
                <p className="text-xs text-gray-400 mt-1">{formatTime(activity.time)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
