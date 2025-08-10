'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';

export function ExampleTemplate() {
  const [copied, setCopied] = useState(false);

  const exampleHTML = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
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
</div>`;

  const exampleSubject = "Welcome {{name}} to {{company}}!";

  const copyExample = async () => {
    try {
      await navigator.clipboard.writeText(exampleHTML);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy example:', error);
    }
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center justify-between">
          <span>Example Template</span>
          <Button
            variant="outline"
            size="sm"
            onClick={copyExample}
            className="border-slate-600 text-gray-300 hover:bg-slate-700"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h4 className="text-white font-medium mb-2">Subject:</h4>
            <p className="text-gray-300 font-mono text-sm">{exampleSubject}</p>
          </div>
          
          <div>
            <h4 className="text-white font-medium mb-2">Variables Used:</h4>
            <div className="flex flex-wrap gap-2">
              {['name', 'company', 'email', 'login_url', 'support_email'].map((varName) => (
                <Badge key={varName} variant="outline" className="bg-purple-500/20 border-purple-500/30 text-purple-300">
                  {`{{${varName}}}`}
                </Badge>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="text-white font-medium mb-2">HTML Preview:</h4>
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div 
                className="p-6"
                dangerouslySetInnerHTML={{ __html: exampleHTML.replace(/\{\{(\w+)\}\}/g, 'Sample $1') }}
              />
            </div>
          </div>
          
          <div className="bg-slate-900 rounded-lg p-4 border border-slate-600">
            <p className="text-sm text-gray-400 mb-2">How to use:</p>
            <ol className="text-sm text-gray-300 space-y-1 list-decimal list-inside">
              <li>Copy the example HTML above</li>
              <li>Paste it into the HTML editor</li>
              <li>Set the subject line with variables</li>
              <li>Add your variables in the right panel</li>
              <li>Preview and save your template</li>
            </ol>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
