
import { Rank, Staff, ShiftCode } from './types';

export const STAFF_LIST: Staff[] = [
  { id: '101544', bodyNumber: '74722', rank: Rank.SJN, name: 'MOHD KHAIRUL AZWANDY', walkieTalkie: 'N01', vehicle: 'WB 2525 V' },
  { id: '101509', bodyNumber: '94340', rank: Rank.KPL, name: 'KALAIARASU', walkieTalkie: 'N02', vehicle: 'WB 7324 V' },
  { id: '101159', bodyNumber: '48805', rank: Rank.KONST, name: 'AHMAD ZAKI', walkieTalkie: 'N03', vehicle: 'WB 2552 T' },
  { id: '100983', bodyNumber: '84103', rank: Rank.KONST, name: 'MOHD NURUL SHAZRIEN', walkieTalkie: 'N04', vehicle: 'WB 4140 V' },
  { id: '101695', bodyNumber: '83185', rank: Rank.KONST, name: 'ASRUL', walkieTalkie: 'N05', vehicle: 'WB 4760 U' },
  { id: '102703', bodyNumber: '91202', rank: Rank.KONST, name: 'MUHAMMAD AFIQ', walkieTalkie: 'N06', vehicle: 'WB 4795 U' },
  { id: '101503', bodyNumber: '94327', rank: Rank.KONST, name: 'VILVANATH', walkieTalkie: 'N07', vehicle: 'WB 4753 U' },
  { id: '101787', bodyNumber: '7835', rank: Rank.KONST, name: 'NOORAZREENA', walkieTalkie: 'N08', vehicle: '' },
];

export const SHIFT_COLORS: Record<ShiftCode, string> = {
  [ShiftCode.S]: 'bg-blue-200 text-blue-900 border-blue-300', 
  [ShiftCode.M]: 'bg-red-200 text-red-900 border-red-300',    
  [ShiftCode.O]: 'bg-yellow-200 text-yellow-900 border-yellow-300', 
  [ShiftCode.T]: 'bg-purple-200 text-purple-900 border-purple-300', 
  [ShiftCode.AL]: 'bg-pink-200 text-pink-900 border-pink-300', 
  [ShiftCode.CL]: 'bg-pink-300 text-pink-900 border-pink-400',
  [ShiftCode.EL]: 'bg-pink-300 text-pink-900 border-pink-400',
  [ShiftCode.HL]: 'bg-pink-400 text-pink-900 border-pink-500', 
  [ShiftCode.PH]: 'bg-green-200 text-green-900 border-green-300',
  [ShiftCode.RDOT]: 'bg-orange-200 text-orange-900 border-orange-300', 
  [ShiftCode.CFPH]: 'bg-green-100 text-green-800 border-green-200', 
  [ShiftCode.ML]: 'bg-fuchsia-200 text-fuchsia-900 border-fuchsia-300', 
  [ShiftCode.PL]: 'bg-cyan-200 text-cyan-900 border-cyan-300', 
  [ShiftCode.MIA]: 'bg-gray-800 text-white border-gray-900', 
};

export const DAYS_OF_WEEK = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export const MONTH_NAMES = [
  "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
  "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"
];

export const PUBLIC_HOLIDAYS_2026: Record<string, string> = {
  "0-1": "New Year's Day",
  "1-1": "Thaipusam",
  "1-2": "Thaipusam Holiday",
  "1-17": "Chinese New Year",
  "1-18": "Chinese New Year Holiday",
  "2-7": "Nuzul Al-Quran",
  "2-21": "Hari Raya Aidilfitri",
  "2-22": "Hari Raya Aidilfitri Holiday",
  "2-23": "Hari Raya Aidilfitri Holiday",
  "4-1": "Labour Day",
  "4-27": "Hari Raya Haji",
  "4-31": "Wesak Day",
  "5-1": "Agong's Birthday & Wesak Holiday",
  "5-17": "Awal Muharram",
  "6-7": "Georgetown World Heritage City Day",
  "6-11": "Penang Governor's Birthday",
  "7-25": "Prophet Muhammad's Birthday",
  "7-31": "Merdeka Day",
  "8-16": "Malaysia Day",
  "10-8": "Deepavali",
  "10-9": "Deepavali Holiday",
  "11-25": "Christmas Day"
};
