'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Save, 
  Eye, 
  Send, 
  Code,
  Variable,
  Copy,
  Check,
  ArrowLeft
} from 'lucide-react';
import { EmailTemplate, TemplatePreviewData } from '@/types/emailTemplates';
import { EmailTemplateService } from '@/lib/services/emailTemplates';

interface SimpleEmailBuilderProps {
  initialTemplate?: EmailTemplate;
  onSave?: (template: EmailTemplate) => void;
  onSend?: (template: EmailTemplate, variables: TemplatePreviewData) => void;
}

export default function SimpleEmailBuilder({ initialTemplate, onSave, onSend }: SimpleEmailBuilderProps) {
  const router = useRouter();
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

  const [previewVariables, setPreviewVariables] = useState<TemplatePreviewData>({});
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Update template when initialTemplate prop changes
  useEffect(() => {
    if (initialTemplate) {
      setTemplate(initialTemplate);
    }
  }, [initialTemplate]);

  // Extract variables from HTML and subject
  const extractVariables = useCallback((html: string, subject: string): string[] => {
    const variables = new Set<string>();
    
    // Extract from subject
    const subjectMatches = subject.match(/\{\{(\w+)\}\}/g);
    if (subjectMatches) {
      subjectMatches.forEach(match => {
        const varName = match.replace(/\{\{|\}\}/g, '');
        variables.add(varName);
      });
    }
    
    // Extract from HTML
    const htmlMatches = html.match(/\{\{(\w+)\}\}/g);
    if (htmlMatches) {
      htmlMatches.forEach(match => {
        const varName = match.replace(/\{\{|\}\}/g, '');
        variables.add(varName);
      });
    }
    
    return Array.from(variables);
  }, []);

  // Update variables when HTML or subject changes
  useEffect(() => {
    const variables = extractVariables(template.html, template.subject);
    const newVariables: TemplatePreviewData = {};
    
    variables.forEach(varName => {
      if (!(varName in previewVariables)) {
        newVariables[varName] = `Sample ${varName}`;
      }
    });
    
    if (Object.keys(newVariables).length > 0) {
      setPreviewVariables(prev => ({ ...prev, ...newVariables }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template.html, template.subject, extractVariables]);

  // Render preview HTML
  const renderPreviewHTML = useCallback(() => {
    let html = template.html;
    let subject = template.subject;
    
    Object.entries(previewVariables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'gi');
      html = html.replace(regex, value || '');
      subject = subject.replace(regex, value || '');
    });
    
    return { html, subject };
  }, [template.html, template.subject, previewVariables]);

  const handleVariableChange = (varName: string, value: string) => {
    setPreviewVariables(prev => ({
      ...prev,
      [varName]: value
    }));
  };

  const addVariable = () => {
    const newVarName = prompt('Enter variable name (e.g., name, company):');
    if (newVarName && newVarName.trim()) {
      const varName = newVarName.trim();
      setPreviewVariables(prev => ({
        ...prev,
        [varName]: `Sample ${varName}`
      }));
    }
  };

  const removeVariable = (varName: string) => {
    const newVariables = { ...previewVariables };
    delete newVariables[varName];
    setPreviewVariables(newVariables);
  };

  const copyHTML = async () => {
    const { html } = renderPreviewHTML();
    try {
      await navigator.clipboard.writeText(html);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy HTML:', error);
    }
  };

  const saveTemplate = async () => {
    setIsLoading(true);
    try {
      const variables = extractVariables(template.html, template.subject);
      const updatedTemplate = { 
        ...template, 
        variables: variables.map(name => ({
          id: `var_${Date.now()}_${Math.random()}`,
          name,
          description: `Variable: ${name}`,
          defaultValue: previewVariables[name] || '',
          required: false
        }))
      };
      
      let savedTemplate: EmailTemplate;
      
      if (template.id) {
        savedTemplate = await EmailTemplateService.updateTemplate(template.id, updatedTemplate);
        setTemplate(savedTemplate);
      } else {
        savedTemplate = await EmailTemplateService.createTemplate(updatedTemplate);
        setTemplate(savedTemplate);
      }
      
      onSave?.(savedTemplate);
    } catch (error) {
      console.error('Failed to save template:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendEmail = async () => {
    if (!onSend) return;
    
    setIsLoading(true);
    try {
      const { html, subject } = renderPreviewHTML();
      const updatedTemplate = { ...template, html, subject };
      onSend(updatedTemplate, previewVariables);
    } catch (error) {
      console.error('Failed to send email:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const variables = extractVariables(template.html, template.subject);
  const { html: previewHTML, subject: previewSubject } = renderPreviewHTML();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => router.push('/email-templates')}
              className="border-slate-600 text-gray-300 hover:bg-slate-700"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Templates
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Simple Email Template Builder</h1>
              <p className="text-gray-400">Create email templates with HTML and variables</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={saveTemplate}
              disabled={isLoading}
              className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Template
            </Button>
            {onSend && (
              <Button
                onClick={sendEmail}
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
          {/* Left Side - Editor */}
          <div className="col-span-7">
            <Tabs defaultValue="editor" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2 bg-slate-800/50">
                <TabsTrigger value="editor" className="data-[state=active]:bg-gradient-to-r from-teal-600 to-emerald-600">
                  <Code className="h-4 w-4 mr-2" />
                  Editor
                </TabsTrigger>
                <TabsTrigger value="preview" className="data-[state=active]:bg-gradient-to-r from-teal-600 to-emerald-600">
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </TabsTrigger>
              </TabsList>

              <TabsContent value="editor" className="space-y-4">
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
                          placeholder="Welcome {{name}} to {{company}}!"
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

                {/* HTML Editor */}
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center justify-between">
                      <span>HTML Content</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={copyHTML}
                        className="border-slate-600 text-gray-300 hover:bg-slate-700"
                      >
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={template.html}
                      onChange={(e) => setTemplate(prev => ({ ...prev, html: e.target.value }))}
                      placeholder={`<h1>Welcome {{name}}!</h1>
<p>We're excited to have you at {{company}}.</p>
<p>Your email: {{email}}</p>`}
                      className="bg-slate-700 border-slate-600 text-white font-mono"
                      rows={15}
                    />
                                         <p className="text-sm text-gray-400 mt-2">
                       Use {'{{variable_name}}'} syntax for dynamic content
                     </p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="preview">
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">Email Preview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Subject Preview */}
                      <div>
                        <Label className="text-gray-300">Subject:</Label>
                        <div className="mt-2 p-3 bg-slate-700 rounded-lg border border-slate-600">
                          <p className="text-white">{previewSubject}</p>
                        </div>
                      </div>

                      {/* HTML Preview */}
                      <div>
                        <Label className="text-gray-300">Content:</Label>
                        <div className="mt-2 bg-white rounded-lg shadow-lg overflow-hidden">
                          <div 
                            className="p-6 text-black"
                            dangerouslySetInnerHTML={{ __html: previewHTML }}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Side - Variables */}
          <div className="col-span-5">
            <div className="space-y-4">
              {/* Variables Panel */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center justify-between">
                    <span>Template Variables</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addVariable}
                      className="border-slate-600 text-gray-300 hover:bg-slate-700"
                    >
                      <Variable className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {variables.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <Variable className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No variables found</p>
                      <p className="text-sm">Add {'{{variable_name}}'} to your HTML to see them here</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {variables.map((varName) => (
                        <div key={varName} className="flex items-center space-x-2">
                          <Badge variant="outline" className="bg-purple-500/20 border-purple-500/30 text-purple-300">
                            {`{{${varName}}}`}
                          </Badge>
                          <Input
                            value={previewVariables[varName] || ''}
                            onChange={(e) => handleVariableChange(varName, e.target.value)}
                            placeholder={`Value for ${varName}`}
                            className="bg-slate-700 border-slate-600 text-white text-sm flex-1"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeVariable(varName)}
                            className="h-8 w-8 p-0 text-red-400 hover:text-red-300"
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Variables */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white text-sm">Quick Variables</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    {['name', 'email', 'company', 'date', 'id'].map((varName) => {
                      const isAdded = varName in previewVariables;
                      
                      return (
                        <Button
                          key={varName}
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (!isAdded) {
                              setPreviewVariables(prev => ({
                                ...prev,
                                [varName]: `Sample ${varName}`
                              }));
                            }
                          }}
                          disabled={isAdded}
                          className={`justify-start h-auto p-2 text-xs ${
                            isAdded 
                              ? 'border-green-500/30 text-green-400 bg-green-500/10' 
                              : 'border-slate-600 text-gray-300 hover:bg-slate-700'
                          }`}
                        >
                          <Variable className="h-3 w-3 mr-1" />
                          {varName}
                        </Button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* HTML Output */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white text-sm">Generated HTML</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-slate-900 rounded-lg p-4 border border-slate-600 max-h-64 overflow-y-auto">
                    <pre className="text-xs text-gray-300 whitespace-pre-wrap">
                      {previewHTML || '<!-- No HTML generated yet -->'}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
