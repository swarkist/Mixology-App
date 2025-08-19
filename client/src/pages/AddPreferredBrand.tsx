// @ts-nocheck
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Upload, X } from "lucide-react";
import { Link } from "wouter";
import { Navigation } from "@/components/Navigation";
import { apiRequest } from "@/lib/queryClient";
import { preferredBrandFormSchema, type PreferredBrandForm } from "@shared/schema";
import TopNavigation from "@/components/TopNavigation";
import noPhotoImage from "@assets/no-photo_1753579606993.png";
import { ReviewBanner } from "@/components/ReviewBanner";
import { useAuth } from "@/hooks/useAuth";

export default function AddPreferredBrand() {
  const [, setLocation] = useLocation();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isReviewer = user?.role === 'reviewer';

  const form = useForm<PreferredBrandForm>({
    resolver: zodResolver(preferredBrandFormSchema),
    defaultValues: {
      name: "",
      proof: undefined,
      imageUrl: "",
      inMyBar: false,
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: PreferredBrandForm) => 
      apiRequest("/api/preferred-brands", { method: "POST", body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/preferred-brands"] });
      setLocation("/preferred-brands");
    },
  });

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const { compressImage } = await import('@/lib/imageCompression');
        const compressedImage = await compressImage(file);
        setImagePreview(compressedImage);
        form.setValue("imageUrl", compressedImage);
      } catch (error) {
        console.error('Error compressing image:', error);
        // Fallback to original image if compression fails
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          setImagePreview(result);
          form.setValue("imageUrl", result);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    form.setValue("imageUrl", "");
  };

  const onSubmit = async (data: PreferredBrandForm) => {
    try {
      await createMutation.mutateAsync(data);
    } catch (error) {
      console.error("Error creating preferred brand:", error);
    }
  };

  return (
    <div className="min-h-screen bg-[#161611] text-white pb-20 md:pb-0">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#161611]/90 backdrop-blur-sm border-b border-[#2a2920]">
        <div className="flex items-center justify-between px-4 md:px-40 py-4 max-w-4xl mx-auto">
          <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
            <Link href="/preferred-brands">
              <Button variant="ghost" size="sm" className="text-white hover:bg-[#2a2920] h-10 px-3">
                <ArrowLeft className="w-4 h-4 mr-1 md:mr-2" />
                <span className="hidden sm:inline">Back</span>
              </Button>
            </Link>
            <h1 className="text-lg md:text-xl font-bold [font-family:'Plus_Jakarta_Sans',Helvetica] truncate">
              Add Preferred Brand
            </h1>
          </div>
          <Button 
            form="brand-form"
            type="submit"
            className="bg-[#f2c40c] hover:bg-[#e0b40a] text-[#161611] h-10 px-4 text-sm md:text-base flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={createMutation.isPending || isReviewer}
          >
            {createMutation.isPending ? (
              <span className="hidden sm:inline">Saving...</span>
            ) : (
              <>
                <span className="hidden sm:inline">Save Brand</span>
                <span className="sm:hidden">Save</span>
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-40 py-4 space-y-6">
        <ReviewBanner />
        <Card className="bg-[#2a2920] border-[#4a4735]">
          <CardHeader>
            <CardTitle className="text-white [font-family:'Plus_Jakarta_Sans',Helvetica]">
              Brand Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form id="brand-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Brand Name */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Brand Name *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., Grey Goose, Jack Daniel's, Cointreau"
                          className="bg-[#26261c] border-[#544f3a] text-white placeholder:text-[#bab59b] focus-visible:ring-[#f2c40c] focus-visible:border-[#f2c40c]"
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
                      <FormLabel className="text-white">Proof</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="80"
                          step="1"
                          className="bg-[#26261c] border-[#544f3a] text-white placeholder:text-[#bab59b] focus-visible:ring-[#f2c40c] focus-visible:border-[#f2c40c]"
                          {...field}
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Image Upload */}
        <Card className="bg-[#2a2920] border-[#4a4735]">
          <CardHeader>
            <CardTitle className="text-white [font-family:'Plus_Jakarta_Sans',Helvetica]">
              Brand Image
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="mt-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="bg-[#383529] border-[#f2c40c] text-[#f2c40c] hover:bg-[#f2c40c] hover:text-[#161611] font-medium"
                    onClick={() => document.getElementById('image-upload')?.click()}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Choose Image
                  </Button>
                </div>
              </div>
              <div className="relative">
                <img
                  src={imagePreview || noPhotoImage}
                  alt={imagePreview ? "Brand preview" : "No photo placeholder"}
                  className="w-24 h-24 object-cover rounded-lg"
                />
                {imagePreview && (
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                    onClick={removeImage}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <Navigation />
    </div>
  );
};