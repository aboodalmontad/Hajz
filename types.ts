export enum ClerkStatus {
  AVAILABLE = 'متاح',
  BUSY = 'مشغول',
  OFFLINE = 'غير متصل',
}

export enum View {
    KIOSK = 'الكشك',
    DISPLAY = 'الشاشة الرئيسية',
    CLERK = 'واجهة الموظف',
    MANAGEMENT = 'الإدارة والتحكم'
}

export interface Customer {
  id: number;
  ticketNumber: string;
  arrivalTime: number; // timestamp
}

export interface Window {
  id: number;
  number: number;
}

export interface Clerk {
  id: number;
  name: string;
  username: string;
  password: string;
  windowId: number | null;
  status: ClerkStatus;
  customersServed: number;
  totalServiceTime: number; // in seconds
  currentCustomerId: number | null;
}

export interface ServingInfo {
    clerk: Clerk;
    customer: Customer;
}
