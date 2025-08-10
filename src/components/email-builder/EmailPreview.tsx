'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
// import { Badge } from '@/components/ui/badge'; // TODO: Implement badge functionality
import { 
  Smartphone, 
  Monitor, 
  Tablet,
  RefreshCw,
  Copy,
  Check
} from 'lucide-react';
import { EmailTemplate, TemplatePreviewData } from '@/types/emailTemplates';
import { EmailTemplateService } from '@/lib/services/emailTemplates';

interface EmailPreviewProps {
  template: EmailTemplate;
  variables: TemplatePreviewData;
  onVariablesChange: (variables: TemplatePreviewData) => void;
}

type PreviewMode = 'desktop' | 'tablet' | 'mobile';

export function EmailPreview({ template, variables, onVariablesChange }: EmailPreviewProps) {
  const [previewMode, setPreviewMode] = useState<PreviewMode>('desktop');
  const [renderedHTML, setRenderedHTML] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Extract variables from template
  const templateVariables = EmailTemplateService.extractVariables(template);

  // Update variables when template changes
  useEffect(() => {
    const newVariables: TemplatePreviewData = {};
    templateVariables.forEach(varName => {
      if (!(varName in variables)) {
        newVariables[varName] = `Sample ${varName}`;
      }
    });
    
    if (Object.keys(newVariables).length > 0) {
      onVariablesChange({ ...variables, ...newVariables });
    }
  }, [templateVariables, onVariablesChange]);

  // Render template with variables
  useEffect(() => {
    if (template.components.length > 0) {
      setIsLoading(true);
      
      // Generate HTML from components locally for preview
      const html = template.components
        .sort((a, b) => a.position - b.position)
        .map(component => {
          const styles = Object.entries(component.styles)
            .map(([key, value]) => `${key}: ${value}`)
            .join('; ');
          return `<div style="${styles}">${component.content}</div>`;
        })
        .join('\n');

      // Replace variables
      let rendered = html;
      Object.entries(variables).forEach(([key, value]) => {
        const regex = new RegExp(`{{${key}}}`, 'gi');
        rendered = rendered.replace(regex, value || '');
      });

      setRenderedHTML(rendered);
      setIsLoading(false);
    }
  }, [template, variables]);

  const handleVariableChange = (varName: string, value: string) => {
    onVariablesChange({
      ...variables,
      [varName]: value
    });
  };

  const copyHTML = async () => {
    try {
      await navigator.clipboard.writeText(renderedHTML);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy HTML:', error);
    }
  };

  const getPreviewWidth = () => {
    switch (previewMode) {
      case 'mobile':
        return 'w-80';
      case 'tablet':
        return 'w-96';
      case 'desktop':
      default:
        return 'w-full max-w-2xl';
    }
  };

  return (
    <div className="space-y-6">
      {/* Preview Controls */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center justify-between">
            <span>Email Preview</span>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreviewMode('desktop')}
                className={`border-slate-600 ${previewMode === 'desktop' ? 'bg-purple-600 text-white' : 'text-gray-300'}`}
              >
                <Monitor className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreviewMode('tablet')}
                className={`border-slate-600 ${previewMode === 'tablet' ? 'bg-purple-600 text-white' : 'text-gray-300'}`}
              >
                <Tablet className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreviewMode('mobile')}
                className={`border-slate-600 ${previewMode === 'mobile' ? 'bg-purple-600 text-white' : 'text-gray-300'}`}
              >
                <Smartphone className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={copyHTML}
                className="border-slate-600 text-gray-300 hover:bg-slate-700"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Variables */}
          <div className="space-y-4">
            <div>
              <Label className="text-gray-300">Template Variables</Label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {templateVariables.map((varName) => (
                  <div key={varName}>
                    <Label className="text-xs text-gray-400">{varName}</Label>
                    <Input
                      value={variables[varName] || ''}
                      onChange={(e) => handleVariableChange(varName, e.target.value)}
                      placeholder={`Enter ${varName}`}
                      className="bg-slate-700 border-slate-600 text-white text-sm"
                    />
                  </div>
                ))}
              </div>
              {templateVariables.length === 0 && (
                <p className="text-sm text-gray-500 mt-2">No variables found in template</p>
              )}
            </div>

            {/* Subject Preview */}
            <div>
              <Label className="text-gray-300">Subject Line</Label>
              <div className="mt-2 p-3 bg-slate-700 rounded-lg border border-slate-600">
                <p className="text-white">
                  {Object.entries(variables).reduce((subject, [key, value]) => {
                    const regex = new RegExp(`{{${key}}}`, 'gi');
                    return subject.replace(regex, value || '');
                  }, template.subject)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email Preview */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-6">
          <div className="flex justify-center">
            <div className={`${getPreviewWidth()} bg-white rounded-lg shadow-lg overflow-hidden`}>
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <RefreshCw className="h-8 w-8 animate-spin text-purple-500" />
                </div>
              ) : renderedHTML ? (
                <div 
                  className="p-6"
                  dangerouslySetInnerHTML={{ __html: renderedHTML }}
                />
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-500">
                  <p>Add components to see preview</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* HTML Output */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Generated HTML</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-slate-900 rounded-lg p-4 border border-slate-600">
            <pre className="text-sm text-gray-300 overflow-x-auto whitespace-pre-wrap">
              {renderedHTML || '<!-- No HTML generated yet -->'}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
