import { Check, CheckCheck, Clock, AlertCircle, Loader2 } from "lucide-react";

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'error' | 'cancelled';

export interface MessageStatusIndicatorProps {
  /** Current status of the message */
  status: MessageStatus;
  /** Whether to show text label alongside icon */
  showLabel?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Whether this is a user message (affects positioning/visibility) */
  isUserMessage?: boolean;
  /** Timestamp when status last changed */
  timestamp?: string;
  /** Error message if status is 'error' */
  errorMessage?: string;
}

const STATUS_CONFIG = {
  sending: {
    icon: Loader2,
    color: 'text-gray-400',
    bgColor: 'bg-gray-400/20',
    label: 'Sending...',
    spinning: true,
  },
  sent: {
    icon: Check,
    color: 'text-blue-400',
    bgColor: 'bg-blue-400/20',
    label: 'Sent',
    spinning: false,
  },
  delivered: {
    icon: CheckCheck,
    color: 'text-green-400',
    bgColor: 'bg-green-400/20',
    label: 'Delivered',
    spinning: false,
  },
  read: {
    icon: CheckCheck,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-400/20',
    label: 'Read',
    spinning: false,
  },
  error: {
    icon: AlertCircle,
    color: 'text-red-400',
    bgColor: 'bg-red-400/20',
    label: 'Failed',
    spinning: false,
  },
  cancelled: {
    icon: AlertCircle,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-400/20',
    label: 'Cancelled',
    spinning: false,
  },
} as const;

const SIZE_CONFIG = {
  sm: {
    icon: 'w-3 h-3',
    container: 'h-5 px-1.5',
    text: 'text-xs',
  },
  md: {
    icon: 'w-4 h-4',
    container: 'h-6 px-2',
    text: 'text-sm',
  },
  lg: {
    icon: 'w-5 h-5',
    container: 'h-7 px-3',
    text: 'text-base',
  },
} as const;

export function MessageStatusIndicator({
  status,
  showLabel = false,
  size = 'sm',
  isUserMessage = true,
  timestamp,
  errorMessage
}: MessageStatusIndicatorProps) {
  // Only show status indicators for user messages
  if (!isUserMessage) {
    return null;
  }

  const statusConfig = STATUS_CONFIG[status];
  const sizeConfig = SIZE_CONFIG[size];
  const IconComponent = statusConfig.icon;

  return (
    <div 
      className={`flex items-center space-x-1 ${sizeConfig.container} rounded-full ${statusConfig.bgColor} transition-all duration-200`}
      title={errorMessage || `${statusConfig.label}${timestamp ? ` at ${new Date(timestamp).toLocaleTimeString()}` : ''}`}
    >
      <IconComponent 
        className={`${sizeConfig.icon} ${statusConfig.color} ${statusConfig.spinning ? 'animate-spin' : ''}`}
      />
      
      {showLabel && (
        <span className={`${sizeConfig.text} ${statusConfig.color} font-medium`}>
          {statusConfig.label}
        </span>
      )}
    </div>
  );
}

// Compact version for inline display in message headers
export function CompactMessageStatus({
  status,
  isUserMessage = true,
  timestamp
}: Pick<MessageStatusIndicatorProps, 'status' | 'isUserMessage' | 'timestamp'>) {
  if (!isUserMessage) return null;

  const statusConfig = STATUS_CONFIG[status];
  const IconComponent = statusConfig.icon;

  const tooltipText = statusConfig.label + (timestamp ? ` at ${new Date(timestamp).toLocaleTimeString()}` : '');

  return (
    <div className="flex items-center space-x-1 opacity-60 hover:opacity-100 transition-opacity">
      <div title={tooltipText}>
        <IconComponent 
          className={`w-3 h-3 ${statusConfig.color} ${statusConfig.spinning ? 'animate-spin' : ''}`}
        />
      </div>
    </div>
  );
}

// Hook for managing message status
export function useMessageStatus(messageId?: string) {
  // In a real implementation, this would track the message through its lifecycle
  // For now, we'll simulate status progression
  
  const getStatusForMessage = (id?: string): MessageStatus => {
    if (!id) return 'sending';
    
    // Simulate different statuses based on message ID or other factors
    // In reality, this would come from your backend/API
    return 'sent'; // Default status for existing messages
  };

  const updateMessageStatus = (newStatus: MessageStatus) => {
    // This would update the message status in your state management system
    console.log(`Updating message ${messageId} status to ${newStatus}`);
  };

  return {
    status: getStatusForMessage(messageId),
    updateStatus: updateMessageStatus,
  };
}

export default MessageStatusIndicator;