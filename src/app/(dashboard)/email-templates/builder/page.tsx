'use client';

import { useState, useEffect, useCallback } from 'react';
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
  const templateBase64 = searchParams.get('templateBase64');

  const loadTemplate = useCallback(async () => {
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
  }, [templateId, router]);

  useEffect(() => {
    if (templateId) {
      loadTemplate();
    } else if (templateBase64) {
      // Load template from Base64 encoded data (new safer method)
      try {
        const decodedJson = decodeURIComponent(atob(templateBase64));
        const parsedTemplate = JSON.parse(decodedJson);
        
        // Format the HTML for better readability
        const formatHTML = (html: string): string => {
          if (!html) return '';
          
          // Remove extra whitespace and line breaks
          const formatted = html.replace(/>\s+</g, '><').trim();
          
          // Add proper indentation
          let indentLevel = 0;
          const indent = '  '; // 2 spaces
          const lines: string[] = [];
          
          // Split by tags while preserving them
          const tokens = formatted.split(/(<[^>]*>)/);
          let currentLine = '';
          
          for (const token of tokens) {
            if (!token) continue;
            
            if (token.startsWith('<')) {
              // Handle tags
              if (token.startsWith('</')) {
                // Closing tag - decrease indent
                indentLevel = Math.max(0, indentLevel - 1);
                if (currentLine.trim()) {
                  lines.push(indent.repeat(indentLevel + 1) + currentLine.trim());
                  currentLine = '';
                }
                lines.push(indent.repeat(indentLevel) + token);
              } else if (token.endsWith('/>')) {
                // Self-closing tag
                if (currentLine.trim()) {
                  lines.push(indent.repeat(indentLevel) + currentLine.trim());
                  currentLine = '';
                }
                lines.push(indent.repeat(indentLevel) + token);
              } else {
                // Opening tag
                if (currentLine.trim()) {
                  lines.push(indent.repeat(indentLevel) + currentLine.trim());
                  currentLine = '';
                }
                lines.push(indent.repeat(indentLevel) + token);
                indentLevel++;
              }
            } else {
              // Text content
              const text = token.trim();
              if (text) {
                currentLine += text;
              }
            }
          }
          
          // Add any remaining content
          if (currentLine.trim()) {
            lines.push(indent.repeat(indentLevel) + currentLine.trim());
          }
          
          return lines.join('\n');
        };

        setTemplate({
          id: '',
          name: parsedTemplate.name,
          description: parsedTemplate.description,
          subject: parsedTemplate.subject,
          html: formatHTML(parsedTemplate.html),
          components: [],
          variables: [],
          created_at: '',
          updated_at: '',
        });
      } catch (error) {
        console.error('Failed to parse Base64 template data:', error);
        router.push('/email-templates');
      }
    } else if (templateData) {
      // Load template from legacy URI encoded data (fallback method)
      try {
        // Robust template data parsing with multiple fallback strategies
        let parsedTemplate;
        
        // Strategy 1: Try parsing raw data first (simplest case)
        try {
          parsedTemplate = JSON.parse(templateData);
        } catch (directParseError) {
          console.log('Direct parse failed, trying URI decoding...');
          
          // Strategy 2: Try URI decoding then parse
          try {
            const decodedData = decodeURIComponent(templateData);
            parsedTemplate = JSON.parse(decodedData);
          } catch (decodeError) {
            console.log('URI decode failed, trying manual cleanup...');
            
            // Strategy 3: Manual cleanup for escaped content
            try {
              let cleanedData = templateData;
              
              // Handle common encoding issues
              cleanedData = cleanedData
                .replace(/\\"/g, '"')           // Fix escaped quotes
                .replace(/\\\\/g, '\\')         // Fix double escaped backslashes
                .replace(/\\n/g, '\n')          // Fix escaped newlines
                .replace(/\\t/g, '\t');         // Fix escaped tabs
              
              // Try parsing the cleaned data
              parsedTemplate = JSON.parse(cleanedData);
            } catch (cleanupError) {
              console.log('Manual cleanup failed, trying partial decode...');
              
              // Strategy 4: Partial decode (only decode specific characters)
              try {
                const partialDecoded = templateData
                  .replace(/%22/g, '"')         // Decode quotes
                  .replace(/%7B/g, '{')         // Decode opening braces
                  .replace(/%7D/g, '}')         // Decode closing braces
                  .replace(/%3A/g, ':')         // Decode colons
                  .replace(/%2C/g, ',')         // Decode commas
                  .replace(/%20/g, ' ')         // Decode spaces
                  .replace(/%5C/g, '\\');       // Decode backslashes
                
                parsedTemplate = JSON.parse(partialDecoded);
              } catch (partialError) {
                console.error('All parsing strategies failed:', {
                  directParseError,
                  decodeError,
                  cleanupError,
                  partialError
                });
                throw new Error('Unable to parse template data - all strategies failed');
              }
            }
          }
        }
        // Format the HTML for better readability
        const formatHTML = (html: string): string => {
          if (!html) return '';
          
          // Remove extra whitespace and line breaks
          const formatted = html.replace(/>\s+</g, '><').trim();
          
          // Add proper indentation
          let indentLevel = 0;
          const indent = '  '; // 2 spaces
          const lines: string[] = [];
          
          // Split by tags while preserving them
          const tokens = formatted.split(/(<[^>]*>)/);
          let currentLine = '';
          
          for (const token of tokens) {
            if (!token) continue;
            
            if (token.startsWith('<')) {
              // Handle tags
              if (token.startsWith('</')) {
                // Closing tag - decrease indent
                indentLevel = Math.max(0, indentLevel - 1);
                if (currentLine.trim()) {
                  lines.push(indent.repeat(indentLevel + 1) + currentLine.trim());
                  currentLine = '';
                }
                lines.push(indent.repeat(indentLevel) + token);
              } else if (token.endsWith('/>')) {
                // Self-closing tag
                if (currentLine.trim()) {
                  lines.push(indent.repeat(indentLevel) + currentLine.trim());
                  currentLine = '';
                }
                lines.push(indent.repeat(indentLevel) + token);
              } else {
                // Opening tag
                if (currentLine.trim()) {
                  lines.push(indent.repeat(indentLevel) + currentLine.trim());
                  currentLine = '';
                }
                lines.push(indent.repeat(indentLevel) + token);
                indentLevel++;
              }
            } else {
              // Text content
              const text = token.trim();
              if (text) {
                currentLine += text;
              }
            }
          }
          
          // Add any remaining content
          if (currentLine.trim()) {
            lines.push(indent.repeat(indentLevel) + currentLine.trim());
          }
          
          return lines.join('\n');
        };

        setTemplate({
          id: '',
          name: parsedTemplate.name,
          description: parsedTemplate.description,
          subject: parsedTemplate.subject,
          html: formatHTML(parsedTemplate.html),
          components: [],
          variables: [],
          created_at: '',
          updated_at: '',
        });
      } catch (error) {
        console.error('Failed to parse template data:', error);
        // Redirect back to templates page if parsing fails
        router.push('/email-templates');
      }
    }
  }, [templateId, templateBase64, templateData, loadTemplate, router]);

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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-900 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
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
