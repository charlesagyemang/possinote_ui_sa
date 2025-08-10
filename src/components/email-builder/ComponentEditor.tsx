'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ChevronUp, 
  ChevronDown, 
  Trash2, 
  Edit3,
  Palette,
  Type,
  Image,
  MousePointer,
  SeparatorHorizontal,
  Mail,
  Share2,
  Heading1
} from 'lucide-react';
import { EmailComponent } from '@/types/emailTemplates';
import { cssToReactStyle } from '@/lib/utils';

interface ComponentEditorProps {
  component: EmailComponent;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<EmailComponent>) => void;
  onRemove: () => void;
  onMove: (direction: 'up' | 'down') => void;
  showProperties?: boolean;
}

const componentIcons = {
  header: Heading1,
  text: Type,
  image: Image,
  button: MousePointer,
  divider: SeparatorHorizontal,
  footer: Mail,
  social: Share2,
};

const componentColors = {
  header: 'text-blue-400',
  text: 'text-green-400',
  image: 'text-purple-400',
  button: 'text-orange-400',
  divider: 'text-gray-400',
  footer: 'text-red-400',
  social: 'text-pink-400',
};

export function ComponentEditor({
  component,
  isSelected,
  onSelect,
  onUpdate,
  onRemove,
  onMove,
  showProperties = false
}: ComponentEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingStyles, setIsEditingStyles] = useState(false);
  
  const Icon = componentIcons[component.type];
  const colorClass = componentColors[component.type];

  const handleContentChange = (content: string) => {
    onUpdate({ content });
  };

  const handleStyleChange = (key: string, value: string) => {
    onUpdate({
      styles: {
        ...component.styles,
        [key]: value
      }
    });
  };

  const renderComponentPreview = () => {
    const styleObject = cssToReactStyle(component.styles);

    return (
      <div 
        className="p-4 border border-slate-600 rounded-lg bg-slate-700/30"
        style={styleObject}
        dangerouslySetInnerHTML={{ __html: component.content }}
      />
    );
  };

  const renderContentEditor = () => {
    switch (component.type) {
      case 'image':
        return (
          <div className="space-y-3">
            <div>
              <Label className="text-gray-300">Image URL</Label>
              <Input
                value={component.content.match(/src="([^"]*)"/)?.[1] || ''}
                onChange={(e) => {
                  const newContent = component.content.replace(
                    /src="[^"]*"/,
                    `src="${e.target.value}"`
                  );
                  handleContentChange(newContent);
                }}
                placeholder="https://example.com/image.jpg"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div>
              <Label className="text-gray-300">Alt Text</Label>
              <Input
                value={component.content.match(/alt="([^"]*)"/)?.[1] || ''}
                onChange={(e) => {
                  const newContent = component.content.replace(
                    /alt="[^"]*"/,
                    `alt="${e.target.value}"`
                  );
                  handleContentChange(newContent);
                }}
                placeholder="Description of the image"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
          </div>
        );
      
      case 'button':
        return (
          <div className="space-y-3">
            <div>
              <Label className="text-gray-300">Button Text</Label>
              <Input
                value={component.content.match(/>([^<]*)</)?.[1] || ''}
                onChange={(e) => {
                  const newContent = component.content.replace(
                    />[^<]*</,
                    `>${e.target.value}<`
                  );
                  handleContentChange(newContent);
                }}
                placeholder="Click Here"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div>
              <Label className="text-gray-300">Button URL</Label>
              <Input
                value={component.content.match(/href="([^"]*)"/)?.[1] || ''}
                onChange={(e) => {
                  const newContent = component.content.replace(
                    /href="[^"]*"/,
                    `href="${e.target.value}"`
                  );
                  handleContentChange(newContent);
                }}
                placeholder="https://example.com"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
          </div>
        );
      
      default:
        return (
          <div>
            <Label className="text-gray-300">Content (HTML)</Label>
            <Textarea
              value={component.content}
              onChange={(e) => handleContentChange(e.target.value)}
              className="bg-slate-700 border-slate-600 text-white font-mono"
              rows={4}
            />
          </div>
        );
    }
  };

  const renderStyleEditor = () => {
    const commonStyles = [
      { key: 'color', label: 'Text Color', type: 'color' },
      { key: 'background-color', label: 'Background Color', type: 'color' },
      { key: 'font-size', label: 'Font Size', type: 'text' },
      { key: 'text-align', label: 'Text Align', type: 'select', options: ['left', 'center', 'right', 'justify'] },
      { key: 'margin', label: 'Margin', type: 'text' },
      { key: 'padding', label: 'Padding', type: 'text' },
      { key: 'border-radius', label: 'Border Radius', type: 'text' },
    ];

    return (
      <div className="space-y-3">
        {commonStyles.map((style) => (
          <div key={style.key}>
            <Label className="text-gray-300">{style.label}</Label>
            {style.type === 'select' ? (
              <select
                value={component.styles[style.key] || ''}
                onChange={(e) => handleStyleChange(style.key, e.target.value)}
                className="w-full bg-slate-700 border-slate-600 rounded-lg p-2 text-white"
              >
                <option value="">Default</option>
                {style.options?.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            ) : style.type === 'color' ? (
              <Input
                type="color"
                value={component.styles[style.key] || '#000000'}
                onChange={(e) => handleStyleChange(style.key, e.target.value)}
                className="bg-slate-700 border-slate-600 h-10"
              />
            ) : (
              <Input
                value={component.styles[style.key] || ''}
                onChange={(e) => handleStyleChange(style.key, e.target.value)}
                placeholder={style.label}
                className="bg-slate-700 border-slate-600 text-white"
              />
            )}
          </div>
        ))}
      </div>
    );
  };

  if (showProperties) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Icon className={`h-5 w-5 ${colorClass}`} />
          <span className="text-white font-medium capitalize">{component.type}</span>
        </div>
        
        <Tabs defaultValue="content" className="space-y-3">
          <TabsList className="grid w-full grid-cols-2 bg-slate-700/50">
            <TabsTrigger value="content" className="data-[state=active]:bg-purple-600">
              <Type className="h-4 w-4 mr-2" />
              Content
            </TabsTrigger>
            <TabsTrigger value="styles" className="data-[state=active]:bg-purple-600">
              <Palette className="h-4 w-4 mr-2" />
              Styles
            </TabsTrigger>
          </TabsList>

          <TabsContent value="content">
            {renderContentEditor()}
          </TabsContent>

          <TabsContent value="styles">
            {renderStyleEditor()}
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <Card 
      className={`cursor-pointer transition-all duration-200 ${
        isSelected 
          ? 'bg-slate-700/50 border-purple-500/50 shadow-lg shadow-purple-500/20' 
          : 'bg-slate-800/30 border-slate-600 hover:bg-slate-700/30'
      }`}
      onClick={onSelect}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Icon className={`h-4 w-4 ${colorClass}`} />
            <span className="text-white font-medium capitalize">{component.type}</span>
          </div>
          
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onMove('up');
              }}
              className="h-6 w-6 p-0 text-gray-400 hover:text-white"
            >
              <ChevronUp className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onMove('down');
              }}
              className="h-6 w-6 p-0 text-gray-400 hover:text-white"
            >
              <ChevronDown className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(!isEditing);
              }}
              className="h-6 w-6 p-0 text-gray-400 hover:text-white"
            >
              <Edit3 className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {isEditing ? (
          <div className="space-y-3">
            {renderContentEditor()}
            <div className="flex space-x-2">
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(false);
                }}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Done
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-400">
            {renderComponentPreview()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
