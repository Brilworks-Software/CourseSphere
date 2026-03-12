"use client";
import React, { useEffect, useState } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Alert } from "@/components/ui/alert";

interface Purchase {
  id: string;
  user_id: string;
  course_id: string;
  transaction_id: string;
  purchase_price: number;
  purchased_at: string;
  course: { title: string };
  user: { email: string; first_name?: string; last_name?: string };
  transaction?: {
    razorpay_payment_id?: string;
    amount?: number;
    payment_status?: string;
    paid_at?: string;
  };
}

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/purchases")
      .then((res) => res.json())
      .then((data) => {
        setPurchases(data.purchases || []);
        setLoading(false);
      })
      .catch((err) => {
        setError("Failed to load purchases");
        setLoading(false);
      });
  }, []);

  if (loading)
    return (
      <div className="flex justify-center items-center h-40">
        <span className="text-muted-foreground">Loading...</span>
      </div>
    );

  if (error)
    return (
      <div className="max-w-2xl mx-auto mt-8">
        <Alert variant="destructive">{error}</Alert>
      </div>
    );

  return (
    <div className=" mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-1">Course Purchases</h1>
        <p className="text-muted-foreground">
          All course purchases for analytics and tracking.
        </p>
      </div>
      <div className="rounded-xl border bg-card shadow-sm overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Course</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {purchases.map((purchase, idx) => (
              <TableRow key={purchase.id}>
                <TableCell>{idx + 1}</TableCell>
                <TableCell>
                  {purchase.course?.title || purchase.course_id}
                </TableCell>
                <TableCell>
                  {(purchase.user?.first_name || "") +
                    " " +
                    (purchase.user?.last_name || "")}
                </TableCell>
                <TableCell>{purchase.user?.email}</TableCell>
                <TableCell>₹{purchase.purchase_price / 100}</TableCell>
                <TableCell>
                  {new Date(purchase.purchased_at).toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );

}
