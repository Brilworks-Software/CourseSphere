"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Trash2, Power, PowerOff } from "lucide-react";
import { useUserContext } from "@/app/provider/user-context";

interface Coupon {
  id: string;
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  max_uses: number | null;
  used_count: number;
  is_active: boolean;
  valid_until: string | null;
  min_purchase_amount: number;
}

export default function CouponStep({ courseId }: { courseId: string }) {
  const { user } = useUserContext();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">(
    "percentage",
  );
  const [discountValue, setDiscountValue] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [minPurchase, setMinPurchase] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetchCoupons();
  }, [courseId]);

  const fetchCoupons = async () => {
    try {
      const res = await fetch(`/api/courses/${courseId}/coupons`);
      if (!res.ok) throw new Error("Failed to fetch coupons");
      const data = await res.json();
      setCoupons(data);
    } catch (error) {
      toast.error("Could not load coupons");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`/api/courses/${courseId}/coupons`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          discount_type: discountType,
          discount_value: Number(discountValue),
          max_uses: maxUses ? Number(maxUses) : null,
          valid_until: validUntil ? new Date(validUntil).toISOString() : null,
          min_purchase_amount: minPurchase ? Number(minPurchase) : 0,
          instructorId: user?.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create coupon");

      toast.success("Coupon created successfully!");
      setCoupons([data, ...coupons]);

      // Reset form
      setCode("");
      setDiscountValue("");
      setMaxUses("");
      setValidUntil("");
      setMinPurchase("");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/courses/${courseId}/coupons/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          is_active: !currentStatus,
          instructorId: user?.id,
        }),
      });
      if (!res.ok) throw new Error("Failed to update status");

      setCoupons(
        coupons.map((c) =>
          c.id === id ? { ...c, is_active: !currentStatus } : c,
        ),
      );
      toast.success(currentStatus ? "Coupon deactivated" : "Coupon activated");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this coupon?")) return;

    try {
      const res = await fetch(
        `/api/courses/${courseId}/coupons/${id}?instructorId=${user?.id || ""}`,
        {
          method: "DELETE",
        },
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete");
      }

      setCoupons(coupons.filter((c) => c.id !== id));
      toast.success("Coupon deleted");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Coupons</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setOpen(true)}>Create Coupon</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Coupon</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={async (e) => {
                await handleCreate(e);
                if (!submitting) setOpen(false);
              }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <div className="space-y-2">
                <Label htmlFor="code">Coupon Code</Label>
                <Input
                  id="code"
                  placeholder="e.g. SUMMER50"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  maxLength={20}
                  pattern="[a-zA-Z0-9_\-]+"
                  title="Only alphanumeric characters, dashes, and underscores are allowed"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="discountType">Discount Type</Label>
                <Select
                  value={discountType}
                  onValueChange={(val) =>
                    setDiscountType(val as "percentage" | "fixed")
                  }
                >
                  <SelectTrigger className="w-full" id="discountType">
                    <SelectValue placeholder="Select discount type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="discountValue">Discount Value</Label>
                <Input
                  id="discountValue"
                  type="number"
                  min="0"
                  step={discountType === "percentage" ? "1" : "0.01"}
                  max={discountType === "percentage" ? "100" : undefined}
                  placeholder={
                    discountType === "percentage" ? "e.g. 20" : "e.g. 500"
                  }
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxUses">
                  Max Uses (Leave blank for unlimited)
                </Label>
                <Input
                  id="maxUses"
                  type="number"
                  min="1"
                  placeholder="e.g. 100"
                  value={maxUses}
                  onChange={(e) => setMaxUses(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="validUntil">Expiry Date (Optional)</Label>
                <Input
                  id="validUntil"
                  type="datetime-local"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minPurchase">
                  Min Purchase Amount (Optional, ₹)
                </Label>
                <Input
                  id="minPurchase"
                  type="number"
                  min="0"
                  placeholder="e.g. 1000"
                  value={minPurchase}
                  onChange={(e) => setMinPurchase(e.target.value)}
                />
              </div>
              <div className="md:col-span-2 pt-2 flex gap-2 justify-end">
                <Button type="submit" disabled={submitting}>
                  {submitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Create Coupon
                </Button>
                <DialogClose asChild>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}
                  >
                    Cancel
                  </Button>
                </DialogClose>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div>
        <h3 className="text-lg font-medium mb-4">Existing Coupons</h3>
        {loading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : coupons.length === 0 ? (
          <div className="text-center p-8 bg-muted/20 border rounded-lg text-muted-foreground">
            No coupons created yet.
          </div>
        ) : (
          <div className="border rounded-lg overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted text-muted-foreground uppercase text-xs">
                <tr>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Discount</th>
                  <th className="px-4 py-3">Usage</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((coupon) => (
                  <tr key={coupon.id} className="border-t">
                    <td className="px-4 py-3 font-medium">{coupon.code}</td>
                    <td className="px-4 py-3">
                      {coupon.discount_type === "percentage"
                        ? `${coupon.discount_value}%`
                        : `₹${coupon.discount_value}`}
                    </td>
                    <td className="px-4 py-3">
                      {coupon.used_count} / {coupon.max_uses || "∞"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${coupon.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                      >
                        {coupon.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          toggleActive(coupon.id, coupon.is_active)
                        }
                        title={coupon.is_active ? "Deactivate" : "Activate"}
                      >
                        {coupon.is_active ? (
                          <><PowerOff className="h-4 w-4" /> Deactivate</>
                        ) : (
                          <><Power className="h-4 w-4" /> Activate</>
                        )}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(coupon.id)}
                        disabled={coupon.used_count > 0}
                        title={
                          coupon.used_count > 0
                            ? "Cannot delete used coupon"
                            : "Delete"
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
