/**
 * Date formatting utilities
 */

export function formatTimeRelative(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  
  const isToday = date.getDate() === now.getDate() && 
                  date.getMonth() === now.getMonth() && 
                  date.getFullYear() === now.getFullYear();
                  
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow = date.getDate() === tomorrow.getDate() && 
                     date.getMonth() === tomorrow.getMonth() && 
                     date.getFullYear() === tomorrow.getFullYear();
                     
  const timeStr = date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });

  if (isToday) return `今天 ${timeStr}`;
  if (isTomorrow) return `明天 ${timeStr}`;
  
  return `${date.getMonth() + 1}月${date.getDate()}日 ${timeStr}`;
}

export function formatDateFull(timestamp: number): string {
  const date = new Date(timestamp);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const timeStr = date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${yyyy}-${mm}-${dd} ${timeStr}`;
}

export function formatForInput(timestamp: number): string {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

export function formatEventTimeRange(startTs: number, endTs: number): string {
  const start = new Date(startTs);
  const end = new Date(endTs);
  const startStr = start.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });
  const endStr = end.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${startStr} - ${endStr}`;
}

export function getEventStartHourDecimal(timestamp: number): number {
  const d = new Date(timestamp);
  return d.getHours() + d.getMinutes() / 60;
}

export function getEventEndHourDecimal(timestamp: number): number {
  const d = new Date(timestamp);
  return d.getHours() + d.getMinutes() / 60;
}

export function getEventDay(timestamp: number): number {
  return new Date(timestamp).getDate();
}

export function buildEventTimestamp(day: number, hourDecimal: number, year = new Date().getFullYear(), month = new Date().getMonth()): number {
  const hours = Math.floor(hourDecimal);
  const minutes = (hourDecimal % 1) * 60;
  return new Date(year, month, day, hours, minutes).getTime();
}
