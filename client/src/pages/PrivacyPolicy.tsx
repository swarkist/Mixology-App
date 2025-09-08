import React, { useEffect } from "react";
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

            <p className="text-neutral-300 mt-3">
              <strong>This is a hobby, non-commercial website for personal use.</strong>
            </p>
          </CardHeader>

          <CardContent className="prose prose-invert max-w-none">
            <div className="text-neutral-300 space-y-6 leading-relaxed">
              <p className="text-lg">
                At Miximixology, your privacy matters. We keep things simple: we only collect the minimum information needed to run the site, and we do not sell or trade your data.
              </p>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">1. Information We Collect</h2>
                <p className="mb-3">When you use Miximixology, we may collect:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong>Account Information:</strong> Your email, password (stored securely in hashed form), and role (basic, reviewer, admin).
                  </li>
                  <li>
                    <strong>Preferences:</strong> Items saved in “My Bar” and “Preferred Brands.”
                  </li>
                  <li>
                    <strong>Usage Data:</strong> Basic logs needed to keep the site working reliably (e.g., error logs, security checks).
                  </li>
                </ul>
                <p className="mt-3">
                  We do not collect sensitive personal information beyond what is needed to provide the service.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">2. How We Use Your Information</h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>To create and manage your account.</li>
                  <li>To power features like My Bar and Preferred Brands.</li>
                  <li>To maintain security and prevent abuse.</li>
                  <li>To contact you for account-related issues (e.g., password resets).</li>
                </ul>
                <p className="mt-3">We do not sell, rent, or trade your information.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">3. Cookies & Local Storage</h2>
                <p>
                  We use only essential cookies and/or local storage to keep you signed in and keep the site functioning (for example, session management). We do not use advertising or third-party tracking cookies.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">4. Third-Party Services</h2>
                <p className="mb-3">Miximixology relies on third-party providers to operate:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong>Firebase (Firestore database)</strong> for storing recipes, ingredients, and account data.
                  </li>
                  <li>
                    <strong>Replit hosting</strong> to serve the site and backend.
                  </li>
                  <li>
                    <strong>SMTP email service (Zoho Mail)</strong> to send password reset emails.
                  </li>
                  <li>
                    <strong>OpenRouter AI integrations</strong> for recipe imports and chatbot functionality.
                  </li>
                </ul>
                <p className="mt-3">
                  Your data may pass through or be stored by these providers as part of normal operation. Their own terms and privacy policies also apply.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">5. Data Security</h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>All passwords are hashed and never stored in plain text.</li>
                  <li>Role-based access control limits access to your data.</li>
                  <li>User data isolation is enforced to prevent cross-account access.</li>
                  <li>Automated tests help verify security and reliability.</li>
                </ul>
                <p className="mt-3">
                  No system is 100% secure, and we cannot guarantee absolute protection.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">6. Data Retention & Deletion</h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Your data remains in Miximixology until you delete your account.</li>
                  <li>A self-delete feature is being added. Until then, you can request deletion by contacting us.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">7. Children’s Privacy</h2>
                <p>Miximixology is intended for hobby use by adults. We do not knowingly collect personal information from children under 13.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">8. Changes to This Policy</h2>
                <p>
                  We may update this Privacy Policy occasionally. Updates will be posted here, and continued use of the site means you accept the updated policy.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">9. Contact</h2>
                <p>
                  For questions or data requests, contact us at:
                  <br />
                  Email: noreply@miximixology.com
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
