/* */
import { AlertTriangle, CheckCircle, Clock, DoorOpen, Wrench, XCircle } from "lucide-react";

interface RoomStatusData {
    available: number;
    occupied: number;
    reserved: number;
    needsCleaning: number;
    maintenance: number;
    outOfOrder: number;
}

export default function RoomStatusCard({ status }: { status: RoomStatusData }) {
    if (!status) return null;

    const statusItems = [
        {
            label: "Available",
            count: status.available,
            icon: CheckCircle,
            color: "text-green-600",
            bgColor: "bg-green-50",
            borderColor: "border-green-200"
        },
        {
            label: "Occupied",
            count: status.occupied,
            icon: DoorOpen,
            color: "text-blue-600",
            bgColor: "bg-blue-50",
            borderColor: "border-blue-200"
        },
        {
            label: "Reserved",
            count: status.reserved,
            icon: Clock,
            color: "text-purple-600",
            bgColor: "bg-purple-50",
            borderColor: "border-purple-200"
        },
        {
            label: "Needs Cleaning",
            count: status.needsCleaning,
            icon: AlertTriangle,
            color: "text-orange-600",
            bgColor: "bg-orange-50",
            borderColor: "border-orange-200"
        },
        {
            label: "Maintenance",
            count: status.maintenance,
            icon: Wrench,
            color: "text-yellow-600",
            bgColor: "bg-yellow-50",
            borderColor: "border-yellow-200"
        },
        {
            label: "Out of Order",
            count: status.outOfOrder,
            icon: XCircle,
            color: "text-red-600",
            bgColor: "bg-red-50",
            borderColor: "border-red-200"
        }
    ];

    const totalRooms = Object.values(status).reduce((sum, count) => sum + count, 0);

    return (
        <div className="bg-white p-6 border border-gray-200 rounded-lg shadow-sm h-full">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-gray-800">Room Status</h2>
                <span className="text-sm text-gray-500">Total: {totalRooms} rooms</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {statusItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <div
                            key={item.label}
                            className={`${item.bgColor} ${item.borderColor} border rounded-lg p-4 transition-all hover:shadow-md`}
                        >
                            <div className="flex items-start justify-between mb-2">
                                <Icon className={`h-5 w-5 ${item.color}`} />
                                <span className={`text-2xl font-bold ${item.color}`}>
                                    {item.count}
                                </span>
                            </div>
                            <p className="text-sm font-medium text-gray-700">{item.label}</p>
                            {totalRooms > 0 && (
                                <p className="text-xs text-gray-500 mt-1">
                                    {Math.round((item.count / totalRooms) * 100)}%
                                </p>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}