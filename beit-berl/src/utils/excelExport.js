// src/utils/excelExport.js - Updated version (remove async/await)
import * as XLSX from 'xlsx';

/**
 * Export users data to Excel file (synchronous version)
 * @param {Array} users - Array of user objects to export
 * @param {Function} getOrganizationNames - Function to get organization names from IDs
 * @param {Function} formatDate - Function to format dates
 * @param {Object} options - Export options
 * @param {string} options.filename - Custom filename (optional)
 * @param {boolean} options.isFiltered - Whether data is filtered
 * @param {number} options.totalCount - Total count before filtering
 */
export const exportUsersToExcel = (users, getOrganizationNames, formatDate, options = {}) => {
  try {
    
    if (!users || users.length === 0) {
      throw new Error('No data to export');
    }

    // Prepare data for export
    const exportData = users.map((user, index) => ({
      '#': index + 1,
      'שם פרטי': user.firstName || '',
      'שם משפחה': user.lastName || '',
      'שם מלא': `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'N/A',
      'דוא"ל': user.email || '',
      'טלפון': user.phoneNumber || '',
      'תפקיד': user.role || '',
      'ארגונים': getOrganizationNames(user.orgId),
      'סטטוס': user.status || '',
      'תאריך יצירה': formatDate(user.createdAt),
    }));
    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // Set column widths for better readability
    const columnWidths = [
      { wch: 5 },   // #
      { wch: 15 },  // שם פרטי
      { wch: 15 },  // שם משפחה
      { wch: 25 },  // שם מלא
      { wch: 30 },  // דוא"ל
      { wch: 15 },  // טלפון
      { wch: 12 },  // תפקיד
      { wch: 30 },  // ארגונים
      { wch: 12 },  // סטטוס
      { wch: 15 },  // תאריך יצירה
      { wch: 15 },  // מזהה משתמש
      { wch: 20 }   // מזהה מסמך
    ];
    worksheet['!cols'] = columnWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Users Data');

    // Generate filename
    const filename = generateExcelFilename(users.length, options);

    // Export file
    XLSX.writeFile(workbook, filename);
    
    // Return export info for success message
    return {
      success: true,
      filename,
      exportedCount: users.length,
      message: `נתונים יוצאו בהצלחה! הקובץ נשמר בשם: ${filename}`
    };

  } catch (error) {
    console.error('❌ Error exporting to Excel:', error);
    return {
      success: false,
      error: error.message,
      message: `שגיאה בייצוא הנתונים: ${error.message}`
    };
  }
};

/**
 * Generate filename for Excel export
 * @param {number} count - Number of records being exported
 * @param {Object} options - Options object
 * @returns {string} Generated filename
 */
const generateExcelFilename = (count, options = {}) => {
  const currentDate = new Date().toLocaleDateString('he-IL').replace(/\//g, '-');
  
  if (options.filename) {
    return options.filename.endsWith('.xlsx') ? options.filename : `${options.filename}.xlsx`;
  }

  const filterInfo = options.isFiltered ? `_filtered_${count}` : '_all';
  return `users_data_${currentDate}${filterInfo}.xlsx`;
};