import React from "react"
import { useQuery } from "@tanstack/react-query"
import { Phone, Clock, User, Truck } from "lucide-react"

import { FormContainer } from "@/components/formContainer"
import { Button } from "@/components/ui/button"
import { logisticsService } from "@/services/logisticsService"
import type { Load, LoadCallLog } from "@/types/logistics"

export interface LoadCallLogsDialogProps {
  open: boolean
  onClose: (open: boolean) => void
  load?: Load | null
}

export const LoadCallLogsDialog: React.FC<LoadCallLogsDialogProps> = ({
  open,
  onClose,
  load,
}) => {
  const { data: callLogs = [], isLoading } = useQuery<LoadCallLog[]>({
    queryKey: ["logistics-call-logs", load?.id ?? "all"],
    queryFn: () =>
      logisticsService.getCallLogs(load?.id ? { loadId: load.id } : undefined),
    enabled: open,
  })

  return (
    <FormContainer
      open={open}
      onOpenChange={onClose}
      size="xl"
      title={
        load
          ? `Caller Inquiries • Load #${load.loadNumber}`
          : "Shipper Call Inquiries & Caller Audit Trail"
      }
      description={
        load
          ? `Audit log of drivers and transporters who tapped to call for ${load.pickupCity} → ${load.unloadingCity}`
          : "Audit log of all drivers and partners who tapped to call shippers/transporters across all loads"
      }
      footer={
        <div className="flex w-full justify-end">
          <Button variant="outline" onClick={() => onClose(false)}>
            Close
          </Button>
        </div>
      }
    >
      <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-1">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500">
            <div className="mb-2 h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span className="text-sm">Loading call inquiries...</span>
          </div>
        ) : callLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-slate-500">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
              <Phone className="h-6 w-6 text-slate-400" />
            </div>
            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              No Call Inquiries Yet
            </h4>
            <p className="mt-1 max-w-sm text-xs text-slate-500">
              {load
                ? `No drivers or partners have clicked to call the transporter for load #${load.loadNumber} yet.`
                : "No outbound call attempts have been logged on the cargo load board yet."}
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300">
                <tr>
                  <th className="px-4 py-3">Caller (Who Tried Calling)</th>
                  <th className="px-4 py-3">Load Details</th>
                  <th className="px-4 py-3">Transporter / Shipper Called</th>
                  <th className="px-4 py-3 text-right">Date & Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {callLogs.map((log) => {
                  const dateStr = new Date(log.createdAt).toLocaleString(
                    "en-IN",
                    {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }
                  )
                  return (
                    <tr
                      key={log.id}
                      className="transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                            <User className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                              {log.callerName}
                            </div>
                            <a
                              href={`tel:${log.callerPhone}`}
                              className="mt-0.5 flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                            >
                              <Phone className="h-3 w-3" />
                              {log.callerPhone}
                            </a>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="font-mono text-xs font-semibold text-amber-600 dark:text-amber-400">
                            #{log.loadNumber}
                          </span>
                          {log.load ? (
                            <span className="mt-0.5 flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
                              <Truck className="h-3 w-3 text-slate-400" />
                              {log.load.pickupCity} → {log.load.unloadingCity}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-500">
                              Load ID: {log.loadId.substring(0, 8)}...
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
                            {log.transporterName || "Shipper"}
                          </span>
                          {log.transporterPhone && (
                            <span className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                              <Phone className="h-3 w-3 text-slate-400" />
                              {log.transporterPhone}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="flex items-center justify-end gap-1 text-xs whitespace-nowrap text-slate-500">
                          <Clock className="h-3 w-3 text-slate-400" />
                          {dateStr}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </FormContainer>
  )
}
export default LoadCallLogsDialog
