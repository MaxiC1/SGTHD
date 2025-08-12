/**
 * Utility functions for handling dates and timezone issues
 */

/**
 * Converts a date string from HTML5 date input to a consistent format
 * that avoids timezone issues by treating it as local time
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @returns {string} - ISO string without timezone conversion
 */
export function normalizeDateForStorage(dateString) {
  if (!dateString) return null;
  
  // Create date at local midnight to avoid timezone issues
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  
  // Return as ISO string without timezone conversion
  return date.toISOString().split('T')[0];
}

/**
 * Formats a date for display, handling timezone issues
 * @param {string|Date} date - Date string or Date object
 * @returns {string} - Formatted date string
 */
export function formatDateForDisplay(date) {
  if (!date) return '';
  
  let dateObj;
  if (typeof date === 'string') {
    dateObj = new Date(date);
  } else {
    dateObj = date;
  }
  
  // Ensure we're working with local time
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Gets today's date in YYYY-MM-DD format for date inputs
 * @returns {string} - Today's date in YYYY-MM-DD format
 */
export function getTodayDateString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Creates a Date object from a date string, ensuring local timezone
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @returns {Date} - Date object at local midnight
 */
export function createLocalDate(dateString) {
  if (!dateString) return null;
  
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}
