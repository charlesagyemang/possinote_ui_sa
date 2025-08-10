export interface EmailVariable {
  id: string;
  name: string;
  description: string;
  defaultValue?: string;
  required?: boolean;
}

export interface EmailComponent {
  id: string;
  type: 'header' | 'text' | 'image' | 'button' | 'divider' | 'footer' | 'social';
  content: string;
  styles: Record<string, string>;
  variables: string[]; // Array of variable names used in this component
  position: number;
}

export interface EmailTemplate {
  id: string;
  name: string;
  description?: string;
  subject: string;
  components: EmailComponent[];
  variables: EmailVariable[];
  html: string; // Final rendered HTML
  created_at: string;
  updated_at: string;
  is_default?: boolean;
}

export interface TemplatePreviewData {
  [key: string]: string; // Variable name -> value mapping
}

export interface EmailTemplateService {
  createTemplate(template: Omit<EmailTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<EmailTemplate>;
  updateTemplate(id: string, template: Partial<EmailTemplate>): Promise<EmailTemplate>;
  getTemplates(): Promise<EmailTemplate[]>;
  getTemplate(id: string): Promise<EmailTemplate>;
  deleteTemplate(id: string): Promise<void>;
  renderTemplate(templateId: string, variables: TemplatePreviewData): Promise<string>;
}
