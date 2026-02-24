import { CertificatePreview } from "@/components/certificate";

// Demo page — visit /certificate-demo to preview the certificate
export default function CertificateDemoPage() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 px-4 py-12">
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-2 text-center text-2xl font-bold text-gray-900 dark:text-gray-100">
          Certificate Preview
        </h1>
        <p className="mb-8 text-center text-sm text-gray-500">
          Sample certificate generated for a completed course
        </p>

        <CertificatePreview
          certificateNumber="CERT-2026-A1B2C3D4"
          studentName="Nayan Sukhadiya"
          courseName="Complete Next.js Developer Bootcamp"
          instructorName="John Doe"
          organizationName="CourseSphere"
          issuedAt="February 20, 2026"
          totalHours={24}
          totalLessons={48}
        />
      </div>
    </main>
  );
}
