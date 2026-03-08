export type UserRole = "admin" | "staff";
export type AppointmentStatus = "scheduled" | "confirmed" | "cancelled";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export interface Clinic {
  id: string;
  name: string;
  plan: string;
  created_at: string;
}

export interface UserProfile {
  id: string;
  clinic_id: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export interface Patient {
  id: string;
  clinic_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  birth_date: string | null;
  created_at: string;
}

export interface Doctor {
  id: string;
  clinic_id: string;
  name: string;
  specialty: string;
  created_at: string;
}

export interface Appointment {
  id: string;
  clinic_id: string;
  patient_id: string;
  doctor_id: string;
  start_time: string;
  end_time: string;
  status: AppointmentStatus;
  notes: string | null;
  created_at: string;
  patient?: Pick<Patient, "id" | "name" | "phone">;
  doctor?: Pick<Doctor, "id" | "name" | "specialty">;
}

export interface Payment {
  id: string;
  clinic_id: string;
  appointment_id: string;
  amount: number;
  status: PaymentStatus;
  created_at: string;
}

export interface DashboardMetrics {
  totalPatients: number;
  appointmentsToday: number;
  upcomingAppointments: number;
  revenueThisMonth: number;
}
