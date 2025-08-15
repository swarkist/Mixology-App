import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, Lock, ArrowLeft, CheckCircle, AlertTriangle } from "lucide-react";

const resetPasswordSchema = z.object({
  new_password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain at least one lowercase letter, one uppercase letter, and one number"),
  confirm_password: z.string()
}).refine((data) => data.new_password === data.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"]
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export default function ResetPassword() {
  const { toast } = useToast();
  const [location] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      new_password: "",
      confirm_password: ""
    }
  });

  // Extract token from URL parameters on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const resetToken = urlParams.get('token');
    
    if (!resetToken) {
      setTokenError("Invalid or missing reset token. Please request a new password reset.");
    } else {
      setToken(resetToken);
    }
  }, [location]);

  const resetPasswordMutation = useMutation({
    mutationFn: async (data: ResetPasswordFormData) => {
      if (!token) {
        throw new Error("No reset token available");
      }
      setIsLoading(true);
      return apiRequest('/api/auth/reset', {
        method: 'POST',
        body: {
          token,
          new_password: data.new_password
        }
      });
    },
    onSuccess: (response) => {
      setIsLoading(false);
      if (response.success) {
        setIsSuccess(true);
        toast({
          title: "Password reset successful",
          description: "Your password has been updated. You are now logged in."
        });
      } else {
        toast({
          title: "Reset failed",
          description: response.message || "Unable to reset password. The link may be expired or invalid.",
          variant: "destructive"
        });
      }
    },
    onError: (error: any) => {
      setIsLoading(false);
      toast({
        title: "Reset error",
        description: error.message || "An error occurred while resetting your password",
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: ResetPasswordFormData) => {
    resetPasswordMutation.mutate(data);
  };

  // Show token error state
  if (tokenError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black p-4">
        <Card className="w-full max-w-md bg-neutral-900 border-neutral-800">
          <CardContent className="pt-8">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Invalid Reset Link</h2>
              <p className="text-neutral-400 mb-6">
                {tokenError}
              </p>
              <Link href="/forgot-password">
                <Button className="w-full bg-yellow-600 hover:bg-yellow-700 text-black">
                  Request New Reset Link
                </Button>
              </Link>
              <div className="mt-4">
                <Link href="/login">
                  <Button variant="link" className="text-neutral-400 hover:text-white p-0">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Login
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show success state
  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black p-4">
        <Card className="w-full max-w-md bg-neutral-900 border-neutral-800">
          <CardContent className="pt-8">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Password Reset Complete</h2>
              <p className="text-neutral-400 mb-6">
                Your password has been successfully updated and you are now logged in.
              </p>
              <Link href="/">
                <Button className="w-full bg-yellow-600 hover:bg-yellow-700 text-black">
                  Continue to App
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <Card className="w-full max-w-md bg-neutral-900 border-neutral-800">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-yellow-600 rounded-lg flex items-center justify-center mb-4">
            <Lock className="w-6 h-6 text-black" />
          </div>
          <CardTitle className="text-2xl font-bold text-white">Set New Password</CardTitle>
          <p className="text-neutral-400">Choose a strong password for your account</p>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="new_password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">New Password</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        placeholder="Enter new password"
                        className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500"
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirm_password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Confirm Password</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        placeholder="Confirm new password"
                        className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500"
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full bg-yellow-600 hover:bg-yellow-700 text-black"
                disabled={isLoading || !token}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating Password...
                  </>
                ) : (
                  <>
                    <Lock className="mr-2 h-4 w-4" />
                    Update Password
                  </>
                )}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center">
            <Link href="/login">
              <Button variant="link" className="text-neutral-400 hover:text-white p-0">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Login
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}