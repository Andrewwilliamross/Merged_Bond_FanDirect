
import { useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import SubscriptionTierForm from "@/components/subscription/SubscriptionTierForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { useState } from "react";

interface SubscriptionTier {
  id: string;
  name: string;
  price: number;
  description: string | null;
}

const SubscriptionSettings = () => {
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: tiers, refetch } = useQuery({
    queryKey: ['subscription-tiers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_tiers')
        .select('*')
        .order('price');
      
      if (error) throw error;
      return data as SubscriptionTier[];
    },
  });

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('subscription_tiers')
      .delete()
      .eq('id', id);
    
    if (error) {
      toast.error('Failed to delete tier');
      return;
    }
    
    toast.success('Tier deleted successfully');
    refetch();
  };

  const handleEdit = (tier: SubscriptionTier) => {
    setSelectedTier(tier);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setSelectedTier(null);
    setIsDialogOpen(false);
  };

  const handleSuccess = () => {
    refetch();
    handleCloseDialog();
  };

  return (
    <DashboardLayout title="Subscription Settings">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Subscription Tiers</h2>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2" />
            Add Tier
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tiers?.map((tier) => (
              <TableRow key={tier.id}>
                <TableCell>{tier.name}</TableCell>
                <TableCell>${tier.price}</TableCell>
                <TableCell>{tier.description}</TableCell>
                <TableCell className="space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(tier)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(tier.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selectedTier ? 'Edit Tier' : 'Create New Tier'}
              </DialogTitle>
            </DialogHeader>
            <SubscriptionTierForm
              tier={selectedTier}
              onSuccess={handleSuccess}
            />
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default SubscriptionSettings;
