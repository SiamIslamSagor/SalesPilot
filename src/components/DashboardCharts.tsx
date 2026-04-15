import * as React from "react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, Euro, Users, Package, ShoppingCart } from "lucide-react";
import { formatEuro } from "@/lib/utils";

interface RevenueChartProps {
  data: Array<{ date: string; revenue: number; margin: number }>;
}

export function RevenueChart({ data }: RevenueChartProps) {
  const chartConfig = {
    revenue: {
      label: "Revenue",
      icon: Euro,
      color: "hsl(var(--chart-1))",
    },
    margin: {
      label: "Margin",
      icon: TrendingUp,
      color: "hsl(var(--chart-2))",
    },
  };

  return (
    <ChartContainer config={chartConfig} className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12 }}
            tickFormatter={value => {
              const date = new Date(value);
              return date.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              });
            }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12 }}
            tickFormatter={value => `€${value.toLocaleString("de-DE")}`}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Legend content={<ChartLegendContent />} />
          <Area
            type="monotone"
            dataKey="revenue"
            stackId="1"
            stroke={chartConfig.revenue.color}
            fill={chartConfig.revenue.color}
            fillOpacity={0.6}
          />
          <Area
            type="monotone"
            dataKey="margin"
            stackId="2"
            stroke={chartConfig.margin.color}
            fill={chartConfig.margin.color}
            fillOpacity={0.6}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}

interface OffersByStatusChartProps {
  data: {
    draft: number;
    sent: number;
    accepted: number;
    rejected: number;
    expired: number;
    completed: number;
  };
}

const OFFER_STATUS_COLORS = {
  draft: "#94a3b8",
  sent: "#3b82f6",
  accepted: "#10b981",
  rejected: "#ef4444",
  expired: "#f59e0b",
  completed: "#06b6d4",
};

