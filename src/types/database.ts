export type UserRole = "admin" | "doctor" | "receptionist";
export type AppointmentStatus = "scheduled" | "confirmed" | "completed" | "canceled";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export interface Clinic {
  id: string;
  name: string;
  slug: string;
  phone: string | null;
  email: string | null;
  plan: string;
  created_at: string;
}

export interface ClinicMember {
  id: string;
  clinic_id: string;
  user_id: string;
  role: UserRole;
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
  notes: string | null;
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
  doctor_id: string | null;
  professional_id: string | null;
  service_id: string | null;
  appointment_type: string;
  start_time: string;
  end_time: string;
  status: AppointmentStatus;
  notes: string | null;
  created_at: string;
  patient?: Pick<Patient, "id" | "name" | "phone">;
  doctor?: Pick<Doctor, "id" | "name" | "specialty">;
  service?: Pick<Service, "id" | "name" | "price" | "duration_minutes">;
}

export interface Service {
  id: string;
  clinic_id: string;
  name: string;
  price: number;
  duration_minutes: number;
  created_at: string;
}

export interface Payment {
  id: string;
  clinic_id: string;
  appointment_id: string;
  amount: number;
  payment_method: string | null;
  status: PaymentStatus;
  created_at: string;
}

export interface DashboardMetrics {
  totalPatients: number;
  appointmentsToday: number;
  upcomingAppointments: number;
  revenueThisMonth: number;
  canceledAppointments: number;
}
