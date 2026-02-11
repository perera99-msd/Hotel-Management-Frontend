import { CreditCard, Download, FileText, LucideIcon, Plus } from "lucide-react";

interface Action {
  label: string;
  icon: LucideIcon;
  description: string;
  variant?: "primary" | "secondary" | "warning" | "success";
  onClick?: () => void;
}

interface QuickActionsProps {
  onCreateBillClick: () => void;
  onGenerateReport: () => void;
  onExportBills: () => void;
  onPaymentSummary: () => void;
}

export default function QuickActions({
  onCreateBillClick,
  onGenerateReport,
  onExportBills,
  onPaymentSummary
}: QuickActionsProps) {
  const actions: Action[] = [
    {
      label: "Create Bill",
      description: "Start a new invoice for a guest.",
      icon: Plus,
      variant: "primary",
      onClick: onCreateBillClick,
    },
    {
      label: "Generate Report",
      description: "Open a printable billing report.",
      icon: FileText,
      variant: "secondary",
      onClick: onGenerateReport, // ✅ Wired up
    },
    {
      label: "Export Bills",
      description: "Download bills as a CSV file.",
      icon: Download,
      variant: "success",
      onClick: onExportBills, // ✅ Wired up
    },
    {
      label: "Payment Summary",
      description: "View totals and payment stats.",
      icon: CreditCard,
      variant: "warning",
      onClick: onPaymentSummary, // ✅ Wired up
    },
  ];

  const getButtonClasses = (variant: Action["variant"]) => {
    switch (variant) {
      case "primary":
        return "bg-blue-600 hover:bg-blue-700 text-white";
      case "secondary":
      case "warning":
      case "success":
      default:
        return "bg-gray-200 hover:bg-gray-300 text-gray-800";
    }
  };

  return (
    <div className="card mb-6 p-4 bg-white rounded-lg shadow-lg">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Quick Actions
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.label}
              onClick={action.onClick}
              className={`${getButtonClasses(
                action.variant
              )} flex flex-col items-center justify-center w-full h-28 rounded-lg transition-colors px-3`}
            >
              <Icon className="h-6 w-6 mb-2" />
              <span className="text-sm font-medium text-center">
                {action.label}
              </span>
              <span className="mt-1 text-[11px] text-gray-600 text-center leading-tight">
                {action.description}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}