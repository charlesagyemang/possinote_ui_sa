'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Trash2, 
  Variable,
  Hash,
  User,
  Mail,
  Building,
  Calendar
} from 'lucide-react';
import { EmailTemplate, TemplatePreviewData, EmailVariable } from '@/types/emailTemplates';
import { EmailTemplateService } from '@/lib/services/emailTemplates';

interface VariablePanelProps {
  template: EmailTemplate;
  variables: TemplatePreviewData;
  onVariablesChange: (variables: TemplatePreviewData) => void;
}

const predefinedVariables = [
  { name: 'name', description: 'Recipient name', icon: User },
  { name: 'email', description: 'Recipient email', icon: Mail },
  { name: 'company', description: 'Company name', icon: Building },
  { name: 'date', description: 'Current date', icon: Calendar },
  { name: 'id', description: 'Unique identifier', icon: Hash },
];

export function VariablePanel({ template, variables, onVariablesChange }: VariablePanelProps) {
  const [newVariableName, setNewVariableName] = useState('');
  const [newVariableValue, setNewVariableValue] = useState('');

  // Extract variables from template
  const templateVariables = EmailTemplateService.extractVariables(template);

  const addVariable = () => {
    if (newVariableName.trim() && newVariableValue.trim()) {
      onVariablesChange({
        ...variables,
        [newVariableName.trim()]: newVariableValue.trim()
      });
      setNewVariableName('');
      setNewVariableValue('');
    }
  };

  const removeVariable = (varName: string) => {
    const newVariables = { ...variables };
    delete newVariables[varName];
    onVariablesChange(newVariables);
  };

  const addPredefinedVariable = (varName: string) => {
    if (!(varName in variables)) {
      onVariablesChange({
        ...variables,
        [varName]: `Sample ${varName}`
      });
    }
  };

  const handleVariableChange = (varName: string, value: string) => {
    onVariablesChange({
      ...variables,
      [varName]: value
    });
  };

  return (
    <div className="space-y-4">
      {/* Template Variables */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center space-x-2">
            <Variable className="h-5 w-5 text-purple-400" />
            <span>Template Variables</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {templateVariables.length > 0 ? (
            <div className="space-y-3">
              {templateVariables.map((varName) => (
                <div key={varName} className="flex items-center space-x-2">
                  <Badge variant="outline" className="bg-purple-500/20 border-purple-500/30 text-purple-300">
                    {`{{${varName}}}`}
                  </Badge>
                  <Input
                    value={variables[varName] || ''}
                    onChange={(e) => handleVariableChange(varName, e.target.value)}
                    placeholder={`Value for ${varName}`}
                    className="bg-slate-700 border-slate-600 text-white text-sm flex-1"
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No variables found in template</p>
          )}
        </CardContent>
      </Card>

      {/* Predefined Variables */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white text-sm">Quick Add Variables</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {predefinedVariables.map((variable) => {
              const Icon = variable.icon;
              const isAdded = variable.name in variables;
              
              return (
                <Button
                  key={variable.name}
                  variant="outline"
                  size="sm"
                  onClick={() => addPredefinedVariable(variable.name)}
                  disabled={isAdded}
                  className={`justify-start h-auto p-2 text-xs ${
                    isAdded 
                      ? 'border-green-500/30 text-green-400 bg-green-500/10' 
                      : 'border-slate-600 text-gray-300 hover:bg-slate-700'
                  }`}
                >
                  <Icon className="h-3 w-3 mr-1" />
                  <div className="text-left">
                    <div className="font-medium">{variable.name}</div>
                    <div className="text-xs opacity-70">{variable.description}</div>
                  </div>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Add Custom Variable */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white text-sm">Add Custom Variable</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-gray-300 text-xs">Variable Name</Label>
            <Input
              value={newVariableName}
              onChange={(e) => setNewVariableName(e.target.value)}
              placeholder="variable_name"
              className="bg-slate-700 border-slate-600 text-white text-sm"
            />
          </div>
          <div>
            <Label className="text-gray-300 text-xs">Default Value</Label>
            <Input
              value={newVariableValue}
              onChange={(e) => setNewVariableValue(e.target.value)}
              placeholder="Default value"
              className="bg-slate-700 border-slate-600 text-white text-sm"
            />
          </div>
          <Button
            onClick={addVariable}
            disabled={!newVariableName.trim() || !newVariableValue.trim()}
            className="w-full bg-purple-600 hover:bg-purple-700 text-sm"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Variable
          </Button>
        </CardContent>
      </Card>

      {/* Current Variables */}
      {Object.keys(variables).length > 0 && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white text-sm">Current Variables</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(variables).map(([varName, value]) => (
                <div key={varName} className="flex items-center justify-between p-2 bg-slate-700/30 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="bg-blue-500/20 border-blue-500/30 text-blue-300 text-xs">
                      {varName}
                    </Badge>
                    <span className="text-gray-300 text-sm">{value}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeVariable(varName)}
                    className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
