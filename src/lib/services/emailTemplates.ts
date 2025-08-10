import { api } from '../api';
import { EmailTemplate, TemplatePreviewData } from '@/types/emailTemplates';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  message?: string;
}

interface TemplatesResponse {
  templates: EmailTemplate[];
}

interface TemplateResponse {
  template: EmailTemplate;
}

interface RenderResponse {
  html: string;
  subject: string;
}

interface DeleteResponse {
  message: string;
}

export class EmailTemplateService {
  static async createTemplate(template: Omit<EmailTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<EmailTemplate> {
    try {
      const response = await api.post<ApiResponse<TemplateResponse>>('/email_templates', {
        template
      });
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to create template');
      }
      
      return response.data.data.template;
    } catch (error) {
      console.error('Failed to create template:', error);
      throw error;
    }
  }

  static async updateTemplate(id: string, template: Partial<EmailTemplate>): Promise<EmailTemplate> {
    try {
      const response = await api.put<ApiResponse<TemplateResponse>>(`/email_templates/${id}`, {
        template
      });
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to update template');
      }
      
      return response.data.data.template;
    } catch (error) {
      console.error('Failed to update template:', error);
      throw error;
    }
  }

  static async getTemplates(): Promise<EmailTemplate[]> {
    try {
      const response = await api.get<ApiResponse<TemplatesResponse>>('/email_templates');
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to get templates');
      }
      
      return response.data.data.templates || [];
    } catch (error) {
      console.error('Failed to get templates:', error);
      throw error;
    }
  }

  static async getTemplate(id: string): Promise<EmailTemplate> {
    try {
      const response = await api.get<ApiResponse<TemplateResponse>>(`/email_templates/${id}`);
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to get template');
      }
      
      return response.data.data.template;
    } catch (error) {
      console.error('Failed to get template:', error);
      throw error;
    }
  }

  static async deleteTemplate(id: string): Promise<void> {
    try {
      const response = await api.delete<ApiResponse<DeleteResponse>>(`/email_templates/${id}`);
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to delete template');
      }
    } catch (error) {
      console.error('Failed to delete template:', error);
      throw error;
    }
  }

  static async renderTemplate(templateId: string, variables: TemplatePreviewData): Promise<{ html: string; subject: string }> {
    try {
      const response = await api.post<ApiResponse<RenderResponse>>(`/email_templates/${templateId}/render`, { 
        variables 
      });
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to render template');
      }
      
      return response.data.data;
    } catch (error) {
      console.error('Failed to render template:', error);
      throw error;
    }
  }

  // Helper method to render template locally for preview
  static renderTemplateLocally(template: EmailTemplate, variables: TemplatePreviewData): string {
    let html = template.html;
    
    // Replace variables in the HTML
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'gi');
      html = html.replace(regex, value || '');
    });
    
    return html;
  }

  // Helper method to render template locally for preview with subject
  static renderTemplateLocallyWithSubject(template: EmailTemplate, variables: TemplatePreviewData): { html: string; subject: string } {
    let html = template.html;
    let subject = template.subject;
    
    // Replace variables in both HTML and subject
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'gi');
      html = html.replace(regex, value || '');
      subject = subject.replace(regex, value || '');
    });
    
    return { html, subject };
  }

  // Helper method to extract variables from template
  static extractVariables(template: EmailTemplate): string[] {
    const variables = new Set<string>();
    
    // Extract from subject
    const subjectMatches = template.subject.match(/\{\{(\w+)\}\}/g);
    if (subjectMatches) {
      subjectMatches.forEach(match => {
        const varName = match.replace(/\{\{|\}\}/g, '');
        variables.add(varName);
      });
    }
    
    // Extract from components
    template.components.forEach(component => {
      const contentMatches = component.content.match(/\{\{(\w+)\}\}/g);
      if (contentMatches) {
        contentMatches.forEach(match => {
          const varName = match.replace(/\{\{|\}\}/g, '');
          variables.add(varName);
        });
      }
    });
    
    return Array.from(variables);
  }
}
