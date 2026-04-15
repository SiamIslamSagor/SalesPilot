import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type CustomerType = "prospect" | "active" | "vip";

interface CustomerTypeDropdownProps {
  currentType: CustomerType;
  customerId: string;
  onTypeChange: (customerId: string, newType: CustomerType) => Promise<void>;
  disabled?: boolean;
}

const customerTypes: { value: CustomerType; label: string; color: string }[] = [
  { value: "prospect", label: "Prospect", color: "status-draft" },
  { value: "active", label: "Active", color: "status-sent" },
  { value: "vip", label: "VIP", color: "status-approved" },
];

export function CustomerTypeDropdown({
  currentType,
  customerId,
  onTypeChange,
  disabled = false,
}: CustomerTypeDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleTypeChange = async (newType: CustomerType) => {
    if (newType === currentType || isUpdating) {
      return;
    }

    setIsUpdating(true);
    try {
      await onTypeChange(customerId, newType);
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to update customer type:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const currentTypeInfo = customerTypes.find(t => t.value === currentType);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`status-badge ${currentTypeInfo?.color} ${
            isUpdating || disabled
              ? "opacity-50 cursor-not-allowed"
              : "cursor-pointer"
          }`}
          disabled={disabled || isUpdating}
        >
          {currentType}
          {!disabled && !isUpdating && (
            <ChevronDown size={14} className="ml-1" />
          )}
          {isUpdating && (
            <div className="ml-1 h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-40">
        {customerTypes.map(type => (
          <DropdownMenuItem
            key={type.value}
            onClick={() => handleTypeChange(type.value)}
            disabled={isUpdating}
            className="cursor-pointer"
          >
            <div className="flex items-center justify-between w-full">
              <span className={`status-badge ${type.color} mr-2`}>
                {type.label}
              </span>
              {type.value === currentType && <Check size={14} />}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
