"use client";

import React, { useState } from "react";
import { Award, Download, Star, CheckCircle2 } from "lucide-react";
import { downloadCertificatePDF } from "./certificate-pdf";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface CertificatePreviewProps {
  certificateNumber: string;
  studentName: string;
  courseName: string;
  instructorName?: string;
  organizationName?: string;
  issuedAt: string; // e.g. "February 20, 2026"
  totalHours?: number;
  totalLessons?: number;
  logoUrl?: string; // URL of org/course logo
}

// ─── Component ───────────────────────────────────────────────────────────────
export function CertificatePreview({
  certificateNumber,
  studentName,
  courseName,
  instructorName,
  organizationName = "CourseSphere",
  issuedAt,
  totalHours,
  totalLessons,
  logoUrl,
}: CertificatePreviewProps) {
  const [downloading, setDownloading] = useState(false);

  async function handleDownload() {
    setDownloading(true);
    try {
      await downloadCertificatePDF({
        certificateNumber,
        studentName,
        courseName,
        instructorName,
        organizationName,
        issuedAt,
        totalHours,
        logoUrl,
      });
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-6">
      {/* ── Action button ── */}
      <div className="flex gap-3">
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="flex items-center gap-2 rounded-lg bg-[#1e3a5f] px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-[#162d4a] disabled:opacity-60"
        >
          <Download className="h-4 w-4" />
          {downloading ? "Generating PDF…" : "Download PDF"}
        </button>
      </div>

      {/* ── Certificate Card ── */}
      <div
        id="certificate-card"
        className="relative w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl print:rounded-none print:shadow-none"
        style={{ aspectRatio: "1.414 / 1" }} /* A4 landscape ratio */
      >
        {/* Outer navy border */}
        <div className="absolute inset-0 border-[10px] border-[#1e3a5f] rounded-2xl print:rounded-none" />
        {/* Inner gold border */}
        <div className="absolute inset-[18px] border-2 border-[#c9a84c] rounded-xl print:rounded-none" />

        {/* Corner ornaments */}
        <Ornament className="absolute top-6 left-6" />
        <Ornament className="absolute top-6 right-6 rotate-90" />
        <Ornament className="absolute bottom-6 left-6 -rotate-90" />
        <Ornament className="absolute bottom-6 right-6 rotate-180" />

        {/* Background watermark */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
          <Award className="h-[60%] w-[60%] text-[#1e3a5f]" />
        </div>

        {/* ── Content ── */}
        <div className="relative flex h-full flex-col items-center justify-between px-16 py-10">
          {/* Header */}
          <div className="flex flex-col items-center gap-2">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt={organizationName}
                className="h-12 w-12 rounded-full object-cover ring-2 ring-[#c9a84c]"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1e3a5f] ring-2 ring-[#c9a84c]">
                <Award className="h-6 w-6 text-[#c9a84c]" />
              </div>
            )}
            <p className="text-[10px] tracking-[4px] text-gray-400 uppercase font-medium">
              {organizationName}
            </p>
            {/* Gold divider */}
            <div className="h-[2px] w-24 bg-gradient-to-r from-transparent via-[#c9a84c] to-transparent" />
          </div>

          {/* Title block */}
          <div className="flex flex-col items-center gap-1 -mt-2">
            <p className="text-[9px] tracking-[5px] uppercase text-gray-400">
              Certificate of
            </p>
            <h1
              className="text-5xl font-bold tracking-wide text-[#1e3a5f]"
              style={{ fontFamily: "Georgia, serif" }}
            >
              Completion
            </h1>
            <p className="text-[9px] tracking-[4px] uppercase text-gray-400 mt-1">
              This is to certify that
            </p>
          </div>

          {/* Recipient */}
          <div className="flex flex-col items-center gap-1">
            <p
              className="text-3xl font-bold text-[#1e3a5f]"
              style={{ fontFamily: "Georgia, serif" }}
            >
              {studentName}
            </p>
            <p className="text-xs text-gray-500 text-center max-w-sm leading-relaxed">
              has successfully completed all lessons and requirements of the
              course
            </p>
            <p className="text-lg font-semibold text-[#c9a84c] text-center max-w-sm mt-1">
              &ldquo;{courseName}&rdquo;
            </p>
            <p className="text-xs text-gray-500 text-center max-w-xs leading-relaxed mt-1">
              and is awarded this certificate in recognition of their dedication
              and achievement.
            </p>
          </div>

          {/* Meta pills */}
          <div className="flex items-center gap-6">
            <MetaItem label="Date Issued" value={issuedAt} />
            {totalHours !== undefined && (
              <MetaItem label="Duration" value={`${totalHours} hrs`} />
            )}
            {totalLessons !== undefined && (
              <MetaItem label="Lessons" value={`${totalLessons} completed`} />
            )}
          </div>

          {/* Divider */}
          <div className="h-px w-4/5 bg-gray-100" />

          {/* Signatures + cert ID */}
          <div className="flex w-4/5 items-end justify-between">
            <SignatureBlock label="Instructor" name={instructorName ?? "—"} />
            <div className="flex flex-col items-center gap-1">
              <CheckCircle2 className="h-5 w-5 text-[#c9a84c]" />
              <p className="text-[8px] tracking-[2px] uppercase text-gray-400">
                CERT NO.
              </p>
              <p className="text-[9px] font-mono font-semibold text-[#1e3a5f]">
                {certificateNumber}
              </p>
            </div>
            <SignatureBlock label="Platform" name={organizationName} />
          </div>

          {/* Star row */}
          <div className="flex gap-1 opacity-30">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="h-3 w-3 fill-[#c9a84c] text-[#c9a84c]" />
            ))}
          </div>
        </div>
      </div>

      {/* Print-only full name footer */}
      <div className="hidden print:block text-center text-xs text-gray-400 mt-2">
        Verify at {organizationName} · Certificate No: {certificateNumber}
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <p className="text-[8px] tracking-[3px] uppercase text-gray-400">
        {label}
      </p>
      <p className="text-xs font-semibold text-[#1e3a5f]">{value}</p>
    </div>
  );
}

function SignatureBlock({ label, name }: { label: string; name: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="h-px w-28 bg-[#1e3a5f]" />
      <p className="text-[8px] tracking-[2px] uppercase text-gray-400">
        {label}
      </p>
      <p className="text-xs font-semibold text-[#1e3a5f]">{name}</p>
    </div>
  );
}

// Tiny SVG ornament for corners
function Ornament({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
    >
      <path d="M2 2 L12 2 L2 12 Z" fill="#c9a84c" opacity="0.6" />
      <path d="M2 2 L2 12" stroke="#c9a84c" strokeWidth="1.5" opacity="0.4" />
      <path d="M2 2 L12 2" stroke="#c9a84c" strokeWidth="1.5" opacity="0.4" />
    </svg>
  );
}
