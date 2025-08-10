'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmailTemplateService } from '@/lib/services/emailTemplates';
import { EmailTemplate } from '@/types/emailTemplates';

export function IntegrationTest() {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<string[]>([]);

  const addResult = (message: string) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testCreateTemplate = async () => {
    setIsLoading(true);
    try {
      const template = await EmailTemplateService.createTemplate({
        name: 'Test Template',
        description: 'Test template for integration testing',
        subject: 'Hello {{name}} from {{company}}!',
        components: [
          {
            id: 'comp_1',
            type: 'header',
            content: '<h1>Welcome {{name}}!</h1>',
            styles: {
              'text-align': 'center',
              'color': '#ffffff',
              'font-size': '24px',
              'margin': '20px 0'
            },
            variables: ['name'],
            position: 0
          },
          {
            id: 'comp_2',
            type: 'text',
            content: '<p>We\'re excited to have you at {{company}}.</p>',
            styles: {
              'color': '#333333',
              'font-size': '16px',
              'line-height': '1.6'
            },
            variables: ['company'],
            position: 1
          }
        ],
        variables: [
          {
            id: 'var_1',
            name: 'name',
            description: 'Recipient name',
            defaultValue: 'John Doe',
            required: true
          },
          {
            id: 'var_2',
            name: 'company',
            description: 'Company name',
            defaultValue: 'Our Company',
            required: true
          }
        ],
        html: '<div style="text-align: center; color: #ffffff; font-size: 24px; margin: 20px 0"><h1>Welcome {{name}}!</h1></div><div style="color: #333333; font-size: 16px; line-height: 1.6"><p>We\'re excited to have you at {{company}}.</p></div>'
      });

      addResult(`✅ Template created: ${template.name} (ID: ${template.id})`);
      return template;
    } catch (error) {
      addResult(`❌ Failed to create template: ${error}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const testGetTemplates = async () => {
    setIsLoading(true);
    try {
      const templates = await EmailTemplateService.getTemplates();
      addResult(`✅ Retrieved ${templates.length} templates`);
      return templates;
    } catch (error) {
      addResult(`❌ Failed to get templates: ${error}`);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const testRenderTemplate = async (templateId: string) => {
    setIsLoading(true);
    try {
      const rendered = await EmailTemplateService.renderTemplate(templateId, {
        name: 'John Doe',
        company: 'Acme Corp'
      });
      addResult(`✅ Template rendered successfully`);
      addResult(`   Subject: ${rendered.subject}`);
      addResult(`   HTML length: ${rendered.html.length} characters`);
      return rendered;
    } catch (error) {
      addResult(`❌ Failed to render template: ${error}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const testUpdateTemplate = async (templateId: string) => {
    setIsLoading(true);
    try {
      const updated = await EmailTemplateService.updateTemplate(templateId, {
        name: 'Updated Test Template',
        description: 'Updated description'
      });
      addResult(`✅ Template updated: ${updated.name}`);
      return updated;
    } catch (error) {
      addResult(`❌ Failed to update template: ${error}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const testDeleteTemplate = async (templateId: string) => {
    setIsLoading(true);
    try {
      await EmailTemplateService.deleteTemplate(templateId);
      addResult(`✅ Template deleted successfully`);
    } catch (error) {
      addResult(`❌ Failed to delete template: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const runFullTest = async () => {
    setResults([]);
    addResult('🚀 Starting integration test...');

    // Test 1: Create template
    const template = await testCreateTemplate();
    if (!template) return;

    // Test 2: Get templates
    const templates = await testGetTemplates();
    if (templates.length === 0) return;

    // Test 3: Render template
    await testRenderTemplate(template.id);

    // Test 4: Update template
    await testUpdateTemplate(template.id);

    // Test 5: Delete template
    await testDeleteTemplate(template.id);

    addResult('🎉 Integration test completed!');
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white">API Integration Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={runFullTest}
          disabled={isLoading}
          className="w-full bg-purple-600 hover:bg-purple-700"
        >
          {isLoading ? 'Running Tests...' : 'Run Full Integration Test'}
        </Button>

        {results.length > 0 && (
          <div className="bg-slate-900 rounded-lg p-4 max-h-64 overflow-y-auto">
            <h4 className="text-white font-medium mb-2">Test Results:</h4>
            <div className="space-y-1">
              {results.map((result, index) => (
                <div key={index} className="text-sm font-mono">
                  <span className="text-gray-400">{result}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
