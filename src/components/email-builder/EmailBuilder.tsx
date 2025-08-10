'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Save, 
  Eye, 
  Send, 
  Plus,
  MousePointer,
  Layers
} from 'lucide-react';
import { EmailTemplate, EmailComponent, TemplatePreviewData } from '@/types/emailTemplates';
import { EmailTemplateService } from '@/lib/services/emailTemplates';
import { ComponentPalette } from './ComponentPalette';
import { ComponentEditor } from './ComponentEditor';
import { EmailPreview } from './EmailPreview';
import { VariablePanel } from './VariablePanel';

interface EmailBuilderProps {
  initialTemplate?: EmailTemplate;
  onSave?: (template: EmailTemplate) => void;
  onSend?: (template: EmailTemplate, variables: TemplatePreviewData) => void;
}

export default function EmailBuilder({ initialTemplate, onSave, onSend }: EmailBuilderProps) {
  const [template, setTemplate] = useState<EmailTemplate>(initialTemplate || {
    id: '',
    name: 'New Template',
    description: '',
    subject: '',
    components: [],
    variables: [],
    html: '',
    created_at: '',
    updated_at: '',
  });

  const [selectedComponent, setSelectedComponent] = useState<EmailComponent | null>(null);
  const [previewVariables, setPreviewVariables] = useState<TemplatePreviewData>({});
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Add a new component to the template
  const addComponent = useCallback((componentType: EmailComponent['type']) => {
    const newComponent: EmailComponent = {
      id: `component-${Date.now()}`,
      type: componentType,
      content: getDefaultContent(componentType),
      styles: getDefaultStyles(componentType),
      variables: [],
      position: template.components.length,
    };

    setTemplate(prev => ({
      ...prev,
      components: [...prev.components, newComponent],
    }));

    setSelectedComponent(newComponent);
  }, [template.components.length]);

  // Update a component
  const updateComponent = useCallback((componentId: string, updates: Partial<EmailComponent>) => {
    setTemplate(prev => ({
      ...prev,
      components: prev.components.map(comp => 
        comp.id === componentId ? { ...comp, ...updates } : comp
      ),
    }));

    if (selectedComponent?.id === componentId) {
      setSelectedComponent(prev => prev ? { ...prev, ...updates } : null);
    }
  }, [selectedComponent]);

  // Remove a component
  const removeComponent = useCallback((componentId: string) => {
    setTemplate(prev => ({
      ...prev,
      components: prev.components.filter(comp => comp.id !== componentId),
    }));

    if (selectedComponent?.id === componentId) {
      setSelectedComponent(null);
    }
  }, [selectedComponent]);

  // Move component up/down
  const moveComponent = useCallback((componentId: string, direction: 'up' | 'down') => {
    setTemplate(prev => {
      const components = [...prev.components];
      const index = components.findIndex(comp => comp.id === componentId);
      
      if (direction === 'up' && index > 0) {
        [components[index], components[index - 1]] = [components[index - 1], components[index]];
      } else if (direction === 'down' && index < components.length - 1) {
        [components[index], components[index + 1]] = [components[index + 1], components[index]];
      }

      return {
        ...prev,
        components: components.map((comp, idx) => ({ ...comp, position: idx })),
      };
    });
  }, []);

  // Generate HTML from components
  const generateHTML = useCallback(() => {
    const html = template.components
      .sort((a, b) => a.position - b.position)
      .map(component => renderComponentToHTML(component))
      .join('\n');

    setTemplate(prev => ({ ...prev, html }));
    return html;
  }, [template.components]);

  // Save template
  const handleSave = async () => {
    setIsLoading(true);
    try {
      const html = generateHTML();
      const updatedTemplate = { ...template, html };
      
      let saved: EmailTemplate;
      if (template.id) {
        saved = await EmailTemplateService.updateTemplate(template.id, updatedTemplate);
        setTemplate(saved);
      } else {
        saved = await EmailTemplateService.createTemplate(updatedTemplate);
        setTemplate(saved);
      }
      
      onSave?.(saved);
    } catch (error) {
      console.error('Failed to save template:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Send email with template
  const handleSend = async () => {
    if (!onSend) return;
    
    setIsLoading(true);
    try {
      const html = generateHTML();
      const updatedTemplate = { ...template, html };
      onSend(updatedTemplate, previewVariables);
    } catch (error) {
      console.error('Failed to send email:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Email Template Builder</h1>
            <p className="text-gray-400">Create beautiful email templates with drag-and-drop components</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={() => setIsPreviewMode(!isPreviewMode)}
              className="border-slate-600 text-gray-300 hover:bg-slate-700"
            >
              <Eye className="h-4 w-4 mr-2" />
              {isPreviewMode ? 'Edit' : 'Preview'}
            </Button>
            <Button
              onClick={handleSave}
              disabled={isLoading}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Template
            </Button>
            {onSend && (
              <Button
                onClick={handleSend}
                disabled={isLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                <Send className="h-4 w-4 mr-2" />
                Send Email
              </Button>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-12 gap-6">
          {/* Left Sidebar - Component Palette */}
          <div className="col-span-2">
            <ComponentPalette onAddComponent={addComponent} />
          </div>

          {/* Center - Builder Area */}
          <div className="col-span-7">
            <Tabs defaultValue="builder" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2 bg-slate-800/50">
                <TabsTrigger value="builder" className="data-[state=active]:bg-purple-600">
                  <MousePointer className="h-4 w-4 mr-2" />
                  Builder
                </TabsTrigger>
                <TabsTrigger value="preview" className="data-[state=active]:bg-purple-600">
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </TabsTrigger>
              </TabsList>

              <TabsContent value="builder" className="space-y-4">
                {/* Template Info */}
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">Template Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="template-name" className="text-gray-300">Template Name</Label>
                        <Input
                          id="template-name"
                          value={template.name}
                          onChange={(e) => setTemplate(prev => ({ ...prev, name: e.target.value }))}
                          className="bg-slate-700 border-slate-600 text-white"
                        />
                      </div>
                      <div>
                        <Label htmlFor="template-subject" className="text-gray-300">Email Subject</Label>
                        <Input
                          id="template-subject"
                          value={template.subject}
                          onChange={(e) => setTemplate(prev => ({ ...prev, subject: e.target.value }))}
                          className="bg-slate-700 border-slate-600 text-white"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="template-description" className="text-gray-300">Description</Label>
                      <Textarea
                        id="template-description"
                        value={template.description}
                        onChange={(e) => setTemplate(prev => ({ ...prev, description: e.target.value }))}
                        className="bg-slate-700 border-slate-600 text-white"
                        rows={2}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Components Area */}
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center space-x-2">
                      <Layers className="h-5 w-5 text-purple-400" />
                      <span>Email Components</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {template.components.length === 0 ? (
                      <div className="text-center py-12 text-gray-400">
                        <Plus className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No components added yet</p>
                        <p className="text-sm">Drag components from the left panel to start building</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {template.components
                          .sort((a, b) => a.position - b.position)
                          .map((component) => (
                            <ComponentEditor
                              key={component.id}
                              component={component}
                              isSelected={selectedComponent?.id === component.id}
                              onSelect={() => setSelectedComponent(component)}
                              onUpdate={(updates) => updateComponent(component.id, updates)}
                              onRemove={() => removeComponent(component.id)}
                              onMove={(direction) => moveComponent(component.id, direction)}
                            />
                          ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="preview">
                <EmailPreview
                  template={template}
                  variables={previewVariables}
                  onVariablesChange={setPreviewVariables}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Sidebar - Properties & Variables */}
          <div className="col-span-3">
            <div className="space-y-4">
              {selectedComponent && (
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">Component Properties</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ComponentEditor
                      component={selectedComponent}
                      isSelected={true}
                      onSelect={() => {}} // No-op since it's already selected
                      onUpdate={(updates) => updateComponent(selectedComponent.id, updates)}
                      onRemove={() => removeComponent(selectedComponent.id)}
                      onMove={(direction) => moveComponent(selectedComponent.id, direction)}
                      showProperties={true}
                    />
                  </CardContent>
                </Card>
              )}

              <VariablePanel
                template={template}
                variables={previewVariables}
                onVariablesChange={setPreviewVariables}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper functions
function getDefaultContent(type: EmailComponent['type']): string {
  switch (type) {
    case 'header':
      return '<h1>Welcome to our newsletter!</h1>';
    case 'text':
      return '<p>This is a sample text block. You can edit this content and add variables like {{name}}.</p>';
    case 'image':
      return '<img src="https://via.placeholder.com/600x300" alt="Sample image" />';
    case 'button':
      return '<a href="#" class="btn">Click Here</a>';
    case 'divider':
      return '<hr />';
    case 'footer':
      return '<p>&copy; 2024 Your Company. All rights reserved.</p>';
    case 'social':
      return '<div class="social-links"><a href="#">Facebook</a> | <a href="#">Twitter</a> | <a href="#">LinkedIn</a></div>';
    default:
      return '';
  }
}

function getDefaultStyles(type: EmailComponent['type']): Record<string, string> {
  switch (type) {
    case 'header':
      return {
        'text-align': 'center',
        'color': '#ffffff',
        'font-size': '24px',
        'margin': '20px 0'
      };
    case 'text':
      return {
        'color': '#333333',
        'font-size': '16px',
        'line-height': '1.6',
        'margin': '15px 0'
      };
    case 'image':
      return {
        'max-width': '100%',
        'height': 'auto',
        'display': 'block',
        'margin': '20px auto'
      };
    case 'button':
      return {
        'background-color': '#007bff',
        'color': '#ffffff',
        'padding': '12px 24px',
        'text-decoration': 'none',
        'border-radius': '5px',
        'display': 'inline-block',
        'margin': '15px 0'
      };
    case 'divider':
      return {
        'border': 'none',
        'border-top': '1px solid #e0e0e0',
        'margin': '20px 0'
      };
    case 'footer':
      return {
        'text-align': 'center',
        'color': '#666666',
        'font-size': '14px',
        'margin': '30px 0 20px'
      };
    case 'social':
      return {
        'text-align': 'center',
        'margin': '20px 0'
      };
    default:
      return {};
  }
}

function renderComponentToHTML(component: EmailComponent): string {
  const styles = Object.entries(component.styles)
    .map(([key, value]) => `${key}: ${value}`)
    .join('; ');

  return `<div style="${styles}">${component.content}</div>`;
}
