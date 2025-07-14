'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface ProfileFormData {
  display_name: string;
  phone_number?: string;
  address?: string;
}

interface EditProfileFormProps {
  initialData: {
    display_name: string;
    phone_number?: string;
    address?: string;
  };
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function EditProfileForm({
  initialData,
  onSuccess,
  onCancel,
}: EditProfileFormProps) {
  const [formData, setFormData] = useState<ProfileFormData>({
  display_name: initialData.display_name,  
  phone_number: initialData.phone_number,
  address: initialData.address,
});
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.patch('api/me', formData);
      
      toast({
        title: 'Success',
        description: 'Profile updated successfully',
      });

      onSuccess?.();
      router.refresh();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to update profile',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="display_name">Name</Label>
        <Input
          id="name"
          value={formData.display_name}
          onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone_number">Phone Number</Label>
        <Input
          id="phone_number"
          type="tel"
          value={formData.phone_number || ''}
          onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
          placeholder="Optional"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Input
          id="address"
          value={formData.address || ''}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          placeholder="Optional"
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}