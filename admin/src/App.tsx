import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider } from "./context/AuthContext"
import { ProtectedRoute } from "./components/common/ProtectedRoute"
import { AdminLayout } from "./components/layout/AdminLayout"
import { ROUTES } from "./constants/routes"

// Import Feature Pages
import { LoginPage } from "./pages/auth/LoginPage"
import { DashboardPage } from "./pages/dashboard/DashboardPage"
import { OperatorsPage } from "./pages/operators/OperatorsPage"
import CabTypePage from "./pages/cabType/CabTypePage"
import { TruckTypesPage } from "./pages/truckTypes/TruckTypesPage"
import { LoadsPage } from "./pages/loads/LoadsPage"
import { RoutesPage } from "./pages/routes/RoutesPage"
import { StationsPage } from "./pages/stations/StationsPage"
import { SchedulesPage } from "./pages/schedules/SchedulesPage"
import { TripsPage } from "./pages/trips/TripsPage"
import { BookingsPage } from "./pages/bookings/BookingsPage"
import { UsersPage } from "./pages/users/UsersPage"
import { VouchersPage } from "./pages/vouchers/VouchersPage"
import { DriversPage } from "./pages/drivers/DriversPage"
import { MechanicsPage } from "./pages/mechanics/MechanicsPage"
import { ParkingPage } from "./pages/parking/ParkingPage"
import { SeatsPage } from "./pages/seats/SeatsPage"
import { ReportsPage } from "./pages/reports/ReportsPage"
import { RolesPermissionsPage } from "./pages/roles/RolesPermissionsPage"
import { SettingsPage } from "./pages/settings/SettingsPage"

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Login Screen */}
          <Route path={ROUTES.LOGIN} element={<LoginPage />} />

          {/* Protected Main Admin Layout */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path={ROUTES.OPERATORS} element={<OperatorsPage />} />
            <Route path={ROUTES.CABS_TYPE} element={<CabTypePage />} />
            <Route path={ROUTES.TRUCK_TYPES} element={<TruckTypesPage />} />
            <Route path={ROUTES.LOADS} element={<LoadsPage />} />
            <Route path={ROUTES.ROUTES} element={<RoutesPage />} />
            <Route path={ROUTES.STATIONS} element={<StationsPage />} />
            <Route path={ROUTES.SCHEDULES} element={<SchedulesPage />} />
            <Route path={ROUTES.TRIPS} element={<TripsPage />} />
            <Route path={ROUTES.BOOKINGS} element={<BookingsPage />} />
            <Route path={ROUTES.USERS} element={<UsersPage />} />
            <Route path={ROUTES.VOUCHERS} element={<VouchersPage />} />
            <Route path={ROUTES.DRIVERS} element={<DriversPage />} />
            <Route path={ROUTES.MECHANICS} element={<MechanicsPage />} />
            <Route path={ROUTES.PARKING} element={<ParkingPage />} />
            <Route path={ROUTES.SEATS} element={<SeatsPage />} />
            <Route path={ROUTES.REPORTS} element={<ReportsPage />} />
            <Route path={ROUTES.ROLES} element={<RolesPermissionsPage />} />
            <Route path={ROUTES.SETTINGS} element={<SettingsPage />} />
          </Route>

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
