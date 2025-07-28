import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Upload, X, Trash2 } from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { preferredBrandFormSchema, type PreferredBrandForm } from "@shared/schema";
import TopNavigation from "@/components/TopNavigation";

export default function EditPreferredBrand() {
  const [, params] = useRoute("/edit-preferred-brand/:id");
  const [, setLocation] = useLocation();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const queryClient = useQueryClient();
  
  const brandId = parseInt(params?.id || "0");

  const { data: brandDetails, isLoading } = useQuery({
    queryKey: ["/api/preferred-brands", brandId],
    queryFn: () => apiRequest(`/api/preferred-brands/${brandId}`),
    enabled: !!brandId,
  });

  const form = useForm<PreferredBrandForm>({
    resolver: zodResolver(preferredBrandFormSchema),
    defaultValues: {
      name: "",
      proof: undefined,
      imageUrl: "",
      inMyBar: false,
    },
  });

  // Update form when data loads
  useEffect(() => {
    if (brandDetails?.brand) {
      const brand = brandDetails.brand;
      form.reset({
        name: brand.name,
        proof: brand.proof || undefined,
        imageUrl: brand.imageUrl || "",
        inMyBar: brand.inMyBar,
      });
      setImagePreview(brand.imageUrl || null);
    }
  }, [brandDetails, form]);

  const updateMutation = useMutation({
    mutationFn: (data: PreferredBrandForm) => 
      apiRequest(`/api/preferred-brands/${brandId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/preferred-brands"] });
      setLocation("/preferred-brands");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => 
      apiRequest(`/api/preferred-brands/${brandId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/preferred-brands"] });
      setLocation("/preferred-brands");
    },
  });

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setImagePreview(result);
        form.setValue("imageUrl", result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    form.setValue("imageUrl", "");
  };

  const onSubmit = async (data: PreferredBrandForm) => {
    try {
      await updateMutation.mutateAsync(data);
    } catch (error) {
      console.error("Error updating preferred brand:", error);
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this preferred brand? This action cannot be undone.")) {
      try {
        await deleteMutation.mutateAsync();
      } catch (error) {
        console.error("Error deleting preferred brand:", error);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <TopNavigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading preferred brand...</div>
        </div>
      </div>
    );
  }

  if (!brandDetails) {
    return (
      <div className="min-h-screen bg-background">
        <TopNavigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Preferred brand not found.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <TopNavigation />
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/preferred-brands">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-foreground">
              Edit Preferred Brand
            </h1>
            <p className="text-muted-foreground">
              Update {brandDetails.brand.name}
            </p>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Brand Details</CardTitle>
            <CardDescription>
              Update the details for your preferred brand
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Brand Name */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Brand Name *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., Grey Goose, Jack Daniel's, Cointreau"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Proof */}
                <FormField
                  control={form.control}
                  name="proof"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Proof</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="80"
                          step="1"
                          {...field}
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Image Upload */}
                <div className="space-y-4">
                  <FormLabel>Brand Image</FormLabel>
                  {!imagePreview ? (
                    <div className="border-2 border-dashed border-muted-foreground rounded-lg p-8 text-center">
                      <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground mb-4">
                        Drag and drop an image, or click to browse
                      </p>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="image-upload"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById("image-upload")?.click()}
                      >
                        Choose Image
                      </Button>
                    </div>
                  ) : (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full max-w-sm mx-auto rounded-lg shadow-lg"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={removeImage}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-4 pt-4">
                  <Link href="/preferred-brands" className="flex-1">
                    <Button type="button" variant="outline" className="w-full">
                      Cancel
                    </Button>
                  </Link>
                  <Button 
                    type="submit" 
                    className="flex-1"
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}