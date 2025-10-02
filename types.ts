export enum ClerkStatus {
  AVAILABLE = 'متاح',
  BUSY = 'مشغول',
  OFFLINE = 'غير متصل',
}

export enum View {
    KIOSK = 'الكشك',
    DISPLAY = 'الشاشة الرئيسية',
    CLERK = 'واجهة الموظف',
    ADMIN = 'لوحة التحكم',
    MANAGEMENT = 'الإدارة'
}

export interface Customer {
  id: number;
  ticketNumber: string;
  arrivalTime: number; // timestamp
}

export interface Clerk {
  id: number;
  name: string;
  windowNumber: number;
  status: ClerkStatus;
  customersServed: number;
  totalServiceTime: number; // in seconds
  currentCustomerId: number | null;
}

export interface ServingInfo {
    clerk: Clerk;
    customer: Customer;
}