"use client";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Download, Award, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";

interface CertificateViewProps {
  certificate: any | null;
  studentId: string;
  courseId: string;
  onCertificateIssued?: (cert: any) => void;
}

export default function CertificateView({
  certificate: initialCertificate,
  studentId,
  courseId,
  onCertificateIssued,
}: CertificateViewProps) {
  const [certificate, setCertificate] = useState(initialCertificate);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  async function handleIssueCertificate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/student/certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, courseId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to issue certificate");
      setCertificate(data.certificate);
      onCertificateIssued?.(data.certificate);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function handlePrint() {
    if (!printRef.current) return;
    const content = printRef.current.innerHTML;
    const win = window.open("", "_blank", "width=900,height=650");
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Certificate – ${certificate?.course_name}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;500;600&display=swap');
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: 'Inter', sans-serif; background: #fff; }
            .cert-wrap { width: 100%; max-width: 850px; margin: 0 auto; }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <div class="cert-wrap">${content}</div>
        </body>
      </html>
    `);
    win.document.close();
  }

  if (!certificate) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Award className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-lg">Your Certificate is Ready!</h3>
          <p className="text-sm text-muted-foreground mt-1">
            You've completed all lessons. Click below to generate your certificate.
          </p>
        </div>
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
        <Button onClick={handleIssueCertificate} disabled={loading} className="gap-2">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Award className="w-4 h-4" />}
          Generate Certificate
        </Button>
      </div>
    );
  }

  const issuedDate = certificate.issued_at
    ? format(new Date(certificate.issued_at), "MMMM d, yyyy")
    : "";

  const totalHours = certificate.total_hours
    ? `${parseFloat(certificate.total_hours).toFixed(1)}h`
    : "";

  return (
    <div className="space-y-4">
      {/* Actions */}
      <div className="flex justify-end">
        <Button variant="outline" className="gap-2" onClick={handlePrint}>
          <Download className="w-4 h-4" />
          Download / Print
        </Button>
      </div>

      {/* Certificate Card */}
      <div
        ref={printRef}
        className="relative overflow-hidden rounded-2xl border-2 border-amber-300/60 dark:border-amber-400/30 bg-gradient-to-br from-amber-50 via-white to-amber-50 dark:from-amber-950/20 dark:via-background dark:to-amber-950/20 p-8 shadow-lg"
      >
        {/* Watermark */}
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.03] select-none"
          aria-hidden
        >
          <Award className="w-96 h-96 text-amber-600" />
        </div>

        {/* Top border accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 rounded-t-2xl" />

        <div className="relative flex flex-col items-center text-center gap-6">
          {/* Header */}
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <Award className="w-6 h-6" />
              <span className="text-xs font-semibold uppercase tracking-[0.2em]">
                Certificate of Completion
              </span>
              <Award className="w-6 h-6" />
            </div>
            {certificate.organization_name && (
              <p className="text-sm text-muted-foreground">
                {certificate.organization_name}
              </p>
            )}
          </div>

          {/* Divider */}
          <div className="w-24 h-px bg-amber-300/60" />

          {/* This certifies */}
          <p className="text-sm text-muted-foreground italic">
            This is to certify that
          </p>

          {/* Student Name */}
          <h2
            className="text-4xl font-bold tracking-tight"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {certificate.student_name}
          </h2>

          <p className="text-sm text-muted-foreground italic">
            has successfully completed the course
          </p>

          {/* Course Name */}
          <h3
            className="text-2xl font-semibold text-primary"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {certificate.course_name}
          </h3>

          {/* Stats row */}
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            {certificate.total_lessons > 0 && (
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>{certificate.total_lessons} lessons</span>
              </div>
            )}
            {totalHours && (
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>{totalHours} of learning</span>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="w-24 h-px bg-amber-300/60" />

          {/* Footer row */}
          <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
            {/* Instructor */}
            <div className="text-center">
              <div className="w-24 h-px bg-border mx-auto mb-2" />
              <p className="font-medium">{certificate.instructor_name || "—"}</p>
              <p className="text-muted-foreground text-xs">Instructor</p>
            </div>

            {/* Certificate number + date */}
            <div className="text-center">
              <p className="font-mono text-xs text-muted-foreground">
                {certificate.certificate_number}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Issued on {issuedDate}
              </p>
            </div>

            {/* Logo placeholder */}
            <div className="text-center">
              <div className="w-24 h-px bg-border mx-auto mb-2" />
              <p className="font-medium">CourseSphere</p>
              <p className="text-muted-foreground text-xs">Platform</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
