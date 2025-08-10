'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Type, 
  Image, 
  MousePointer, 
  SeparatorHorizontal,
  Mail,
  Share2,
  Heading1
} from 'lucide-react';
import { EmailComponent } from '@/types/emailTemplates';

interface ComponentPaletteProps {
  onAddComponent: (type: EmailComponent['type']) => void;
}

const componentTypes = [
  {
    type: 'header' as const,
    name: 'Header',
    description: 'Main heading section',
    icon: Heading1,
    color: 'text-blue-400'
  },
  {
    type: 'text' as const,
    name: 'Text Block',
    description: 'Rich text content',
    icon: Type,
    color: 'text-green-400'
  },
  {
    type: 'image' as const,
    name: 'Image',
    description: 'Image with alt text',
    icon: Image,
    color: 'text-purple-400'
  },
  {
    type: 'button' as const,
    name: 'Button',
    description: 'Call-to-action button',
    icon: MousePointer,
    color: 'text-orange-400'
  },
  {
    type: 'divider' as const,
    name: 'Divider',
    description: 'Horizontal line separator',
    icon: SeparatorHorizontal,
    color: 'text-gray-400'
  },
  {
    type: 'footer' as const,
    name: 'Footer',
    description: 'Email footer section',
    icon: Mail,
    color: 'text-red-400'
  },
  {
    type: 'social' as const,
    name: 'Social Links',
    description: 'Social media links',
    icon: Share2,
    color: 'text-pink-400'
  }
];

export function ComponentPalette({ onAddComponent }: ComponentPaletteProps) {
  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white text-lg">Components</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {componentTypes.map((component) => {
          const Icon = component.icon;
          return (
            <Button
              key={component.type}
              variant="outline"
              className="w-full justify-start h-auto p-3 border-slate-600 text-gray-300 hover:bg-slate-700 hover:border-slate-500"
              onClick={() => onAddComponent(component.type)}
            >
              <div className="flex items-start space-x-3">
                <Icon className={`h-5 w-5 mt-0.5 ${component.color}`} />
                <div className="text-left">
                  <div className="font-medium text-white">{component.name}</div>
                  <div className="text-xs text-gray-400">{component.description}</div>
                </div>
              </div>
            </Button>
          );
        })}
      </CardContent>
    </Card>
  );
}
