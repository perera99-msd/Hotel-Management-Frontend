/* */

const CustomRoomCard = ({ room }: { room: any }) => (
    <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-sm flex flex-col justify-between">
        <div>
            {room.deals > 0 && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-green-100 text-green-700 mb-2 inline-block">
                    {room.deals} Deals
                </span>
            )}
            <h3 className="text-lg font-semibold text-gray-800 mt-1 capitalize">{room.type}</h3>
        </div>

        <div className="mt-3">
            <p className="text-lg text-gray-600 mt-1">
                {room.current}/{room.total}
            </p>
            <p className="text-xl font-bold text-blue-600">
                ${room.rate.toLocaleString()}{' '}
                <span className="text-sm font-normal text-gray-500">/ day</span>
            </p>
        </div>
    </div>
);

export default function RoomsSection({ rooms }: { rooms: any[] }) {
    if (!rooms || rooms.length === 0) return null;

    return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-sm">
            <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-800">Rooms</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {rooms.map((room, index) => (
                        <CustomRoomCard key={index} room={room} />
                    ))}
                </div>
            </div>
        </div>
    );
}