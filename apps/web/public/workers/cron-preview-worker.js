/* global self */
"use strict";

const MAXIMUM_HORIZON_MINUTES = 366 * 24 * 60;
const MAXIMUM_ITERATIONS = 600000;
const MAXIMUM_OCCURRENCES = 10;

const integer = (value) => Number.isInteger(value);

const boundedValues = (value, minimum, maximum, maximumLength) => {
  if (!Array.isArray(value) || value.length < 1 || value.length > maximumLength) throw new Error("invalid_preview_schedule");
  const unique = [...new Set(value)];
  if (!unique.every((item) => integer(item) && item >= minimum && item <= maximum)) throw new Error("invalid_preview_schedule");
  return unique;
};

const validatedRequest = (request) => {
  if (!request || request.kind !== "preview" || !integer(request.requestId)) throw new Error("invalid_preview_request");
  if (!Number.isFinite(request.fromTimestamp)) throw new Error("invalid_preview_start");
  if (!integer(request.maximumOccurrences) || request.maximumOccurrences < 1 || request.maximumOccurrences > MAXIMUM_OCCURRENCES) throw new Error("invalid_preview_limits");
  if (!integer(request.horizonMinutes) || request.horizonMinutes < 1 || request.horizonMinutes > MAXIMUM_HORIZON_MINUTES) throw new Error("invalid_preview_limits");
  if (!integer(request.maximumIterations) || request.maximumIterations < 1 || request.maximumIterations > MAXIMUM_ITERATIONS) throw new Error("invalid_preview_limits");
  const schedule = request.schedule;
  if (!schedule || typeof schedule.dayOfMonthUnrestricted !== "boolean" || typeof schedule.dayOfWeekUnrestricted !== "boolean") throw new Error("invalid_preview_schedule");
  return {
    requestId: request.requestId,
    fromTimestamp: request.fromTimestamp,
    maximumOccurrences: request.maximumOccurrences,
    horizonMinutes: request.horizonMinutes,
    maximumIterations: Math.min(request.maximumIterations, request.horizonMinutes, MAXIMUM_ITERATIONS),
    schedule: {
      minute: boundedValues(schedule.minute, 0, 59, 60),
      hour: boundedValues(schedule.hour, 0, 23, 24),
      dayOfMonth: boundedValues(schedule.dayOfMonth, 1, 31, 31),
      month: boundedValues(schedule.month, 1, 12, 12),
      dayOfWeek: boundedValues(schedule.dayOfWeek, 0, 6, 7),
      dayOfMonthUnrestricted: schedule.dayOfMonthUnrestricted,
      dayOfWeekUnrestricted: schedule.dayOfWeekUnrestricted,
    },
  };
};

const contains = (values, value) => values.includes(value);

const matchesSchedule = (date, schedule) => {
  if (!contains(schedule.minute, date.getUTCMinutes())) return false;
  if (!contains(schedule.hour, date.getUTCHours())) return false;
  if (!contains(schedule.month, date.getUTCMonth() + 1)) return false;

  const dayOfMonthMatches = contains(schedule.dayOfMonth, date.getUTCDate());
  const dayOfWeekMatches = contains(schedule.dayOfWeek, date.getUTCDay());
  if (schedule.dayOfMonthUnrestricted && schedule.dayOfWeekUnrestricted) return true;
  if (schedule.dayOfMonthUnrestricted) return dayOfWeekMatches;
  if (schedule.dayOfWeekUnrestricted) return dayOfMonthMatches;
  return dayOfMonthMatches || dayOfWeekMatches;
};

self.onmessage = (event) => {
  let requestId = Number.isInteger(event.data?.requestId) ? event.data.requestId : -1;
  try {
    const request = validatedRequest(event.data);
    requestId = request.requestId;
    const cursor = new Date(request.fromTimestamp);
    if (Number.isNaN(cursor.valueOf())) throw new Error("invalid_preview_start");
    cursor.setUTCSeconds(0, 0);
    cursor.setUTCMinutes(cursor.getUTCMinutes() + 1);

    const occurrences = [];
    let checkedMinutes = 0;
    while (
      checkedMinutes < request.horizonMinutes
      && checkedMinutes < request.maximumIterations
      && occurrences.length < request.maximumOccurrences
    ) {
      if (matchesSchedule(cursor, request.schedule)) occurrences.push(cursor.toISOString());
      cursor.setUTCMinutes(cursor.getUTCMinutes() + 1);
      checkedMinutes += 1;
    }

    self.postMessage({
      kind: "result",
      ok: true,
      requestId,
      occurrences,
      checkedMinutes,
      truncatedByHorizon: occurrences.length < request.maximumOccurrences,
    });
  } catch (error) {
    self.postMessage({
      kind: "result",
      ok: false,
      requestId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

self.postMessage({ kind: "ready" });
