
import { PUBLIC_HOLIDAYS_2026 } from '../constants';
import { StaffRoster, ShiftCode, DayStatus, Staff, Rank, DailyStrength, RosterOverride } from '../types';

export const generateRoster = (targetYear: number, targetMonth: number, overrides: RosterOverride[] = [], currentStaffList: Staff[]): StaffRoster[] => {
  const startDate = new Date(targetYear, targetMonth - 1, 26);
  const endDate = new Date(targetYear, targetMonth, 25);
  
  const BASE_PATTERN = [
    ShiftCode.S, ShiftCode.S, ShiftCode.S, ShiftCode.S, ShiftCode.S, ShiftCode.S, ShiftCode.O,
    ShiftCode.M, ShiftCode.M, ShiftCode.M, ShiftCode.M, ShiftCode.M, ShiftCode.M, ShiftCode.O
  ];

  const isFixedDayStaff = (staff: Staff) => 
    staff.rank === Rank.SJN || staff.name.includes('NOORAZREENA');

  const isPublicHoliday = (d: number, m: number) => {
    return !!PUBLIC_HOLIDAYS_2026[`${m}-${d}`];
  };

  const mod = (n: number, m: number) => ((n % m) + m) % m;
  const monthsSinceBase = (targetYear - 2025) * 12 + targetMonth;
  const quarterBlock = Math.floor(monthsSinceBase / 3);

  const rosterDates: Date[] = [];
  const current = new Date(startDate);
  while (current <= endDate) {
    rosterDates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  const rosters = currentStaffList.map((staff, staffIndex) => {
    const days: DayStatus[] = [];
    const staggerOffset = staffIndex * 2;
    const rotationShift = isFixedDayStaff(staff) ? 0 : quarterBlock;

    rosterDates.forEach(dateObj => {
      const year = dateObj.getFullYear();
      const month = dateObj.getMonth();
      const day = dateObj.getDate();
      const dayOfWeek = dateObj.getDay();
      
      let code = ShiftCode.S;

      if (staff.rank === Rank.SJN) {
        if (dayOfWeek === 6) { code = ShiftCode.O; } else { code = ShiftCode.S; }
      } else if (staff.name.includes('NOORAZREENA')) {
        if (dayOfWeek === 0) { code = ShiftCode.O; } else { code = ShiftCode.S; }
      } else {
        const globalDayIndex = Math.floor(dateObj.getTime() / 86400000);
        const patternIndex = mod(globalDayIndex + staggerOffset - rotationShift, 14);
        code = BASE_PATTERN[patternIndex];
      }

      const leaveOverride = overrides.find(o => 
        o.staffId === staff.id && 
        o.year === year && 
        o.month === month && 
        o.day === day && 
        o.type === 'LEAVE'
      );

      if (leaveOverride && leaveOverride.leaveType) {
        code = leaveOverride.leaveType;
      } else {
        if (isFixedDayStaff(staff) && code === ShiftCode.M) {
          code = ShiftCode.S;
        }
      }

      days.push({
        date: day,
        month: month,
        year: year,
        dayOfWeek,
        code,
        otHours: null,
        mealAllowance: 0,
        isRestDayOT: false
      });
    });

    return { staff, days, summary: { workdays: 0, restdays: 0, rdot: 0, overtimeHours: 0, publicHolidays: 0, cfph: 0, meals: 0 }, conflicts: [] as string[] };
  });

  rosters.forEach(r => {
    const offDaysIndices = r.days.map((d, i) => d.code === ShiftCode.O ? i : -1).filter(i => i !== -1);
    if (offDaysIndices.length > 4) {
      const daysToRemove = offDaysIndices.length - 4;
      for (let i = 0; i < daysToRemove; i++) {
        const dayIndex = offDaysIndices[offDaysIndices.length - 1 - i];
        let newCode = ShiftCode.S;
        if (dayIndex > 0) {
           const prevCode = r.days[dayIndex - 1].code;
           newCode = (prevCode === ShiftCode.M) ? ShiftCode.M : ShiftCode.S;
        }
        if (isFixedDayStaff(r.staff)) {
          newCode = ShiftCode.S;
        }
        r.days[dayIndex].code = newCode;
      }
    }
  });

  rosters.forEach(r => {
    for (let i = 0; i < r.days.length - 1; i++) {
      const currentDay = r.days[i];
      if (isPublicHoliday(currentDay.date, currentDay.month) && currentDay.code === ShiftCode.O) {
        const nextDay = r.days[i+1];
        nextDay.originalCode = nextDay.code;
        nextDay.code = ShiftCode.CFPH;
      }
    }
  });

  rosters.forEach(r => {
    let workdays = 0;
    let restdays = 0;
    let rdot = 0;
    let overtimeHours = 0;
    let publicHolidays = 0;
    let cfph = 0;
    let totalMealAllowance = 0;
    let consecutiveWorkDays = 0;

    r.days.forEach((day, index) => {
      const hasNoOT = overrides.some(o => 
        o.staffId === r.staff.id && o.year === day.year && o.month === day.month && o.day === day.date && o.type === 'NO_OT'
      );

      const isPH = isPublicHoliday(day.date, day.month);
      let effectiveCode = day.code;
      if (day.code === ShiftCode.CFPH && day.originalCode) {
        effectiveCode = day.originalCode;
      }

      const isWorkingShift = day.code === ShiftCode.S || day.code === ShiftCode.M || (day.code === ShiftCode.CFPH && effectiveCode !== ShiftCode.O);

      if (isWorkingShift) {
        workdays++;
        consecutiveWorkDays++;
        
        if (consecutiveWorkDays > 10) {
           if (!r.conflicts.includes("Long Streak (>10 days)")) {
             r.conflicts.push("Long Streak (>10 days)");
           }
        }

        if (day.isRestDayOT) rdot++;
        if (isPH) publicHolidays++;
        
        if (hasNoOT) {
          day.otHours = 0;
        } else {
          day.otHours = 4; 
          overtimeHours += 4;
        }

        if (hasNoOT) {
          day.mealAllowance = 0;
        } else {
          if (day.code === ShiftCode.S) {
             const isWeekend = day.dayOfWeek === 0 || day.dayOfWeek === 6; 
             day.mealAllowance = isWeekend ? 20 : 10;
          } 
          else if (day.code === ShiftCode.M) {
             day.mealAllowance = 10;
          }
          else if (day.code === ShiftCode.CFPH) {
             day.mealAllowance = 10;
          }
          else {
             day.mealAllowance = 10;
          }
        }
        totalMealAllowance += day.mealAllowance;

      } else {
        consecutiveWorkDays = 0;
        if (day.code === ShiftCode.O) restdays++;
        else if (day.code === ShiftCode.PH) publicHolidays++;
      }

      if ((day.code === ShiftCode.O || day.code === ShiftCode.PH) && (day.otHours && day.otHours > 0) && !day.isRestDayOT) {
         if (!r.conflicts.includes("Invalid OT on Rest Day")) {
             r.conflicts.push("Invalid OT on Rest Day");
         }
      }

      if (day.code === ShiftCode.CFPH) cfph++;
    });

    if (restdays < 4) {
      r.conflicts.push("Low Rest (<4 days)");
    }

    r.summary = { workdays, restdays, rdot, overtimeHours, publicHolidays, cfph, meals: totalMealAllowance };
  });

  return rosters;
};

export const calculateDailyStrength = (rosters: StaffRoster[]): DailyStrength[] => {
  if (rosters.length === 0) return [];
  const numDays = rosters[0].days.length;
  const strength: DailyStrength[] = [];

  for (let i = 0; i < numDays; i++) {
    let sCount = 0;
    let mCount = 0;
    let oCount = 0;
    let lCount = 0;
    let seniorPresent = false;
    const dateInfo = rosters[0].days[i];

    rosters.forEach(r => {
      const dayData = r.days[i];
      let codeToCheck = dayData.code;
      if (dayData.code === ShiftCode.CFPH && dayData.originalCode) {
        codeToCheck = dayData.originalCode;
      }

      if (codeToCheck === ShiftCode.S) sCount++;
      if (codeToCheck === ShiftCode.M) mCount++;
      if (codeToCheck === ShiftCode.O) oCount++;
      if ([ShiftCode.AL, ShiftCode.CL, ShiftCode.EL, ShiftCode.HL, ShiftCode.T, ShiftCode.PH, ShiftCode.ML, ShiftCode.PL, ShiftCode.MIA].includes(codeToCheck)) lCount++;

      if ((codeToCheck === ShiftCode.S || codeToCheck === ShiftCode.M) && 
          (r.staff.rank === Rank.SJN || r.staff.rank === Rank.KPL)) {
        seniorPresent = true;
      }
    });

    strength.push({
      day: dateInfo.date,
      month: dateInfo.month,
      shiftSiang: sCount,
      shiftMalam: mCount,
      off: oCount,
      leave: lCount,
      seniorOnDuty: seniorPresent
    });
  }
  return strength;
};
