import React, { useEffect } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import TopNavigation from "@/components/TopNavigation";

export const PrivacyPolicy = (): JSX.Element => {
  useEffect(() => {
    document.title = "Privacy Policy — Miximixology";
  }, []);

  return (
    <div className="min-h-screen bg-[#161611]">
      <TopNavigation />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-white">
              Miximixology Privacy Policy
            </CardTitle>
            <p className="text-neutral-400 mt-2">
              Effective Date: [Insert Date]
            </p>
          </CardHeader>
          <CardContent className="prose prose-invert max-w-none">
            <div className="text-neutral-300 space-y-6 leading-relaxed">
              <p className="text-lg">
                At Miximixology, your privacy matters. This is a hobby site built for cocktail enthusiasts, and we keep things simple.
              </p>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">1. Information We Collect</h2>
                <p className="mb-3">When you use Miximixology, we may collect:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Account Information:</strong> Your email, password (stored securely in hashed form), and role (basic, reviewer, admin).</li>
                  <li><strong>Preferences:</strong> Items saved in "My Bar" and "Preferred Brands."</li>
                  <li><strong>Usage Data:</strong> Basic logs to ensure the site works properly (e.g., error logs, security checks).</li>
                </ul>
                <p className="mt-3">
                  We do not collect sensitive personal information beyond what is needed to provide the service.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">2. How We Use Your Information</h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>To create and manage your account.</li>
                  <li>To power site features like My Bar, Preferred Brands, and saved cocktail filters.</li>
                  <li>To keep the site secure and prevent abuse.</li>
                  <li>To contact you about account-related issues (e.g., password resets).</li>
                </ul>
                <p className="mt-3">
                  We do not sell, rent, or trade your information.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">3. Third-Party Services</h2>
                <p className="mb-3">Miximixology relies on third-party providers to operate:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Firebase (Firestore database)</strong> for storing recipes, ingredients, and account data.</li>
                  <li><strong>Replit hosting</strong> to serve the site and backend.</li>
                  <li><strong>SMTP email service (Zoho Mail)</strong> to send password reset emails.</li>
                  <li><strong>OpenRouter AI integrations</strong> for recipe imports and chatbot functionality.</li>
                </ul>
                <p className="mt-3">
                  Your data may pass through or be stored by these providers as part of normal operation. Their own terms and privacy policies also apply.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">4. Data Security</h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>All passwords are hashed and never stored in plain text.</li>
                  <li>Role-based access control ensures only you can access your data.</li>
                  <li>User data isolation fixes have been implemented to prevent cross-account access.</li>
                  <li>Automated regression and security tests verify protections.</li>
                </ul>
                <p className="mt-3">
                  Still, no system is 100% secure, and we cannot guarantee absolute protection.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">5. Data Retention & Deletion</h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Your data remains in Miximixology until you delete your account.</li>
                  <li>A self-delete feature is being added. Until then, you can request deletion by contacting us.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">6. Children's Privacy</h2>
                <p>
                  Miximixology is intended for hobby use by adults. We do not knowingly collect personal information from children under 13.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">7. Changes to This Policy</h2>
                <p>
                  We may update this Privacy Policy occasionally. Updates will be posted here, and continued use of the site means you accept the updated policy.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">8. Contact</h2>
                <p>
                  For questions or data requests, contact us at:<br />
                  Email: support@miximixology.com
                </p>
              </section>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default PrivacyPolicy;