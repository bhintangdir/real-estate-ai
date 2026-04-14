import type { Metadata } from "next";
import { RealEstateMetrics } from "@/components/real-estate/RealEstateMetrics";
import React from "react";
import MonthlyTarget from "@/components/ecommerce/MonthlyTarget";
import MonthlySalesChart from "@/components/ecommerce/MonthlySalesChart";
import StatisticsChart from "@/components/ecommerce/StatisticsChart";
import RecentOrders from "@/components/ecommerce/RecentOrders";
import DemographicCard from "@/components/ecommerce/DemographicCard";

export const metadata: Metadata = {
  title:
    "Real Estate Dashboard | Admin Panel",
  description: "Real Estate Management System Dashboard",
};

export default function RealEstateDashboard() {
  return (
    <div className="space-y-6">
      <RealEstateMetrics />

      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 space-y-6 xl:col-span-7">
          <MonthlySalesChart title="Property Sales Overview" />
        </div>

        <div className="col-span-12 xl:col-span-5">
          <MonthlyTarget title="Sales Targets" />
        </div>

        <div className="col-span-12">
          <StatisticsChart title="Market Trends" />
        </div>

        <div className="col-span-12 xl:col-span-5">
          <DemographicCard title="Customer Demographics" />
        </div>

        <div className="col-span-12 xl:col-span-7">
          <RecentOrders title="Incoming Leads" />
        </div>
      </div>
    </div>
  );
}
