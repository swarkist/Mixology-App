import React, { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import TopNavigation from "@/components/TopNavigation";

export const TermsPage = (): JSX.Element => {
  useEffect(() => {
    document.title = "Terms of Use — Miximixology";
  }, []);

  return (
    <div className="min-h-screen bg-[#161611]">
      <TopNavigation />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-white">
              Miximixology Terms of Use
            </CardTitle>
            <p className="text-neutral-400 mt-2">
              Effective Date: [Insert Date]
            </p>
          </CardHeader>
          <CardContent className="prose prose-invert max-w-none">
            <div className="text-neutral-300 space-y-6 leading-relaxed">
              <p className="text-lg">
                Welcome to Miximixology! By using our site and registering an account, you agree to these Terms of Use.
              </p>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">1. Acceptance of Terms</h2>
                <p>
                  By creating an account or using Miximixology, you agree to follow these Terms. If you do not agree, please do not use the site. This service is intended for hobby and personal use.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">2. Accounts</h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>You must provide accurate information when registering.</li>
                  <li>You are responsible for keeping your password secure.</li>
                  <li>You are responsible for all activity under your account.</li>
                  <li>You may request account deletion at any time (once available, a delete option will also be provided in your profile).</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">3. User Roles & Access</h2>
                <p className="mb-3">Miximixology includes role-based access:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Basic Users:</strong> Can use features like "My Bar" and "Preferred Brands."</li>
                  <li><strong>Reviewers:</strong> May suggest or edit cocktail/ingredient information.</li>
                  <li><strong>Admins:</strong> Manage content and users.</li>
                </ul>
                <p className="mt-3">
                  You agree not to misuse or attempt to bypass these access controls.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">4. Acceptable Use</h2>
                <p className="mb-3">You agree not to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Use the site in any unlawful or harmful way.</li>
                  <li>Attempt to break into or disrupt our systems.</li>
                  <li>Scrape, copy, or redistribute site content without permission.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">5. Content Ownership</h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Site Content</strong> (cocktails, ingredients, recipes): Created and maintained by Miximixology admins.</li>
                  <li><strong>Your Account Data</strong> (My Bar, Preferred Brands, preferences): Belongs to you and is only used to provide the service.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">6. Privacy</h2>
                <p>
                  We do not sell or share your data. Your information is only used to provide the service. Data may be processed by third-party providers such as Firebase, Replit hosting, AI integrations, and email services. See our Privacy Policy for details.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">7. Third-Party Services</h2>
                <p>
                  Miximixology relies on third-party services for hosting, database, and AI features. While we choose providers carefully, we cannot control or guarantee their performance or security. Use of our site also means agreeing to those providers' terms.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">8. Termination</h2>
                <p>
                  We may suspend or deactivate accounts that violate these Terms. You may delete your account at any time (once the feature is live, or by request to the admin).
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">9. Disclaimer & Liability</h2>
                <p className="mb-3">
                  Miximixology is provided "as is," for hobby use. We are not responsible for:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Errors in recipes or AI outputs.</li>
                  <li>Harm from consuming cocktails (e.g., allergies, alcohol effects).</li>
                  <li>Outages or issues caused by third-party providers.</li>
                </ul>
              </section>
              {/* This is a comment inside a JSX element
              <section>
                <h2 className="text-xl font-semibold text-white mb-3">10. Governing Law</h2>
                <p>
                  These Terms are governed by the laws of [Insert State/Country].
                </p>
              </section>
              */}
              <section>
                <h2 className="text-xl font-semibold text-white mb-3">10. Contact</h2>
                <p>
                  Questions? Contact noreply@miximixology.com.
                </p>
              </section>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default TermsPage;