export function OffersByStatusChart({ data }: OffersByStatusChartProps) {
  const chartData = [
    { name: "Draft", value: data.draft, color: OFFER_STATUS_COLORS.draft },
    { name: "Sent", value: data.sent, color: OFFER_STATUS_COLORS.sent },
    {
      name: "Accepted",
      value: data.accepted,
      color: OFFER_STATUS_COLORS.accepted,
    },
    {
      name: "Rejected",
      value: data.rejected,
      color: OFFER_STATUS_COLORS.rejected,
    },
    {
      name: "Expired",
      value: data.expired,
      color: OFFER_STATUS_COLORS.expired,
    },
    {
      name: "Completed",
      value: data.completed,
      color: OFFER_STATUS_COLORS.completed,
    },
  ].filter(item => item.value > 0);

  const chartConfig = {
    draft: { label: "Draft", color: OFFER_STATUS_COLORS.draft },
    sent: { label: "Sent", color: OFFER_STATUS_COLORS.sent },
    accepted: { label: "Accepted", color: OFFER_STATUS_COLORS.accepted },
    rejected: { label: "Rejected", color: OFFER_STATUS_COLORS.rejected },
    expired: { label: "Expired", color: OFFER_STATUS_COLORS.expired },
    completed: { label: "Completed", color: OFFER_STATUS_COLORS.completed },
  };

  return (
    <ChartContainer config={chartConfig} className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <ChartTooltip content={<ChartTooltipContent />} />
          <Legend content={<ChartLegendContent />} />
        </PieChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}

interface OrdersByStatusChartProps {
  data: {
    pending: number;
    processing: number;
    completed: number;
    cancelled: number;
  };
}

const ORDER_STATUS_COLORS = {
  pending: "#f59e0b",
  processing: "#3b82f6",
  completed: "#10b981",
  cancelled: "#ef4444",
};

export function OrdersByStatusChart({ data }: OrdersByStatusChartProps) {
  const chartData = [
    {
      name: "Pending",
      value: data.pending,
      color: ORDER_STATUS_COLORS.pending,
    },
    {
      name: "Processing",
      value: data.processing,
      color: ORDER_STATUS_COLORS.processing,
    },
    {
      name: "Completed",
      value: data.completed,
      color: ORDER_STATUS_COLORS.completed,
    },
    {
      name: "Cancelled",
      value: data.cancelled,
      color: ORDER_STATUS_COLORS.cancelled,
    },
  ].filter(item => item.value > 0);

  const chartConfig = {
    pending: { label: "Pending", color: ORDER_STATUS_COLORS.pending },
    processing: { label: "Processing", color: ORDER_STATUS_COLORS.processing },
    completed: { label: "Completed", color: ORDER_STATUS_COLORS.completed },
    cancelled: { label: "Cancelled", color: ORDER_STATUS_COLORS.cancelled },
  };

  return (
    <ChartContainer config={chartConfig} className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <ChartTooltip content={<ChartTooltipContent />} />
          <Legend content={<ChartLegendContent />} />
        </PieChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}

interface TopCustomersChartProps {
  data: Array<{
    companyName: string;
    totalSales: number;
    totalMargin: number;
  }>;
}

export function TopCustomersChart({ data }: TopCustomersChartProps) {
  const chartConfig = {
    sales: {
      label: "Sales",
      icon: Euro,
      color: "hsl(var(--chart-1))",
    },
    margin: {
      label: "Margin",
      icon: TrendingUp,
      color: "hsl(var(--chart-2))",
    },
  };

  return (
    <ChartContainer config={chartConfig} className="h-[350px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data.slice(0, 10)} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            type="number"
            tick={{ fontSize: 12 }}
            tickFormatter={value => `€${value.toLocaleString("de-DE")}`}
          />
          <YAxis
            dataKey="companyName"
            type="category"
            tick={{ fontSize: 12 }}
            width={120}
            tickLine={false}
            axisLine={false}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Legend content={<ChartLegendContent />} />
          <Bar
            dataKey="totalSales"
            fill={chartConfig.sales.color}
            radius={[0, 4, 4, 0]}
          />
          <Bar
            dataKey="totalMargin"
            fill={chartConfig.margin.color}
            radius={[0, 4, 4, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}

interface TopProductsChartProps {
  data: Array<{
    name: string;
    margin: number;
    salesPrice: number;
  }>;
}

export function TopProductsChart({ data }: TopProductsChartProps) {
  const chartConfig = {
    margin: {
      label: "Margin %",
      icon: TrendingUp,
      color: "hsl(var(--chart-1))",
    },
    price: {
      label: "Price",
      icon: Package,
      color: "hsl(var(--chart-2))",
    },
  };

  return (
    <ChartContainer config={chartConfig} className="h-[350px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data.slice(0, 10)} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            type="number"
            tick={{ fontSize: 12 }}
            tickFormatter={value => `€${value.toLocaleString("de-DE")}`}
          />
          <YAxis
            dataKey="name"
            type="category"
            tick={{ fontSize: 12 }}
            width={150}
            tickLine={false}
            axisLine={false}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Legend content={<ChartLegendContent />} />
          <Bar
            dataKey="margin"
            fill={chartConfig.margin.color}
            radius={[0, 4, 4, 0]}
          />
          <Bar
            dataKey="salesPrice"
            fill={chartConfig.price.color}
            radius={[0, 4, 4, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}

interface OffersOverTimeChartProps {
  data: Array<{ date: string; count: number; value: number }>;
}

export function OffersOverTimeChart({ data }: OffersOverTimeChartProps) {
  const chartConfig = {
    count: {
      label: "Count",
      icon: ShoppingCart,
      color: "hsl(var(--chart-1))",
    },
    value: {
      label: "Value",
      icon: Euro,
      color: "hsl(var(--chart-2))",
    },
  };

  return (
    <ChartContainer config={chartConfig} className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12 }}
            tickFormatter={value => {
              const date = new Date(value);
              return date.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              });
            }}
          />
          <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Legend content={<ChartLegendContent />} />
          <Line
            type="monotone"
            dataKey="count"
            stroke={chartConfig.count.color}
            strokeWidth={2}
            dot={{ fill: chartConfig.count.color, strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={chartConfig.value.color}
            strokeWidth={2}
            dot={{ fill: chartConfig.value.color, strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
