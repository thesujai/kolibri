import isBoolean from 'lodash/isBoolean';
import isString from 'lodash/isString';
import isArray from 'lodash/isArray';

export function coerceBoolean(value) {
  if (isString(value)) {
    return value === 'true';
  }
  return Boolean(value);
}

export function coerceNumber(value) {
  return Number(value);
}

export const validateNumber = value => {
  value = coerceNumber(value);
  return !isNaN(value) && isFinite(value);
};

export const validateBoolean = value => {
  if (isBoolean(value)) {
    return true;
  }
  if (value === 'true' || value === 'false') {
    return true;
  }
  return false;
};

/**
 * Helper function to parse space-separated values
 * @param {string} str - Space-separated string
 * @param {Function} coerceFn - Function to coerce each value
 * @returns {Array} - Array of coerced values
 */
function parseSpaceSeparated(str, coerceFn) {
  return str.trim().split(/\s+/).map(coerceFn);
}

/**
 * Coerces a value to a QTI point (array of two integers)
 * @param {*} value - The value to coerce
 * @returns {Array} - [x, y] array of integers
 */
export function coercePoint(value) {
  if (isArray(value) && value.length === 2) {
    return [parseInt(value[0], 10), parseInt(value[1], 10)];
  }
  if (isString(value)) {
    const parts = parseSpaceSeparated(value, v => parseInt(v, 10));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      return parts;
    }
  }
  throw new TypeError(`Cannot coerce ${value} to point`);
}

/**
 * Validates if a value can be coerced to a QTI point
 * @param {*} value - The value to validate
 * @returns {boolean} - True if valid point
 */
export function validatePoint(value) {
  try {
    coercePoint(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Coerces a value to a QTI pair (array of two strings)
 * @param {*} value - The value to coerce
 * @returns {Array} - [first, second] array of strings
 */
export function coercePair(value) {
  if (isArray(value) && value.length === 2) {
    return [String(value[0]), String(value[1])];
  }
  if (isString(value)) {
    const parts = parseSpaceSeparated(value, String);
    if (parts.length === 2) {
      return parts;
    }
  }
  throw new TypeError(`Cannot coerce ${value} to pair`);
}

/**
 * Validates if a value can be coerced to a QTI pair
 * @param {*} value - The value to validate
 * @returns {boolean} - True if valid pair
 */
export function validatePair(value) {
  try {
    coercePair(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Coerces a value to a QTI duration (non-negative number)
 * @param {*} value - The value to coerce
 * @returns {number} - The coerced duration value
 */
export function coerceDuration(value) {
  const num = parseFloat(value);
  if (!isNaN(num) && num >= 0) {
    return num;
  }
  throw new TypeError(`Cannot coerce ${value} to duration`);
}

/**
 * Validates if a value can be coerced to a QTI duration
 * @param {*} value - The value to validate
 * @returns {boolean} - True if valid duration
 */
export function validateDuration(value) {
  try {
    coerceDuration(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates if a value is a valid QTI file (JavaScript File object)
 * @param {*} value - The value to validate
 * @returns {boolean} - True if valid File object
 */
export function validateFile(value) {
  return value instanceof File;
}

// Base type constants
export const BASE_TYPE = {
  IDENTIFIER: 'identifier',
  BOOLEAN: 'boolean',
  INTEGER: 'integer',
  FLOAT: 'float',
  STRING: 'string',
  POINT: 'point',
  PAIR: 'pair',
  DIRECTED_PAIR: 'directedPair',
  DURATION: 'duration',
  FILE: 'file',
  URI: 'uri',
};

/**
 * Coerces a value to the specified QTI base type
 * @param {*} value - The value to coerce
 * @param {string} baseType - The QTI base type
 * @returns {*} - The coerced value
 */
export function coerceValueWithBaseType(value, baseType) {
  // Handle null/undefined/empty cases per QTI specification
  if (value === null || value === undefined || value === 'NULL' || value === '') {
    return null;
  }

  switch (baseType) {
    case BASE_TYPE.BOOLEAN:
      return coerceBoolean(value);
    case BASE_TYPE.INTEGER:
      return parseInt(value);
    case BASE_TYPE.FLOAT:
      return parseFloat(value);
    case BASE_TYPE.STRING:
    case BASE_TYPE.IDENTIFIER:
    case BASE_TYPE.URI:
      return String(value);
    case BASE_TYPE.POINT:
      return coercePoint(value);
    case BASE_TYPE.PAIR:
    case BASE_TYPE.DIRECTED_PAIR:
      return coercePair(value);
    case BASE_TYPE.DURATION:
      return coerceDuration(value);
    case BASE_TYPE.FILE:
      return value; // Files are not coerced, just passed through
    default:
      return value;
  }
}
