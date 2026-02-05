import { ReactNode } from "react";

interface PageCardProps {
    title: string;
    children: ReactNode;
    action?: ReactNode;
    description?: string;
}

export default function PageCard({ title, children, action, description }: PageCardProps) {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
                    {description && (
                        <p className="text-sm text-gray-600 mt-1">{description}</p>
                    )}
                </div>
                {action && <div>{action}</div>}
            </div>
            <div className="p-6">
                {children}
            </div>
        </div>
    );
}
