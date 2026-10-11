import type { Metadata } from "next";
import { getCustomerStats } from "@/lib/data";
import CustomersTable from "@/components/admin/CustomersTable";

export const metadata: Metadata = { title: "Registered Customers" };

export default async function AdminCustomersPage() {
  const customers = await getCustomerStats();
  return (
    <CustomersTable
      customers={customers.map((c) => ({
        id: c.id,
        mobileNumber: c.mobileNumber,
        mobileVerified: c.mobileVerified,
        accountStatus: c.accountStatus,
        createdAt: c.createdAt.toISOString(),
        lastLogin: c.lastLogin ? c.lastLogin.toISOString() : null,
        orderCount: c.orderCount,
      }))}
    />
  );
}
