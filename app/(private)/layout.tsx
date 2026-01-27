import Navbar from "@/components/navbar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <div className="min-h-screen ">
      <Navbar />
      <main className=" px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
