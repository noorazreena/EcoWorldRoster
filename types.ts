
export enum Rank {
  SJN = 'SJN',
  KPL = 'KPL',
  KONST = 'KONST'
}

export enum ShiftCode {
  S = 'S',   // Siang (Day)
  M = 'M',   // Malam (Night)
  O = 'O',   // Off
  T = 'T',   // Training (Kursus) - Changed from K
  AL = 'AL', // Annual Leave
  CL = 'CL', // Cuti Kecemasan
  EL = 'EL', // Cuti Sakit
  HL = 'HL', // Hospital Leave
  PH = 'PH', // Public Holiday
  RDOT = 'RDOT', // Rest Day Overtime
  CFPH = 'CFPH', // Carry Forward Public Holiday
  ML = 'ML', // Maternity Leave
  PL = 'PL', // Paternity Leave
  MIA = 'MIA' // Missing In Action
}

export interface Staff {
  id: string;
  bodyNumber: string;
  rank: Rank;
  name: string;
  walkieTalkie?: string; 
  vehicle?: string; 
}

export interface DayStatus {
  date: number; 
  month: number; 
  year: number;
  dayOfWeek: number; 
  code: ShiftCode;
  originalCode?: ShiftCode; 
  otHours: number | null; 
  mealAllowance: number; 
  isRestDayOT?: boolean; 
}

export interface StaffRoster {
  staff: Staff;
  days: DayStatus[];
  summary: {
    workdays: number;
    restdays: number;
    rdot: number; 
    overtimeHours: number;
    publicHolidays: number;
    cfph: number; 
    meals: number; 
  };
  conflicts: string[]; 
}

export interface DailyStrength {
  day: number;
  month: number;
  shiftSiang: number; 
  shiftMalam: number; 
  off: number; 
  leave: number; 
  seniorOnDuty: boolean;
}

export interface RosterOverride {
  staffId: string;
  year: number;
  month: number;
  day: number;
  type: 'NO_OT' | 'LEAVE';
  leaveType?: ShiftCode; 
  category?: 'PLANNED' | 'UNPLANNED'; 
}

export interface DailyDutyDetails {
  daySupervisor?: string; 
  nightSupervisor?: string; 
  
  dayTeam?: string[]; 
  nightTeam?: string[]; 
  officeAdmin?: string; 

  dayVehicles: {
    mpv1: string;
    mpv2: string;
    mpv3?: string;
    adminMpv?: string; 
    adminWt?: string; 
    wt1: string;
    wt2: string;
    wt3?: string;
  };
  nightVehicles: {
    mpv1: string;
    mpv2: string;
    mpv3?: string;
    wt1: string;
    wt2: string;
    wt3?: string;
  };
  notes: string[]; 
  
  offDayStaffNames?: string[]; 
  leaveStaffNames?: string[]; 
  
  preparation?: ApprovalRecord; 
  approval?: ApprovalRecord;    
}

export interface ApprovalRecord {
  approverName: string;
  approverRank: string;
  date: string;
  isApproved: boolean;
}
