
import type { NodeProps } from 'reactflow';
import { Handle, Position } from 'reactflow';
import { cn } from '@/lib/utils';
import { getIconForNodeType, nodeDefinitions } from '../node-definitions'; // Ensure this path is correct

const IconNode = ({ id, type, data, selected, sourcePosition = Position.Right, targetPosition = Position.Left }: NodeProps) => {
  const IconComponent = getIconForNodeType(type);
  
  // Determine if this node type is primarily a "tool" or action node
  // vs. an input/output structural node, for slightly different internal layout.
  const definition = nodeDefinitions.find(def => def.type === type);
  const isToolNode = definition?.isToolNode;

  return (
    <div className={cn(
      "flex items-center justify-center p-3 rounded-lg h-full",
      "nodrag", // Prevents dragging the node by its content, only by the main body if draggable
      selected ? "ring-2 ring-offset-2 ring-ring" : "" // Example of selection highlight
    )}>
      {IconComponent && (
        <IconComponent className={cn(
            "h-5 w-5 shrink-0", 
            isToolNode ? "mr-2.5" : "mb-1.5 md:mb-0 md:mr-2" // Adjust icon spacing
        )} />
      )}
      <div className={cn(
          "text-sm font-medium truncate", 
          isToolNode ? "" : "text-center md:text-left" // Center text for simple input/output, left align for tools
      )}>
        {data.label}
      </div>
      <Handle type="target" position={targetPosition} className="!bg-neutral-500" />
      <Handle type="source" position={sourcePosition} className="!bg-neutral-500" />
    </div>
  );
};

export default IconNode;
