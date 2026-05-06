const DEFAULT_INCREMENT = 6;

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function getActivityTime(activity, camelCaseKey, snakeCaseKey) {
  return activity?.[camelCaseKey] || activity?.[snakeCaseKey];
}

function getDurationMinutes(activity) {
  const startTime = getActivityTime(activity, 'startTime', 'start_time');
  const endTime = getActivityTime(activity, 'endTime', 'end_time');

  if (!startTime || !endTime) {
    return 0;
  }

  const start = new Date(startTime);
  const end = new Date(endTime);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return 0;
  }

  return Math.max(0, Math.ceil((end.getTime() - start.getTime()) / 60000));
}

function parseMetadata(activity) {
  if (!activity?.metadata) {
    return {};
  }

  if (typeof activity.metadata === 'object') {
    return activity.metadata;
  }

  try {
    return JSON.parse(activity.metadata);
  } catch {
    return {};
  }
}

function calculateUnits(durationMinutes, increment = DEFAULT_INCREMENT) {
  const safeDuration = Math.max(0, toNumber(durationMinutes));
  const safeIncrement = Math.max(1, toNumber(increment, DEFAULT_INCREMENT));

  if (safeDuration === 0) {
    return 0;
  }

  return Math.ceil(safeDuration / safeIncrement);
}

function convertActivityToBillable(activity, ratePerUnit, increment = DEFAULT_INCREMENT) {
  const metadata = parseMetadata(activity);
  const activityType = String(activity?.type || activity?.task_type || '').toLowerCase();
  const isUnitBased = activityType === 'sms' || activityType === 'whatsapp';

  if (isUnitBased) {
    const units = Math.max(1, Math.ceil(toNumber(metadata.quantity || activity.quantity || 1, 1)));
    const safeRate = Math.max(0, toNumber(metadata.ratePerUnit, 40));

    return {
      units,
      durationMinutes: 0,
      billedMinutes: 0,
      ratePerUnit: safeRate,
      totalCost: units * safeRate,
      billingMethod: 'unit'
    };
  }

  const durationMinutes = getDurationMinutes(activity);
  const units = calculateUnits(durationMinutes, increment);
  const safeIncrement = Math.max(1, toNumber(increment, DEFAULT_INCREMENT));
  const billedMinutes = units * safeIncrement;
  const safeRate = Math.max(0, toNumber(ratePerUnit));

  return {
    units,
    durationMinutes,
    billedMinutes,
    ratePerUnit: safeRate,
    totalCost: units * safeRate,
    billingMethod: 'duration'
  };
}

module.exports = {
  calculateUnits,
  convertActivityToBillable,
  DEFAULT_INCREMENT
};
