import React, { useState, useMemo } from 'react';
import { Search, Settings2, Zap, Mail, Database, Timer, GitFork, Users, FileText, Webhook, Filter } from 'lucide-react';
import { nodeDefinitions, NodeDefinition } from './node-definitions';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface EnhancedNodePaletteProps {
  onDragStart: (event: React.DragEvent<HTMLDivElement>, nodeType: string) => void;
}

// Category definitions with icons and descriptions
const categories = [
  {
    id: 'triggers',
    label: 'Triggers',
    icon: Zap,
    description: 'Start your workflows',
    types: ['input', 'input_form']
  },
  {
    id: 'actions',
    label: 'Actions',
    icon: Settings2,
    description: 'Perform operations',
    types: ['sendEmail', 'runSql', 'callWebhook', 'updateRecord', 'updateFirestoreDocument']
  },
  {
    id: 'logic',
    label: 'Logic & Flow',
    icon: GitFork,
    description: 'Control workflow flow',
    types: ['condition', 'delay', 'default']
  },
  {
    id: 'human',
    label: 'Human Tasks',
    icon: Users,
    description: 'Human interactions',
    types: ['humanTask', 'assignTask']
  },
  {
    id: 'data',
    label: 'Data',
    icon: Database,
    description: 'Data operations',
    types: ['getFirestoreDocument', 'updateFirestoreDocument', 'runSql']
  },
  {
    id: 'endpoints',
    label: 'Endpoints',
    icon: FileText,
    description: 'Complete workflows',
    types: ['output']
  }
];

// Popular node combinations for quick suggestions
const quickSuggestions = [
  {
    title: 'Email Notification',
    description: 'Send emails when conditions are met',
    nodes: ['condition', 'sendEmail']
  },
  {
    title: 'Human Approval',
    description: 'Pause for manual review',
    nodes: ['humanTask', 'condition']
  },
  {
    title: 'Database Update',
    description: 'Update records with delays',
    nodes: ['delay', 'runSql']
  }
];

export const EnhancedNodePalette: React.FC<EnhancedNodePaletteProps> = ({ onDragStart }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Filter nodes based on search and category
  const filteredNodes = useMemo(() => {
    let filtered = nodeDefinitions;

    // Filter by category
    if (selectedCategory !== 'all') {
      const category = categories.find(cat => cat.id === selectedCategory);
      if (category) {
        filtered = filtered.filter(node => category.types.includes(node.type));
      }
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(node =>
        node.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        node.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        node.type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [searchTerm, selectedCategory]);

  // Get category color
  const getCategoryColor = (nodeType: string) => {
    const category = categories.find(cat => cat.types.includes(nodeType));
    switch (category?.id) {
      case 'triggers': return 'bg-green-100 border-green-300 text-green-700';
      case 'actions': return 'bg-blue-100 border-blue-300 text-blue-700';
      case 'logic': return 'bg-purple-100 border-purple-300 text-purple-700';
      case 'human': return 'bg-cyan-100 border-cyan-300 text-cyan-700';
      case 'data': return 'bg-indigo-100 border-indigo-300 text-indigo-700';
      case 'endpoints': return 'bg-red-100 border-red-300 text-red-700';
      default: return 'bg-gray-100 border-gray-300 text-gray-700';
    }
  };

  return (
    <aside className="w-80 border-r bg-card h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-purple-50">
        <h3 className="text-lg font-semibold flex items-center mb-2">
          <Settings2 className="mr-2 h-5 w-5 text-primary" />
          Node Palette
        </h3>
        <p className="text-sm text-muted-foreground">
          Drag nodes to build your workflow
        </p>
      </div>

      {/* Search */}
      <div className="p-4 border-b bg-gray-50/50">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search nodes or describe action..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white"
          />
        </div>
        
        {/* Quick filters */}
        <div className="flex flex-wrap gap-2 mt-3">
          <Button
            variant={selectedCategory === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory('all')}
            className="h-7 text-xs"
          >
            All
          </Button>
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category.id)}
              className="h-7 text-xs"
            >
              <category.icon className="w-3 h-3 mr-1" />
              {category.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="browse" className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-2 mx-4 mt-4">
            <TabsTrigger value="browse">Browse</TabsTrigger>
            <TabsTrigger value="suggested">Suggested</TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="flex-1 overflow-y-auto p-4 space-y-3">
            {filteredNodes.length === 0 ? (
              <div className="text-center py-8">
                <Search className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No nodes found</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Try adjusting your search or filters
                </p>
              </div>
            ) : (
              filteredNodes.map((nodeDef) => (
                <NodeCard
                  key={nodeDef.type}
                  node={nodeDef}
                  onDragStart={onDragStart}
                  categoryColor={getCategoryColor(nodeDef.type)}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="suggested" className="flex-1 overflow-y-auto p-4 space-y-4">
            {quickSuggestions.map((suggestion, index) => (
              <div key={index} className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border">
                <h4 className="font-medium text-sm mb-1">{suggestion.title}</h4>
                <p className="text-xs text-muted-foreground mb-3">{suggestion.description}</p>
                <div className="flex flex-wrap gap-2">
                  {suggestion.nodes.map((nodeType) => {
                    const node = nodeDefinitions.find(n => n.type === nodeType);
                    if (!node) return null;
                    return (
                      <div
                        key={nodeType}
                        className="flex items-center space-x-2 bg-white rounded-md px-2 py-1 text-xs border cursor-grab"
                        onDragStart={(event) => onDragStart(event, nodeType)}
                        draggable
                      >
                        <node.icon className="w-3 h-3" />
                        <span>{node.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            
            {/* AI Suggestions placeholder */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
              <div className="flex items-center mb-2">
                <Zap className="w-4 h-4 text-purple-600 mr-2" />
                <h4 className="font-medium text-sm text-purple-800">AI Suggestions</h4>
              </div>
              <p className="text-xs text-purple-600 mb-3">
                Based on your workflow, here are some recommended next steps...
              </p>
              <Button size="sm" variant="outline" className="text-xs h-7">
                Get AI Suggestions
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </aside>
  );
};

// Enhanced Node Card Component
interface NodeCardProps {
  node: NodeDefinition;
  onDragStart: (event: React.DragEvent<HTMLDivElement>, nodeType: string) => void;
  categoryColor: string;
}

const NodeCard: React.FC<NodeCardProps> = ({ node, onDragStart, categoryColor }) => {
  return (
    <div
      className="group relative bg-white rounded-lg p-3 border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-200 cursor-grab active:cursor-grabbing"
      onDragStart={(event) => onDragStart(event, node.type)}
      draggable
    >
      {/* Node content */}
      <div className="flex items-start space-x-3">
        {/* Icon */}
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
          <node.icon className="w-4 h-4 text-white" />
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-medium text-sm text-gray-900 truncate">
              {node.label}
            </h4>
            {node.isToolNode && (
              <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                Action
              </Badge>
            )}
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            {node.description}
          </p>
        </div>
      </div>

      {/* Category indicator */}
      <div className={cn(
        "absolute top-2 right-2 w-2 h-2 rounded-full",
        categoryColor.includes('green') ? 'bg-green-400' :
        categoryColor.includes('blue') ? 'bg-blue-400' :
        categoryColor.includes('purple') ? 'bg-purple-400' :
        categoryColor.includes('cyan') ? 'bg-cyan-400' :
        categoryColor.includes('indigo') ? 'bg-indigo-400' :
        categoryColor.includes('red') ? 'bg-red-400' : 'bg-gray-400'
      )} />

      {/* Hover effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
    </div>
  );
}; 