import React from "react";
import { 
  BoxCubeIcon, 
  GroupIcon, 
  PieChartIcon, 
  TableIcon 
} from "@/icons";

export const RealEstateMetrics = () => {
  const metrics = [
    {
      title: "Total Properties",
      value: "148",
      change: "+12%",
      isPositive: true,
      icon: <BoxCubeIcon className="text-brand-500" />,
    },
    {
      title: "Active Leads",
      value: "86",
      change: "+5%",
      isPositive: true,
      icon: <TableIcon className="text-orange-500" />,
    },
    {
      title: "Total Sales",
      value: "$4.2M",
      change: "+18%",
      isPositive: true,
      icon: <PieChartIcon className="text-green-500" />,
    },
    {
      title: "Avg. Days on Market",
      value: "24",
      change: "-2 days",
      isPositive: true,
      icon: <PieChartIcon className="text-blue-500" />,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-6">
      {metrics.map((metric, index) => (
        <div
          key={index}
          className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-50 dark:bg-white/5">
              {metric.icon}
            </div>
            <span
              className={`flex items-center gap-1 text-theme-xs font-medium ${
                metric.isPositive ? "text-success-500" : "text-error-500"
              }`}
            >
              {metric.change}
            </span>
          </div>

          <div className="mt-5 flex items-end justify-between">
            <div>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {metric.title}
              </span>
              <h4 className="mt-1 text-title-sm font-bold text-gray-800 dark:text-white/90">
                {metric.value}
              </h4>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
