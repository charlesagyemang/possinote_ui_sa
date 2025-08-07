'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertCircle, X, CheckCircle, Info } from 'lucide-react';

// Validation schema based on the image requirements
const senderNameSchema = z.object({
  name: z.string()
    .min(1, 'Sender name is required')
    .max(14, 'Maximum 14 characters allowed')
    .regex(/^[a-zA-Z0-9_]+$/, 'Only alphanumeric characters and underscores are allowed')
    .refine((val) => {
      // Check if it's a mobile number (must be international format without +)
      if (/^\d+$/.test(val)) {
        return val.length <= 14 && val.length >= 10;
      }
      // Check if it's a word (max 11 characters)
      return val.length <= 11;
    }, 'Invalid format: Mobile numbers must be 10-14 digits, words must be 1-11 characters'),
  description: z.string()
    .min(1, 'Description is required')
    .max(500, 'Description too long (max 500 characters)'),
});

type SenderNameFormData = z.infer<typeof senderNameSchema>;

interface SenderNamesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: SenderNameFormData) => Promise<void>;
  isLoading?: boolean;
}

export default function SenderNamesModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  isLoading = false 
}: SenderNamesModalProps) {
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const form = useForm<SenderNameFormData>({
    resolver: zodResolver(senderNameSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  const handleSubmit = async (data: SenderNameFormData) => {
    setValidationErrors([]);
    
    // Additional validation checks
    const errors: string[] = [];
    
    // Check for brand/company name violations
    const brandNames = ['vodafone', 'mtn', 'airteltigo', 'glo', 'coca', 'pepsi', 'apple', 'samsung', 'nike', 'adidas'];
    const inputName = data.name.toLowerCase();
    
    if (brandNames.some(brand => inputName.includes(brand))) {
      errors.push('Do not use names of brands or companies you do not own or have legitimate connections with.');
    }
    
    // Check if it's a mobile number format
    if (/^\d+$/.test(data.name)) {
      if (!data.name.startsWith('233')) {
        errors.push('Mobile number sender names must be in international format (e.g., 233244111222)');
      }
    }
    
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }
    
    await onSubmit(data);
  };

  const resetForm = () => {
    form.reset();
    setValidationErrors([]);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-3xl max-w-4xl">
        <DialogHeader className="relative">
          <DialogTitle className="text-white text-2xl flex items-center space-x-3">
            <div className="p-2 bg-blue-500/20 rounded-xl">
              <CheckCircle className="h-6 w-6 text-blue-400" />
            </div>
            <span>Add Sender Name</span>
          </DialogTitle>
          <Button
            onClick={handleClose}
            variant="ghost"
            size="sm"
            className="absolute top-0 right-0 text-gray-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </Button>
        </DialogHeader>

        <div className="space-y-8 p-6">
          {/* Rules and Guidelines */}
          <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-2xl p-6">
            <h3 className="text-white text-lg font-semibold mb-4 flex items-center space-x-2">
              <Info className="h-5 w-5 text-blue-400" />
              <span>Please Note:</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <span className="text-blue-400 font-semibold flex-shrink-0">1.</span>
                  <p>Sender Name is subject to approval from Mobile Network Operators.</p>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-blue-400 font-semibold flex-shrink-0">2.</span>
                  <p>Maximum of 11 alpha numeric characters or 14 numbers.</p>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-blue-400 font-semibold flex-shrink-0">3.</span>
                  <p>Sender name can be a word or a Mobile number.</p>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-blue-400 font-semibold flex-shrink-0">4.</span>
                  <p>Sender address can also contain underscores (_).</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <span className="text-blue-400 font-semibold flex-shrink-0">5.</span>
                  <p>Mobile number sender names must be entered in international formats, example: 233244111222.</p>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-red-400 font-bold flex-shrink-0">6.</span>
                  <p className="font-bold text-red-400">Description is required.</p>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-red-400 font-bold flex-shrink-0">7.</span>
                  <p className="font-bold text-red-400">
                    Do not use names of Brand or Companies you do not own or have any legitimate connections with. 
                    This is considered as spam and is a crime punishable by the laws of Ghana.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="name" className="text-gray-300 font-medium">Name</Label>
                <Input
                  {...form.register('name')}
                  placeholder="How do you want to call your sender name"
                  className="bg-black/30 border-white/20 text-white placeholder-gray-400 rounded-xl h-12 focus:border-blue-500 focus:ring-blue-500/20"
                />
                {form.formState.errors.name && (
                  <p className="text-red-400 text-sm flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4" />
                    <span>{form.formState.errors.name.message}</span>
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <Label htmlFor="description" className="text-gray-300 font-medium">Description</Label>
                <Textarea
                  {...form.register('description')}
                  placeholder="How do you describe the sendername provided"
                  className="bg-black/30 border-white/20 text-white placeholder-gray-400 rounded-xl focus:border-blue-500 focus:ring-blue-500/20"
                  rows={4}
                />
                {form.formState.errors.description && (
                  <p className="text-red-400 text-sm flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4" />
                    <span>{form.formState.errors.description.message}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Validation Errors */}
            {validationErrors.length > 0 && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-red-400 mt-0.5" />
                  <div className="space-y-2">
                    {validationErrors.map((error, index) => (
                      <p key={index} className="text-red-400 text-sm">{error}</p>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl h-12 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Adding Sender Name...</span>
                </div>
              ) : (
                <span>Add Sender Name</span>
              )}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
} 