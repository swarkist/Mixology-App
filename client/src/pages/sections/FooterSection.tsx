import React from "react";
import { Link } from "wouter";
import { Separator } from "@/components/ui/separator";

export const FooterSection = (): JSX.Element => {
  // Footer navigation links data
  const footerLinks = [
    { title: "About", href: "#" },
    { title: "Contact", href: "#" },
    { title: "Privacy Policy", href: "#" },
    { title: "Terms of Service", href: "#" },
  ];

  // Social media icons data
  const socialIcons = [
    { icon: "twitter", ariaLabel: "Twitter" },
    { icon: "instagram", ariaLabel: "Instagram" },
    { icon: "facebook", ariaLabel: "Facebook" },
  ];

  return (
    <footer className="flex justify-center w-full bg-[#161611]">
      <div className="flex flex-col max-w-[960px] w-full">
        <div className="flex flex-col gap-6 px-5 py-10 w-full">
          {/* Navigation Links */}
          <nav className="flex flex-wrap items-center justify-between gap-[24px_24px] w-full">
            {footerLinks.map((link, index) => (
              <div key={index} className="flex flex-col w-40 items-center">
                <Link href={link.href}>
                  <span className="font-normal text-[#bab59b] text-base text-center leading-6 w-full [font-family:'Plus_Jakarta_Sans',Helvetica] tracking-[0] hover:text-white transition-colors cursor-pointer">
                    {link.title}
                  </span>
                </Link>
              </div>
            ))}
          </nav>

          {/* Social Media Icons */}
          <div className="flex justify-center gap-4">
            {socialIcons.map((social, index) => (
              <a
                key={index}
                href="#"
                aria-label={social.ariaLabel}
                className="text-[#bab59b] hover:text-white transition-colors"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {social.icon === "twitter" && (
                    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
                  )}
                  {social.icon === "instagram" && (
                    <>
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                    </>
                  )}
                  {social.icon === "facebook" && (
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                  )}
                </svg>
              </a>
            ))}
          </div>

          {/* Divider Line */}
          <Separator className="bg-[#bab59b] opacity-30" />

          {/* Copyright Text */}
          <div className="flex justify-center w-full">
            <p className="[font-family:'Plus_Jakarta_Sans',Helvetica] font-normal text-[#bab59b] text-base text-center tracking-[0] leading-6">
              © 2024 Mixology. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};