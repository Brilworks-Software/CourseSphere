"use client";
import React from "react";

export default function OrganizationBanner({ organization }: any) {
  if (!organization) return null;
  return (
    <div className="relative w-full superUltraWide-container max-h-76 overflow-hidden rounded-2xl bg-muted mb-8">
      <div className="w-full rounded-2xl ">
        <img
          src={organization?.thumbnail_url || "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTSNDKb6szpfNfLfPHEk6VIVryrF3k3XJJWPw&s"}
          alt="Banner"
          className="object-contain w-full h-full"
        />
      </div>
  <div className="absolute inset-0 bg-linear-to-t from-background to-transparent"></div>
      <div className="absolute bottom-4 left-6 w-full rounded-lg overflow-hidden">
        {organization?.logo_url && (
          <div>
            <p className="text-2xl">A Course By</p>
            <div className="flex items-center">
              <img
                src={organization?.logo_url}
                alt={organization.name}
                className="w-32 h-32 rounded-lg object-cover border-2 border-background shadow-lg bg-background"
                style={{ boxShadow: "0 4px 24px 0 rgba(0,0,0,0.08)" }}
              />
              <div className="ml-4">
                <div className="font-bold text-lg sm:text-2xl text-foreground">{organization.name}</div>
                <div className="text-xs text-muted-foreground mt-1">Org slug: {organization.slug}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
