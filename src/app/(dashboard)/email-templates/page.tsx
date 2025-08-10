'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Copy, 
  Send,
  Search,
  FileText,
  Calendar,
  Store,
  Folder,
  Users,
  Upload,
  AlertCircle,
  Download
} from 'lucide-react';
import { EmailTemplate, TemplatePreviewData } from '@/types/emailTemplates';
import { EmailTemplateService } from '@/lib/services/emailTemplates';
import { EmailService } from '@/lib/services/email';
import { usePaymentRequired } from '@/components/PaymentRequiredProvider';
import Link from 'next/link';

export default function EmailTemplatesPage() {
  const { showPaymentRequired } = usePaymentRequired();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [sendEmail, setSendEmail] = useState({
    recipient: '',
    subject: '',
    variables: {} as TemplatePreviewData
  });

  // Bulk email state
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [isBulkSending, setIsBulkSending] = useState(false);
  const [bulkEmail, setBulkEmail] = useState({
    template: null as EmailTemplate | null,
    requiredColumns: [] as string[],
    csvData: [] as Record<string, string>[],
    subject: ''
  });
  const [csvError, setCsvError] = useState('');
  const [csvSuccess, setCsvSuccess] = useState('');

  // Template Store - Pre-made templates
  const templateStore: Array<{
    id: string;
    name: string;
    description: string;
    subject: string;
    html: string;
    variables: string[];
    category: string;
  }> = [
    {
      id: 'welcome-email',
      name: 'Welcome Email',
      description: 'Beautiful welcome email for new users',
      subject: 'Welcome {{name}} to {{company}}!',
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Welcome {{name}}!</h1>
  </div>
  
  <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    <p style="color: #333; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
      We're thrilled to have you join us at <strong>{{company}}</strong>!
    </p>
    
    <p style="color: #666; font-size: 14px; line-height: 1.5; margin-bottom: 25px;">
      Your account has been successfully created with the email: <strong>{{email}}</strong>
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{login_url}}" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
        Get Started
      </a>
    </div>
    
    <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
      <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
        If you have any questions, please contact us at {{support_email}}
      </p>
    </div>
  </div>
</div>`,
      variables: ['name', 'company', 'email', 'login_url', 'support_email'],
      category: 'Onboarding'
    },
    {
      id: 'newsletter',
      name: 'Newsletter Template',
      description: 'Professional newsletter with featured content',
      subject: '{{company}} Newsletter - {{month}} {{year}}',
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa;">
  <div style="background: #2c3e50; padding: 30px; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">{{company}} Newsletter</h1>
    <p style="color: #bdc3c7; margin: 10px 0 0 0;">{{month}} {{year}}</p>
  </div>
  
  <div style="padding: 30px; background: white;">
    <h2 style="color: #2c3e50; margin-top: 0;">Hello {{name}}!</h2>
    
    <div style="background: #ecf0f1; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="color: #2c3e50; margin-top: 0;">Featured Article</h3>
      <p style="color: #34495e; line-height: 1.6;">{{featured_article}}</p>
      <a href="{{article_url}}" style="color: #3498db; text-decoration: none;">Read More →</a>
    </div>
    
    <div style="border-top: 1px solid #ecf0f1; padding-top: 20px; margin-top: 30px;">
      <p style="color: #7f8c8d; font-size: 14px;">
        Thanks for reading!<br>
        The {{company}} Team
      </p>
    </div>
  </div>
</div>`,
      variables: ['name', 'company', 'month', 'year', 'featured_article', 'article_url'],
      category: 'Newsletter'
    },
    {
      id: 'promotional',
      name: 'Promotional Email',
      description: 'Eye-catching promotional email with CTA',
      subject: '{{offer_title}} - Limited Time Only!',
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: linear-gradient(45deg, #ff6b6b, #ee5a24); padding: 40px; text-align: center; color: white;">
    <h1 style="margin: 0; font-size: 32px; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">{{offer_title}}</h1>
    <p style="font-size: 18px; margin: 10px 0 30px 0; opacity: 0.9;">{{offer_description}}</p>
    <div style="background: white; color: #ff6b6b; padding: 15px; border-radius: 10px; display: inline-block; font-size: 24px; font-weight: bold;">
      {{discount_amount}} OFF!
    </div>
  </div>
  
  <div style="padding: 30px; background: white;">
    <p style="color: #333; font-size: 16px; line-height: 1.6;">Hi {{name}},</p>
    <p style="color: #666; font-size: 14px; line-height: 1.5;">{{promotional_text}}</p>
    
    <div style="text-align: center; margin: 40px 0;">
      <a href="{{cta_url}}" style="background: #ff6b6b; color: white; padding: 15px 40px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold; font-size: 16px; box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);">
        {{cta_text}}
      </a>
    </div>
    
    <p style="color: #999; font-size: 12px; text-align: center; margin-top: 30px;">
      Offer expires {{expiry_date}}
    </p>
  </div>
</div>`,
      variables: ['name', 'offer_title', 'offer_description', 'discount_amount', 'promotional_text', 'cta_url', 'cta_text', 'expiry_date'],
      category: 'Promotional'
    }
  ];

  // Extract variables from template
  const extractTemplateVariables = (template: EmailTemplate): string[] => {
    const variables = new Set<string>();
    
    // Extract from subject
    const subjectMatches = template.subject.match(/\{\{(\w+)\}\}/g);
    if (subjectMatches) {
      subjectMatches.forEach(match => {
        const varName = match.replace(/\{\{|\}\}/g, '');
        variables.add(varName);
      });
    }
    
    // Extract from HTML
    const htmlMatches = template.html.match(/\{\{(\w+)\}\}/g);
    if (htmlMatches) {
      htmlMatches.forEach(match => {
        const varName = match.replace(/\{\{|\}\}/g, '');
        variables.add(varName);
      });
    }
    
    return Array.from(variables);
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setIsLoading(true);
      const fetchedTemplates = await EmailTemplateService.getTemplates();
      setTemplates(fetchedTemplates);
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    
    try {
      await EmailTemplateService.deleteTemplate(templateId);
      setTemplates(prev => prev.filter(t => t.id !== templateId));
    } catch (error) {
      console.error('Failed to delete template:', error);
    }
  };

  const duplicateTemplate = async (template: EmailTemplate) => {
    try {
      const newTemplate = {
        ...template,
        name: `${template.name} (Copy)`,
        description: template.description ? `${template.description} (Copy)` : 'Copy of existing template'
      };
      
      const created = await EmailTemplateService.createTemplate(newTemplate);
      setTemplates(prev => [...prev, created]);
    } catch (error) {
      console.error('Failed to duplicate template:', error);
    }
  };

  const sendTemplateEmail = async () => {
    if (!selectedTemplate || !sendEmail.recipient) return;

    try {
      setIsSending(true);
      
      // Replace variables in template HTML and subject locally
      let renderedHtml = selectedTemplate.html;
      let renderedSubject = selectedTemplate.subject;
      
      Object.entries(sendEmail.variables).forEach(([key, value]) => {
        const regex = new RegExp(`{{${key}}}`, 'gi');
        renderedHtml = renderedHtml.replace(regex, value || '');
        renderedSubject = renderedSubject.replace(regex, value || '');
      });
      
      // Send email directly to email service with rendered HTML
      const response = await EmailService.sendEmail(
        sendEmail.recipient,
        sendEmail.subject || renderedSubject,
        renderedHtml
      );

      if (response.success) {
        alert('Email sent successfully!');
        setSelectedTemplate(null);
        setSendEmail({ recipient: '', subject: '', variables: {} });
      } else {
        alert('Failed to send email: ' + response.error);
      }
    } catch (error: unknown) {
      console.error('Failed to send template email:', error);
      
      // Handle 402 Payment Required error
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number; data?: { message?: string } } };
        if (axiosError.response?.status === 402) {
          showPaymentRequired(
            axiosError.response?.data?.message || 'Insufficient credits to send email. Please reload your account.',
            '/billing'
          );
          return;
        }
      }
      
      alert('Failed to send email. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  // Handle CSV file upload for bulk email
  const handleCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csvText = e.target?.result as string;
        const lines = csvText.split('\n');
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        
        // Validate required columns
        const missingColumns = bulkEmail.requiredColumns.filter(col => 
          !headers.includes(col)
        );
        
        if (missingColumns.length > 0) {
          setCsvError(`Missing required columns: ${missingColumns.join(', ')}`);
          setCsvSuccess('');
          return;
        }

        // Parse CSV data
        const data = lines.slice(1).filter(line => line.trim()).map(line => {
          const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
          const row: Record<string, string> = {};
          headers.forEach((header, index) => {
            row[header] = values[index] || '';
          });
          return row;
        });

        setBulkEmail(prev => ({ ...prev, csvData: data }));
        setCsvSuccess(`Successfully loaded ${data.length} recipients`);
        setCsvError('');
      } catch {
        setCsvError('Failed to parse CSV file. Please check the format.');
        setCsvSuccess('');
      }
    };
    reader.readAsText(file);
  };

  // Send bulk emails
  const sendBulkEmails = async () => {
    if (!bulkEmail.template || bulkEmail.csvData.length === 0) return;

    try {
      setIsBulkSending(true);
      
      // Process each row and send email
      const emails = bulkEmail.csvData.map(row => {
        let renderedHtml = bulkEmail.template!.html;
        let renderedSubject = bulkEmail.subject;
        
        // Replace variables with row data
        Object.entries(row).forEach(([key, value]) => {
          const regex = new RegExp(`{{${key}}}`, 'gi');
          renderedHtml = renderedHtml.replace(regex, String(value) || '');
          renderedSubject = renderedSubject.replace(regex, String(value) || '');
        });

        return {
          to: row.email || row.Email || row.EMAIL,
          subject: renderedSubject,
          html: renderedHtml
        };
      });

      // Send bulk emails
      const response = await EmailService.sendBulkEmails(emails);

      if (response.success) {
        alert(`Successfully sent ${emails.length} emails!`);
        setShowBulkModal(false);
        setBulkEmail({ template: null, requiredColumns: [], csvData: [], subject: '' });
        setCsvError('');
        setCsvSuccess('');
      } else {
        alert('Failed to send bulk emails: ' + response.error);
      }
    } catch (error: unknown) {
      console.error('Failed to send bulk emails:', error);
      
      // Handle 402 Payment Required error
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number; data?: { message?: string } } };
        if (axiosError.response?.status === 402) {
          showPaymentRequired(
            axiosError.response?.data?.message || 'Insufficient credits to send bulk emails. Please reload your account.',
            '/billing'
          );
          return;
        }
      }
      
      alert('Failed to send bulk emails. Please try again.');
    } finally {
      setIsBulkSending(false);
    }
  };

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const navigateToTemplateBuilder = (template: { name: string; description?: string; subject: string; html: string }) => {
    // Navigate to builder with template data
    const templateData = encodeURIComponent(JSON.stringify({
      name: template.name,
      description: template.description,
      subject: template.subject,
      html: template.html
    }));
    window.location.href = `/email-templates/builder?template=${templateData}`;
  };

  const renderTemplatePreview = (html: string, variables: string[]) => {
    let previewHTML = html;
    variables.forEach(varName => {
      const regex = new RegExp(`{{${varName}}}`, 'gi');
      previewHTML = previewHTML.replace(regex, `Sample ${varName}`);
    });
    return previewHTML;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Email Templates</h1>
            <p className="text-gray-400">Create and manage beautiful email templates</p>
          </div>
          <Link href="/email-templates/builder">
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </Link>
        </div>

        {/* Search */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-700 border-slate-600 text-white"
              />
            </div>
          </CardContent>
        </Card>

        {/* Main Content with Tabs */}
        <Tabs defaultValue="my-templates" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-slate-800/50">
            <TabsTrigger value="my-templates" className="data-[state=active]:bg-purple-600">
              <Folder className="h-4 w-4 mr-2" />
              My Templates
            </TabsTrigger>
            <TabsTrigger value="template-store" className="data-[state=active]:bg-purple-600">
              <Store className="h-4 w-4 mr-2" />
              Template Store
            </TabsTrigger>
          </TabsList>

          {/* My Templates Tab */}
          <TabsContent value="my-templates" className="space-y-6">
            {/* Search */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search templates..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Templates Grid */}
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
              </div>
            ) : filteredTemplates.length === 0 ? (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-12 text-center">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-white text-lg font-medium mb-2">No templates found</h3>
                  <p className="text-gray-400 mb-4">
                    {searchTerm ? 'No templates match your search.' : 'Get started by creating your first email template.'}
                  </p>
                  <Link href="/email-templates/builder">
                    <Button className="bg-purple-600 hover:bg-purple-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Template
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredTemplates.map((template) => (
              <Card key={template.id} className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-colors">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-white text-lg mb-2">{template.name}</CardTitle>
                      {template.description && (
                        <p className="text-gray-400 text-sm mb-3">{template.description}</p>
                      )}
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(template.created_at)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <FileText className="h-3 w-3" />
                          <span>{template.components.length} components</span>
                        </div>
                      </div>
                    </div>
                    {template.is_default && (
                      <Badge variant="secondary" className="bg-green-500/20 text-green-300">
                        Default
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Actions - Moved to top */}
                    <div className="flex items-center space-x-2">
                      <Link href={`/email-templates/builder?id=${template.id}`}>
                        <Button variant="outline" size="sm" className="border-slate-600 text-gray-300 hover:bg-slate-700">
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const variables = extractTemplateVariables(template);
                          const initialVariables: TemplatePreviewData = {};
                          variables.forEach(varName => {
                            initialVariables[varName] = `Sample ${varName}`;
                          });
                          
                          setSendEmail({
                            recipient: '',
                            subject: template.subject,
                            variables: initialVariables
                          });
                          setSelectedTemplate(template);
                        }}
                        className="border-slate-600 text-gray-300 hover:bg-slate-700"
                      >
                        <Send className="h-3 w-3 mr-1" />
                        Send Single
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const variables = extractTemplateVariables(template);
                          setBulkEmail({
                            template: template,
                            requiredColumns: variables,
                            csvData: [],
                            subject: template.subject
                          });
                          setShowBulkModal(true);
                        }}
                        className="border-green-600 text-green-300 hover:bg-green-500/10"
                      >
                        <Users className="h-3 w-3 mr-1" />
                        Send Bulk
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => duplicateTemplate(template)}
                        className="border-slate-600 text-gray-300 hover:bg-slate-700"
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copy
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteTemplate(template.id)}
                        className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>

                    {/* HTML Preview */}
                    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                      <div 
                        className="p-4 text-black"
                        dangerouslySetInnerHTML={{ __html: renderTemplatePreview(template.html, extractTemplateVariables(template)) }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
          </TabsContent>

          {/* Template Store Tab */}
          <TabsContent value="template-store" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {templateStore.map((template) => (
                <Card key={template.id} className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-colors">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-white text-lg mb-2">{template.name}</CardTitle>
                        <p className="text-gray-400 text-sm mb-3">{template.description}</p>
                        <Badge variant="secondary" className="bg-blue-500/20 text-blue-300">
                          {template.category}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {/* Actions - Moved to top */}
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigateToTemplateBuilder(template)}
                          className="border-slate-600 text-gray-300 hover:bg-slate-700"
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Use Template
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // Convert template store template to EmailTemplate format
                            const emailTemplate: EmailTemplate = {
                              id: template.id,
                              name: template.name,
                              description: template.description,
                              subject: template.subject,
                              html: template.html,
                              variables: template.variables.map(name => ({
                                id: `var_${name}`,
                                name,
                                description: `Variable: ${name}`,
                                defaultValue: '',
                                required: false
                              })),
                              components: [],
                              created_at: new Date().toISOString(),
                              updated_at: new Date().toISOString()
                            };
                            
                            setBulkEmail({
                              template: emailTemplate,
                              requiredColumns: template.variables,
                              csvData: [],
                              subject: template.subject
                            });
                            setShowBulkModal(true);
                          }}
                          className="border-green-600 text-green-300 hover:bg-green-500/10"
                        >
                          <Users className="h-3 w-3 mr-1" />
                          Send Bulk
                        </Button>
                      </div>

                      {/* Variables */}
                      <div className="flex flex-wrap gap-1">
                        {template.variables.map((varName) => (
                          <Badge key={varName} variant="outline" className="bg-purple-500/20 border-purple-500/30 text-purple-300 text-xs">
                            {`{{${varName}}}`}
                          </Badge>
                        ))}
                      </div>

                      {/* HTML Preview */}
                      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                        <div 
                          className="p-4 text-black"
                          dangerouslySetInnerHTML={{ __html: renderTemplatePreview(template.html, template.variables) }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Send Template Modal */}
        {selectedTemplate && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="bg-slate-800 border-slate-700 w-full max-w-md">
              <CardHeader>
                <CardTitle className="text-white">Send Template Email</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-gray-300 text-sm">Recipient Email</label>
                  <Input
                    type="email"
                    value={sendEmail.recipient}
                    onChange={(e) => setSendEmail(prev => ({ ...prev, recipient: e.target.value }))}
                    placeholder="recipient@example.com"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                
                <div>
                  <label className="text-gray-300 text-sm">Subject Line</label>
                  <Input
                    value={sendEmail.subject}
                    onChange={(e) => setSendEmail(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder={selectedTemplate.subject}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>

                {/* Variables */}
                {Object.keys(sendEmail.variables).length > 0 && (
                  <div>
                    <label className="text-gray-300 text-sm">Template Variables</label>
                    <div className="space-y-2 mt-2">
                      {Object.entries(sendEmail.variables).map(([key, value]) => (
                        <div key={key} className="space-y-1">
                          <label className="text-xs text-gray-400">{`{{${key}}}`}</label>
                          <Input
                            value={value}
                            onChange={(e) => setSendEmail(prev => ({
                              ...prev,
                              variables: { ...prev.variables, [key]: e.target.value }
                            }))}
                            placeholder={`Enter value for ${key}`}
                            className="bg-slate-700 border-slate-600 text-white text-sm"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex space-x-2 pt-4">
                  <Button
                    onClick={sendTemplateEmail}
                    disabled={isSending || !sendEmail.recipient}
                    className="bg-purple-600 hover:bg-purple-700 flex-1"
                  >
                    {isSending ? 'Sending...' : 'Send Email'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedTemplate(null)}
                    className="border-slate-600 text-gray-300 hover:bg-slate-700"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Bulk Email Modal */}
        {showBulkModal && bulkEmail.template && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="bg-slate-800 border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle className="text-white">Send Bulk Email with Template</CardTitle>
                <p className="text-gray-400 text-sm">Upload a CSV file with recipient data to send personalized emails</p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Template Info */}
                <div className="bg-slate-700/50 p-4 rounded-lg">
                  <h3 className="text-white font-semibold mb-2">Template: {bulkEmail.template.name}</h3>
                  <p className="text-gray-300 text-sm mb-3">{bulkEmail.template.description}</p>
                  
                  <div>
                    <label className="text-gray-300 text-sm">Required CSV Columns:</label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {bulkEmail.requiredColumns.map((col) => (
                        <Badge key={col} variant="outline" className="bg-purple-500/20 border-purple-500/30 text-purple-300">
                          {col}
                        </Badge>
                      ))}
                      <Badge variant="outline" className="bg-green-500/20 border-green-500/30 text-green-300">
                        email
                      </Badge>
                    </div>
                    <div className="mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const headers = [...bulkEmail.requiredColumns, 'email'];
                          const csvContent = headers.join(',') + '\n' + 
                            headers.map(h => `Sample ${h}`).join(',') + '\n' +
                            headers.map(h => `Another ${h}`).join(',');
                          
                          const blob = new Blob([csvContent], { type: 'text/csv' });
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = 'template_example.csv';
                          a.click();
                          window.URL.revokeObjectURL(url);
                        }}
                        className="border-blue-600 text-blue-300 hover:bg-blue-500/10 text-xs"
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Download Example CSV
                      </Button>
                    </div>
                  </div>
                </div>

                {/* CSV Upload */}
                <div>
                  <label className="text-gray-300 text-sm">Upload CSV File</label>
                  <div className="mt-2">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleCsvUpload}
                      className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700"
                    />
                  </div>
                  
                  {csvError && (
                    <div className="mt-2 flex items-center text-red-400 text-sm">
                      <AlertCircle className="h-4 w-4 mr-2" />
                      {csvError}
                    </div>
                  )}
                  
                  {csvSuccess && (
                    <div className="mt-2 flex items-center text-green-400 text-sm">
                      <Upload className="h-4 w-4 mr-2" />
                      {csvSuccess}
                    </div>
                  )}
                </div>

                {/* CSV Preview */}
                {bulkEmail.csvData.length > 0 && (
                  <div>
                    <label className="text-gray-300 text-sm">Preview (First 3 rows):</label>
                    <div className="mt-2 bg-slate-700/50 p-4 rounded-lg overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-gray-300 border-b border-slate-600">
                            {Object.keys(bulkEmail.csvData[0]).map((header) => (
                              <th key={header} className="text-left p-2">{header}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {bulkEmail.csvData.slice(0, 3).map((row, index) => (
                            <tr key={index} className="text-gray-400 border-b border-slate-600">
                              {Object.values(row).map((value, i) => (
                                <td key={i} className="p-2">{String(value)}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Subject Line */}
                <div>
                  <label className="text-gray-300 text-sm">Subject Line</label>
                  <Input
                    value={bulkEmail.subject}
                    onChange={(e) => setBulkEmail(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="Email subject line"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>

                {/* Actions */}
                <div className="flex space-x-2 pt-4">
                  <Button
                    onClick={sendBulkEmails}
                    disabled={isBulkSending || bulkEmail.csvData.length === 0}
                    className="bg-green-600 hover:bg-green-700 flex-1"
                  >
                    {isBulkSending ? 'Sending...' : `Send ${bulkEmail.csvData.length} Emails`}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowBulkModal(false);
                      setBulkEmail({ template: null, requiredColumns: [], csvData: [], subject: '' });
                      setCsvError('');
                      setCsvSuccess('');
                    }}
                    className="border-slate-600 text-gray-300 hover:bg-slate-700"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
