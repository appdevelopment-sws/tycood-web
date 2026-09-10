import React from 'react';
import { ShieldCheck, Check } from 'lucide-react';
import { DEFAULT_ROLE_PERMISSIONS } from '../../constants/permissions';

export const RolesPermissionsPage: React.FC = () => {
  const rolesList = [
    {
      name: 'SUPER_ADMIN',
      title: 'Super Administrator',
      description: 'Unrestricted access to all resources, financial settings, and role management.',
    },
    {
      name: 'BUS_OPERATOR',
      title: 'Bus Operator Admin',
      description: 'Manages own fleet, drivers, schedules, seat templates, and live dispatches.',
    },
    {
      name: 'DISPATCHER',
      title: 'Live Dispatcher',
      description: 'Monitors real-time trip status, driver logs, and delays.',
    },
    {
      name: 'FINANCE_ADMIN',
      title: 'Finance & Auditor',
      description: 'Access to revenue analytics, payouts, and booking ledgers.',
    },
    {
      name: 'SUPPORT_AGENT',
      title: 'Customer Support Agent',
      description: 'Searches passenger tickets, updates contact details, and handles cancellations.',
    },
  ];

  const permissionCategories = [
    { category: 'Dashboard & Reports', keys: ['dashboard:read', 'analytics:read'] },
    { category: 'Fleet Management', keys: ['operators:read', 'buses:read', 'buses:create', 'drivers:read'] },
    { category: 'Trips & Schedules', keys: ['routes:read', 'schedules:read', 'trips:read', 'trips:create'] },
    { category: 'Bookings & Refunds', keys: ['bookings:read', 'bookings:delete', 'users:read'] },
    { category: 'System Administration', keys: ['roles:manage', 'settings:manage'] },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Role-Based Access Control (RBAC)
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Configure granular permission matrices assigned to platform administrative roles.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Roles List */}
        <div className="space-y-3 lg:col-span-1">
          {rolesList.map((role) => (
            <div
              key={role.name}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-indigo-500/50 transition cursor-pointer dark:border-slate-800 dark:bg-slate-900/90"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900 dark:text-slate-100">{role.title}</span>
                <span className="rounded bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 text-[10px] font-mono text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  {role.name}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">{role.description}</p>
            </div>
          ))}
        </div>

        {/* Permission Matrix */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/90 overflow-x-auto">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-indigo-600 dark:text-indigo-400" /> Permission Assignment Matrix
          </h3>

          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-slate-500 dark:text-slate-400">
              <tr>
                <th className="py-3 px-4 font-semibold">Resource Action</th>
                <th className="py-3 px-2 font-semibold text-center">Super Admin</th>
                <th className="py-3 px-2 font-semibold text-center">Operator</th>
                <th className="py-3 px-2 font-semibold text-center">Dispatcher</th>
                <th className="py-3 px-2 font-semibold text-center">Support</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
              {permissionCategories.flatMap((cat) =>
                cat.keys.map((permKey) => {
                  const hasOp = DEFAULT_ROLE_PERMISSIONS.BUS_OPERATOR.includes(permKey);
                  const hasDisp = DEFAULT_ROLE_PERMISSIONS.DISPATCHER.includes(permKey);
                  const hasSupp = DEFAULT_ROLE_PERMISSIONS.SUPPORT_AGENT.includes(permKey);

                  return (
                    <tr key={permKey} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300">{permKey}</td>
                      <td className="py-3 px-2 text-center">
                        <Check className="h-4 w-4 mx-auto text-emerald-600 dark:text-emerald-400" />
                      </td>
                      <td className="py-3 px-2 text-center">
                        {hasOp ? (
                          <Check className="h-4 w-4 mx-auto text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <span className="text-slate-400 dark:text-slate-600">-</span>
                        )}
                      </td>
                      <td className="py-3 px-2 text-center">
                        {hasDisp ? (
                          <Check className="h-4 w-4 mx-auto text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <span className="text-slate-400 dark:text-slate-600">-</span>
                        )}
                      </td>
                      <td className="py-3 px-2 text-center">
                        {hasSupp ? (
                          <Check className="h-4 w-4 mx-auto text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <span className="text-slate-400 dark:text-slate-600">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
