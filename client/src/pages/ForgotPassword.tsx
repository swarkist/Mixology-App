import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, Mail, ArrowLeft, CheckCircle } from "lucide-react";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address")
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: ""
    }
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: async (data: ForgotPasswordFormData) => {
      setIsLoading(true);
      return apiRequest('/api/auth/forgot', {
        method: 'POST',
        body: data
      });
    },
    onSuccess: (response) => {
      setIsLoading(false);
      if (response.success) {
        setIsSuccess(true);
        toast({
          title: "Reset link sent",
          description: "Please check your email for password reset instructions."
        });
      } else {
        toast({
          title: "Request failed",
          description: response.message || "Unable to process password reset request",
          variant: "destructive"
        });
      }
    },
    onError: (error: any) => {
      setIsLoading(false);
      toast({
        title: "Request error",
        description: error.message || "An error occurred during password reset request",
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: ForgotPasswordFormData) => {
    forgotPasswordMutation.mutate(data);
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black p-4">
        <Card className="w-full max-w-md bg-neutral-900 border-neutral-800">
          <CardContent className="pt-8">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Check Your Email</h2>
              <p className="text-neutral-400 mb-6">
                We've sent password reset instructions to your email address. Please check your inbox and follow the link to reset your password.
              </p>
              <Link href="/login">
                <Button variant="outline" className="border-neutral-700 text-white">
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <Card className="w-full max-w-md bg-neutral-900 border-neutral-800">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-yellow-600 rounded-lg flex items-center justify-center mb-4">
            <Mail className="w-6 h-6 text-black" />
          </div>
          <CardTitle className="text-2xl font-bold text-white">Reset Password</CardTitle>
          <p className="text-neutral-400">Enter your email to receive reset instructions</p>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Email</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="Enter your email"
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
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending Reset Link...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Send Reset Link
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