import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  linkText: string;
  linkHref: string;
}

export default function StatsCard({ title, value, icon, linkText, linkHref }: StatsCardProps) {
  return (
    <div className="overflow-hidden rounded-lg bg-white shadow">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            {icon}
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="truncate text-sm font-medium text-gray-500">{title}</dt>
              <dd>
                <div className="text-lg font-medium text-gray-900">{value}</div>
              </dd>
            </dl>
          </div>
        </div>
      </div>
      <div className="bg-gray-50 px-5 py-3">
        <div className="text-sm">
          <Link href={linkHref}>
            <a className="font-medium text-primary-600 hover:text-primary-500">{linkText}</a>
          </Link>
        </div>
      </div>
    </div>
  );
}
