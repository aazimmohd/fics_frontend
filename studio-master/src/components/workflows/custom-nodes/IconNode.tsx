
import type { NodeProps } from 'reactflow';
import { Handle, Position } from 'reactflow';
import { cn } from '@/lib/utils';
import { getIconForNodeType, nodeDefinitions } from '../node-definitions';
import { CheckCircle, Clock, AlertTriangle, Play } from 'lucide-react';

// Node status type
type NodeStatus = 'idle' | 'running' | 'completed' | 'error';

interface EnhancedNodeData {
  label: string;
  status?: NodeStatus;
  progress?: number;
  description?: string;
  [key: string]: any;
}

const IconNode = ({ 
  id, 
  type, 
  data, 
  selected, 
  sourcePosition = Position.Right, 
  targetPosition = Position.Left 
}: NodeProps<EnhancedNodeData>) => {
  const IconComponent = getIconForNodeType(type);
  const definition = nodeDefinitions.find(def => def.type === type);
  const isToolNode = definition?.isToolNode;
  const status = data.status || 'idle';
  const progress = data.progress || 0;

  // Get node styling based on type
  const getNodeColors = () => {
    switch (type) {
      case 'input':
      case 'input_form':
        return {
          gradient: 'from-green-500 to-emerald-600',
          background: 'bg-green-50 hover:bg-green-100 border-green-200 hover:border-green-300',
          iconBg: 'bg-gradient-to-br from-green-500 to-emerald-600',
        };
      case 'output':
        return {
          gradient: 'from-red-500 to-rose-600',
          background: 'bg-red-50 hover:bg-red-100 border-red-200 hover:border-red-300',
          iconBg: 'bg-gradient-to-br from-red-500 to-rose-600',
        };
      case 'condition':
        return {
          gradient: 'from-amber-500 to-orange-600',
          background: 'bg-amber-50 hover:bg-amber-100 border-amber-200 hover:border-amber-300',
          iconBg: 'bg-gradient-to-br from-amber-500 to-orange-600',
        };
      case 'delay':
        return {
          gradient: 'from-indigo-500 to-purple-600',
          background: 'bg-indigo-50 hover:bg-indigo-100 border-indigo-200 hover:border-indigo-300',
          iconBg: 'bg-gradient-to-br from-indigo-500 to-purple-600',
        };
      case 'humanTask':
        return {
          gradient: 'from-cyan-500 to-blue-600',
          background: 'bg-cyan-50 hover:bg-cyan-100 border-cyan-200 hover:border-cyan-300',
          iconBg: 'bg-gradient-to-br from-cyan-500 to-blue-600',
        };
      default:
        return {
          gradient: 'from-blue-500 to-purple-600',
          background: 'bg-blue-50 hover:bg-blue-100 border-blue-200 hover:border-blue-300',
          iconBg: 'bg-gradient-to-br from-blue-500 to-purple-600',
        };
    }
  };

  const colors = getNodeColors();

  // Get status indicator
  const getStatusIndicator = () => {
    switch (status) {
      case 'running':
        return <Play className="w-3 h-3 text-blue-500 animate-pulse" />;
      case 'completed':
        return <CheckCircle className="w-3 h-3 text-green-500" />;
      case 'error':
        return <AlertTriangle className="w-3 h-3 text-red-500" />;
      default:
        return <Clock className="w-3 h-3 text-gray-400" />;
    }
  };

  return (
    <div className="group relative">
      {/* Main node container */}
      <div className={cn(
        "relative bg-white rounded-xl shadow-lg border-2 transition-all duration-300 ease-out",
        "hover:shadow-xl hover:scale-105 cursor-pointer",
        colors.background,
        selected ? "ring-2 ring-blue-400 shadow-xl scale-105" : "",
        isToolNode ? "min-w-[200px]" : "min-w-[160px]"
      )}>
        
        {/* Progress bar for running status */}
        {status === 'running' && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200 rounded-t-xl overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {/* Node content */}
        <div className="flex items-center p-4 space-x-3">
          {/* Icon container */}
          <div className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center shadow-sm",
            colors.iconBg
          )}>
            {IconComponent && (
              <IconComponent className="w-5 h-5 text-white" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 text-sm truncate">
              {data.label}
            </h3>
            {definition?.description && !isToolNode && (
              <p className="text-xs text-gray-500 truncate mt-0.5">
                {definition.description}
              </p>
            )}
            {data.description && isToolNode && (
              <p className="text-xs text-gray-500 truncate mt-0.5">
                {data.description}
              </p>
            )}
          </div>
        </div>

        {/* Status indicator */}
        <div className="absolute top-3 right-3">
          {getStatusIndicator()}
        </div>

        {/* Enhanced handles */}
        <Handle 
          type="target" 
          position={targetPosition} 
          className="!w-3 !h-3 !bg-gray-400 !border-2 !border-white hover:!bg-blue-500 transition-colors duration-200" 
        />
        <Handle 
          type="source" 
          position={sourcePosition} 
          className="!w-3 !h-3 !bg-gray-400 !border-2 !border-white hover:!bg-purple-500 transition-colors duration-200" 
        />
      </div>

      {/* Hover tooltip for full description */}
      {definition?.description && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-lg">
          {definition.description}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  );
};

export default IconNode;
