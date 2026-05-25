/** 简易 .ics 解析器 - 只解析 VEVENT */

export interface ParsedIcsEvent {
  uid: string;
  title: string;
  description?: string;
  start_at: string;
  end_at?: string;
  rrule?: string;
  location?: string;
  category?: string;
  exdates?: string;
}

/** 解析 .ics 文件内容为事件列表 */
export function parseIcs(content: string): ParsedIcsEvent[] {
  const events: ParsedIcsEvent[] = [];
  const lines = unfoldLines(content.split(/\r?\n/));

  let current: Partial<ParsedIcsEvent> | null = null;
  let exdates: string[] = [];

  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') {
      current = {};
      exdates = [];
    } else if (line === 'END:VEVENT') {
      if (current?.uid && current?.start_at) {
        events.push({
          uid: current.uid,
          title: current.title || '无标题',
          description: current.description,
          start_at: current.start_at,
          end_at: current.end_at,
          rrule: current.rrule,
          location: current.location,
          category: current.category,
          exdates: exdates.length > 0 ? JSON.stringify(exdates) : undefined,
        });
      }
      current = null;
    } else if (current) {
      const [rawKey, ...valueParts] = line.split(':');
      const value = valueParts.join(':'); // 值中可能有冒号
      const key = rawKey.split(';')[0]; // 去掉 TZID 等参数

      switch (key) {
        case 'UID':
          current.uid = value;
          break;
        case 'SUMMARY':
          current.title = unescapeText(value);
          break;
        case 'DESCRIPTION':
          current.description = unescapeText(value);
          break;
        case 'DTSTART':
          current.start_at = parseIcsDate(value);
          break;
        case 'DTEND':
          current.end_at = parseIcsDate(value);
          break;
        case 'RRULE':
          current.rrule = value;
          break;
        case 'LOCATION':
          current.location = unescapeText(value);
          break;
        case 'CATEGORIES':
          current.category = value.split(',')[0].trim();
          break;
        case 'EXDATE':
          // EXDATE 可能有多个日期，逗号分隔
          const dates = value.split(',');
          for (const d of dates) {
            const parsed = parseIcsDate(d.trim());
            if (parsed) {
              exdates.push(parsed.split('T')[0]); // 只取日期部分
            }
          }
          break;
      }
    }
  }

  return events;
}

/** 展开折叠行（以空格或 tab 开头的行是上一行的延续） */
function unfoldLines(lines: string[]): string[] {
  const result: string[] = [];
  for (const line of lines) {
    if (line.startsWith(' ') || line.startsWith('\t')) {
      if (result.length > 0) {
        result[result.length - 1] += line.slice(1);
      }
    } else {
      result.push(line);
    }
  }
  return result;
}

/** 解析 iCal 日期格式 */
function parseIcsDate(value: string): string {
  // 去掉 TZID 等参数，只取日期部分
  // 格式可能是: DTSTART;TZID=Asia/Shanghai:20260520T080000
  // 或者: DTSTART:20260520T080000Z
  // 或者: DTSTART;VALUE=DATE:20260520
  const dateStr = value.includes(':') ? value.split(':').pop()! : value;

  // 解析 YYYYMMDDTHHMMSS 或 YYYYMMDD
  const match = dateStr.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2}))?Z?$/);
  if (!match) return new Date().toISOString();

  const [, year, month, day, hour = '0', min = '0', sec = '0'] = match;
  const isUtc = dateStr.endsWith('Z');

  if (isUtc) {
    return new Date(Date.UTC(
      parseInt(year), parseInt(month) - 1, parseInt(day),
      parseInt(hour), parseInt(min), parseInt(sec)
    )).toISOString();
  } else {
    // 本地时间
    return new Date(
      parseInt(year), parseInt(month) - 1, parseInt(day),
      parseInt(hour), parseInt(min), parseInt(sec)
    ).toISOString();
  }
}

/** 反转义 iCal 文本 */
function unescapeText(text: string): string {
  return text
    .replace(/\\n/g, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\');
}
