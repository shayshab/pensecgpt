'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { scansApi, vulnerabilitiesApi, reportsApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function ScanDetailPage() {
  const params = useParams()
  const router = useRouter()
  const scanId = params.id as string

  const { data: scan, isLoading } = useQuery({
    queryKey: ['scan', scanId],
    queryFn: async () => {
      const response = await scansApi.getById(scanId)
      return response.data
    },
    refetchInterval: (query) => {
      const data = query.state.data as any
      return (data?.status === 'running' || data?.status === 'pending') ? 2000 : false
    },
  })

  const { data: vulnerabilities } = useQuery({
    queryKey: ['vulnerabilities', 'scan', scanId],
    queryFn: async () => {
      const response = await vulnerabilitiesApi.getAll({ scan_id: scanId })
      return response.data || []
    },
    enabled: !!scan && scan.status === 'completed',
  })

  const generateReport = async (type: string) => {
    try {
      await reportsApi.generate(scanId, type)
      alert(`${type.toUpperCase()} report generated successfully!`)
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to generate report')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div>Loading scan details...</div>
      </div>
    )
  }

  if (!scan) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div>
          <p className="text-gray-500 mb-4">Scan not found</p>
          <Link href="/dashboard">
            <Button>Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    )
  }

  const severityCounts = {
    critical: vulnerabilities?.filter((v: any) => v.severity === 'critical').length || 0,
    high: vulnerabilities?.filter((v: any) => v.severity === 'high').length || 0,
    medium: vulnerabilities?.filter((v: any) => v.severity === 'medium').length || 0,
    low: vulnerabilities?.filter((v: any) => v.severity === 'low').length || 0,
    info: vulnerabilities?.filter((v: any) => v.severity === 'info').length || 0,
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href={`/dashboard/projects/${scan.project_id}`}>
                <Button variant="outline">← Back to Project</Button>
              </Link>
              <h1 className="text-xl font-bold text-primary-600">Scan Details</h1>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Scan Header */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {scan.scan_type.charAt(0).toUpperCase() + scan.scan_type.slice(1)} Scan
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <p className="font-semibold capitalize">{scan.status}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Started</p>
                  <p className="font-semibold">
                    {scan.started_at
                      ? new Date(scan.started_at).toLocaleString()
                      : 'Not started'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Completed</p>
                  <p className="font-semibold">
                    {scan.completed_at
                      ? new Date(scan.completed_at).toLocaleString()
                      : 'In progress'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Duration</p>
                  <p className="font-semibold">
                    {scan.duration_seconds ? `${scan.duration_seconds}s` : '-'}
                  </p>
                </div>
              </div>
            </div>
            {scan.status === 'completed' && (
              <div className="flex gap-2">
                <Button onClick={() => generateReport('pdf')} variant="outline">
                  Generate PDF
                </Button>
                <Button onClick={() => generateReport('json')} variant="outline">
                  Generate JSON
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Statistics */}
        {scan.status === 'completed' && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Total</h3>
              <p className="text-3xl font-bold text-gray-900">
                {scan.total_vulnerabilities || 0}
              </p>
            </div>
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Critical</h3>
              <p className="text-3xl font-bold text-red-600">{scan.critical_count || 0}</p>
            </div>
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">High</h3>
              <p className="text-3xl font-bold text-orange-600">{scan.high_count || 0}</p>
            </div>
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Medium</h3>
              <p className="text-3xl font-bold text-yellow-600">{scan.medium_count || 0}</p>
            </div>
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Low</h3>
              <p className="text-3xl font-bold text-blue-600">{scan.low_count || 0}</p>
            </div>
          </div>
        )}

        {/* Vulnerabilities List */}
        {scan.status === 'completed' && (
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Vulnerabilities</h3>
            {vulnerabilities && vulnerabilities.length > 0 ? (
              <div className="space-y-4">
                {vulnerabilities.map((vuln: any) => (
                  <Link
                    key={vuln.id}
                    href={`/dashboard/vulnerabilities/${vuln.id}`}
                    className="block border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold text-gray-900">{vuln.title}</h4>
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${
                              vuln.severity === 'critical'
                                ? 'bg-red-100 text-red-800'
                                : vuln.severity === 'high'
                                ? 'bg-orange-100 text-orange-800'
                                : vuln.severity === 'medium'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {vuln.severity}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{vuln.description}</p>
                        <div className="flex gap-4 text-xs text-gray-500">
                          <span>Category: {vuln.category}</span>
                          {vuln.cwe_id && <span>CWE: {vuln.cwe_id}</span>}
                          {vuln.cvss_score && <span>CVSS: {vuln.cvss_score}</span>}
                        </div>
                        {vuln.affected_url && (
                          <p className="text-xs text-gray-500 mt-2 truncate">
                            URL: {vuln.affected_url}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No vulnerabilities found</p>
              </div>
            )}
          </div>
        )}

        {(scan.status === 'running' || scan.status === 'pending') && (
          <div className="bg-white shadow rounded-lg p-6">
            <div className="text-center mb-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-gray-600 font-semibold">Scan is in progress...</p>
              <p className="text-sm text-gray-500 mt-2">This page will update automatically</p>
            </div>
            {scan.error_message && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="animate-pulse w-2 h-2 bg-blue-600 rounded-full"></div>
                  <p className="text-sm font-semibold text-blue-900">Current Step:</p>
                </div>
                <p className="text-sm text-blue-800">{scan.error_message}</p>
              </div>
            )}
            {scan.started_at && (
              <div className="mt-4 text-center">
                <p className="text-xs text-gray-500">
                  Running for {Math.floor((new Date().getTime() - new Date(scan.started_at).getTime()) / 1000)} seconds
                </p>
              </div>
            )}
          </div>
        )}

        {scan.status === 'failed' && scan.error_message && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="font-semibold text-red-800 mb-2">Scan Failed</h3>
            <p className="text-red-700">{scan.error_message}</p>
          </div>
        )}
      </main>
    </div>
  )
}

