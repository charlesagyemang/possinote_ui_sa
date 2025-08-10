'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import SimpleEmailBuilder from '@/components/email-builder/SimpleEmailBuilder';
import { EmailTemplate, TemplatePreviewData } from '@/types/emailTemplates';
import { EmailTemplateService } from '@/lib/services/emailTemplates';
import { EmailService } from '@/lib/services/email';
import { usePaymentRequired } from '@/components/PaymentRequiredProvider';

export default function EmailTemplateBuilderPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { showPaymentRequired } = usePaymentRequired();
  const [template, setTemplate] = useState<EmailTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const templateId = searchParams.get('id');
  const templateData = searchParams.get('template');

  useEffect(() => {
    if (templateId) {
      loadTemplate();
    } else if (templateData) {
      // Load template from store
      try {
        const parsedTemplate = JSON.parse(decodeURIComponent(templateData));
        setTemplate({
          id: '',
          name: parsedTemplate.name,
          description: parsedTemplate.description,
          subject: parsedTemplate.subject,
          html: parsedTemplate.html,
          components: [],
          variables: [],
          created_at: '',
          updated_at: '',
        });
      } catch (error) {
        console.error('Failed to parse template data:', error);
      }
    }
  }, [templateId, templateData]);

  const loadTemplate = async () => {
    if (!templateId) return;
    
    try {
      setIsLoading(true);
      const loadedTemplate = await EmailTemplateService.getTemplate(templateId);
      setTemplate(loadedTemplate);
    } catch (error) {
      console.error('Failed to load template:', error);
      // Redirect to templates list if template not found
      router.push('/email-templates');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (savedTemplate: EmailTemplate) => {
    setTemplate(savedTemplate);
    // Redirect back to templates page after saving
    router.push('/email-templates');
  };

  const handleSend = async (template: EmailTemplate, variables: TemplatePreviewData) => {
    try {
      // For now, we'll use a simple prompt for recipient
      const recipient = prompt('Enter recipient email address:');
      if (!recipient) return;

      const subject = prompt('Enter email subject:', template.subject);
      if (!subject) return;

      // Render template with variables using API
      const rendered = await EmailTemplateService.renderTemplate(template.id, variables);
      
      // Send email using existing service
      const response = await EmailService.sendEmail(recipient, subject || rendered.subject, rendered.html);

      if (response.success) {
        alert('Email sent successfully!');
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
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <SimpleEmailBuilder
      initialTemplate={template || undefined}
      onSave={handleSave}
      onSend={handleSend}
    />
  );
}
