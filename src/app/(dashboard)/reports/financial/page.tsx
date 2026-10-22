import { fetchBackendJson } from '../../../../lib/api';
import { getAuthToken } from '@/lib/serverAuth';
import FinancialReportClient from './financial-report-client';

async function getFinancialReport(startDate?: string, endDate?: string) {
  const token = await getAuthToken();
  
  let url = '/api/reports/financial';
  if (startDate || endDate) {
    const queryParams = new URLSearchParams();
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);
    url += `?${queryParams.toString()}`;
  }
  
  return fetchBackendJson(url, token);
}

async function getDailySummary(date?: string) {
  const token = await getAuthToken();
  
  let url = '/api/reports/daily-summary';
  if (date) {
    url += `?date=${date}`;
  }
  
  return fetchBackendJson(url, token);
}

export default async function FinancialReportPage({
  searchParams,
}: {
  searchParams?: { startDate?: string; endDate?: string; date?: string };
}) {
  const [financialData, dailyData] = await Promise.all([
    getFinancialReport(searchParams?.startDate, searchParams?.endDate),
    getDailySummary(searchParams?.date),
  ]);

  if (!financialData && !dailyData) {
    return <div>Please login</div>;
  }

  return (
    <div className="p-6 max-w-7.5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Financial Report</h1>
        <p className="text-gray-600 mt-1">
          Income, expenses, and daily financial summary
        </p>
      </div>
      <FinancialReportClient
        financialData={financialData?.data || null}
        dailyData={dailyData?.data || null}
      />
    </div>
  );
}
