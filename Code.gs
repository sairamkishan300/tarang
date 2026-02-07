/**
 * Tarang#1 Event Registration System - Google Apps Script Backend
 * 
 * This script provides a web API for student registration and ticket verification
 * for the musical evening event on March 7.
 * 
 * Deploy as Web App with:
 * - Execute as: Me
 * - Who has access: Anyone
 */

// Sheet names (constants)
const SHEET_REGISTRATIONS = 'REGISTRATIONS';
const SHEET_BANK_CSV = 'BANK_CSV';
const SHEET_FINAL_VERIFIED = 'FINAL_VERIFIED';

// Ticket price
const TICKET_PRICE = 85;

/**
 * Handle GET requests
 */
function doGet(e) {
  const action = e.parameter.action;
  
  try {
    switch(action) {
      case 'getTicketByPhone':
        return jsonResponse(getTicketByPhone(e.parameter.phone));
      
      case 'getStats':
        return jsonResponse(getStats());
      
      case 'getVerifiedList':
        return jsonResponse(getVerifiedList());
      
      case 'getUnverifiedList':
        return jsonResponse(getUnverifiedList());
      
      default:
        return jsonResponse({ error: 'Invalid action' }, 400);
    }
  } catch (error) {
    return jsonResponse({ error: error.toString() }, 500);
  }
}

/**
 * Handle POST requests
 */
function doPost(e) {
  const action = e.parameter.action;
  
  try {
    let data;
    if (e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    }
    
    switch(action) {
      case 'registerStudent':
        return jsonResponse(registerStudent(data));
      
      case 'verifyTicket':
        return jsonResponse(verifyTicket(e.parameter.utr || data.utr));
      
      default:
        return jsonResponse({ error: 'Invalid action' }, 400);
    }
  } catch (error) {
    return jsonResponse({ error: error.toString() }, 500);
  }
}

/**
 * Register a new student
 * @param {Object} data - Student registration data
 * @returns {Object} Success/error response
 */
function registerStudent(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_REGISTRATIONS);
  
  // Validate required fields
  if (!data.Name || !data.RollNumber || !data.Year || !data.Phone || !data.UTR) {
    return { success: false, error: 'Missing required fields' };
  }
  
  // Validate phone number format (exactly 10 digits)
  const phoneStr = data.Phone.toString().trim();
  if (!/^\d{10}$/.test(phoneStr)) {
    return { 
      success: false, 
      error: 'Invalid phone number. Please enter exactly 10 digits (e.g., 9876543210).' 
    };
  }
  
  // Validate UTR format (exactly 12 digits)
  const utrStr = data.UTR.toString().trim();
  if (!/^\d{12}$/.test(utrStr)) {
    return { 
      success: false, 
      error: 'Invalid UPI Transaction ID. Please enter exactly 12 digits from your payment receipt.' 
    };
  }
  
  // Check for duplicates
  const dataRange = sheet.getDataRange();
  const values = dataRange.getValues();
  
  for (let i = 1; i < values.length; i++) {
    // Check duplicate UTR (prevents duplicate payments)
    if (values[i][4] && values[i][4].toString().trim() === utrStr) {
      const existingName = values[i][0];
      const existingStatus = values[i][6];
      return { 
        success: false, 
        error: `This UPI Transaction ID has already been used by ${existingName} (Status: ${existingStatus}). Each payment can only be used once. Please make a new payment or contact support if this is an error.`
      };
    }
    
    // Check duplicate phone number
    if (values[i][3] && values[i][3].toString().trim() === phoneStr) {
      const existingName = values[i][0];
      const existingUTR = values[i][4];
      return { 
        success: false, 
        error: `This phone number is already registered under ${existingName} (UTR: ${existingUTR}). If this is your number, retrieve your ticket or contact support.`
      };
    }
  }
  
  // Add new registration
  sheet.appendRow([
    data.Name,
    data.RollNumber,
    data.Year,
    phoneStr,
    utrStr,
    '', // TicketID (empty initially)
    'PENDING' // Status
  ]);
  
  return { 
    success: true, 
    message: 'Registration submitted successfully. Status: PENDING' 
  };
}

/**
 * Get ticket information by phone number
 * @param {string} phone - Phone number to search
 * @returns {Object} Ticket information or error
 */
function getTicketByPhone(phone) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_REGISTRATIONS);
  const dataRange = sheet.getDataRange();
  const values = dataRange.getValues();
  
  // Search for phone number (column index 3)
  for (let i = 1; i < values.length; i++) {
    if (values[i][3].toString() === phone.toString()) {
      return {
        success: true,
        Name: values[i][0],
        RollNumber: values[i][1],
        Year: values[i][2],
        Phone: values[i][3],
        UTR: values[i][4],
        TicketID: values[i][5] || null,
        Status: values[i][6]
      };
    }
  }
  
  return { success: false, error: 'Phone number not found' };
}

/**
 * Verify a ticket using UTR
 * Now includes amount and payment status validation
 * @param {string} utr - UTR number to verify
 * @returns {Object} Verification result
 */
function verifyTicket(utr) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const registrationsSheet = ss.getSheetByName(SHEET_REGISTRATIONS);
  const bankSheet = ss.getSheetByName(SHEET_BANK_CSV);
  const verifiedSheet = ss.getSheetByName(SHEET_FINAL_VERIFIED);
  
  // Check if UTR already verified in FINAL_VERIFIED
  const verifiedData = verifiedSheet.getDataRange().getValues();
  for (let i = 1; i < verifiedData.length; i++) {
    if (verifiedData[i][1].toString() === utr.toString()) { // UTR column (index 1)
      return { 
        success: false, 
        status: 'ALREADY_USED',
        message: 'This UTR has already been verified',
        ticketID: verifiedData[i][0]
      };
    }
  }
  
  // Check if UTR exists in BANK_CSV and validate payment
  const bankData = bankSheet.getDataRange().getValues();
  let paymentFound = false;
  let paymentAmount = 0;
  
  // HDFC Bank CSV columns: 
  // A: Date, B: Narration, C: Chq./Ref.No.(UTR), D: Value Dt, E: Withdrawal, F: Deposit Amt, G: Balance
  for (let i = 1; i < bankData.length; i++) {
    // Skip empty rows
    if (!bankData[i][0]) continue;
    
    const rowUTR = bankData[i][2] ? bankData[i][2].toString().trim() : ''; // Column C (index 2) - Chq./Ref.No.
    
    // Check if this row matches the UTR we're looking for
    if (rowUTR === utr.toString().trim()) {
      // Column E (index 4) = Withdrawal, Column F (index 5) = Deposit
      const withdrawalAmt = bankData[i][4];
      const depositAmt = bankData[i][5];
      
      // We only care about deposits (credits) - column F
      if (depositAmt && depositAmt !== '' && depositAmt !== null) {
        paymentFound = true;
        paymentAmount = parseFloat(depositAmt);
        break;
      }
      
      // If UTR matches but it's a withdrawal (debit), not a deposit
      if (withdrawalAmt && withdrawalAmt !== '' && (!depositAmt || depositAmt === '')) {
        return {
          success: false,
          status: 'PAYMENT_NOT_FOUND',
          message: 'Found UTR but it\'s a withdrawal (debit). We need a deposit (credit) of ₹85.'
        };
      }
    }
  }
  
  // If payment not found in bank CSV
  if (!paymentFound) {
    return { 
      success: false, 
      status: 'PAYMENT_NOT_FOUND',
      message: 'Payment not found in bank records. Please wait for bank CSV update or check UTR number.'
    };
  }
  
  // Validate payment amount (must be exactly ₹85)
  if (isNaN(paymentAmount) || paymentAmount !== TICKET_PRICE) {
    return {
      success: false,
      status: 'INVALID_AMOUNT',
      message: `Invalid payment amount: ₹${paymentAmount}. Required: ₹${TICKET_PRICE}.`,
      actualAmount: paymentAmount,
      requiredAmount: TICKET_PRICE
    };
  }
  
  // Note: HDFC doesn't have explicit status column - if deposit exists, it's successful
  
  // Payment found and validated - now verify the registration
  const regData = registrationsSheet.getDataRange().getValues();
  let registrationRow = -1;
  let studentData = null;
  
  for (let i = 1; i < regData.length; i++) {
    if (regData[i][4].toString() === utr.toString()) { // UTR column (index 4)
      registrationRow = i + 1; // +1 for 1-indexed rows
      studentData = regData[i];
      break;
    }
  }
  
  if (registrationRow === -1) {
    return { 
      success: false, 
      status: 'NOT_REGISTERED',
      message: 'UTR found in bank but no registration found. Please register first.'
    };
  }
  
  // Generate TicketID if not present
  let ticketID = studentData[5]; // TicketID column (index 5)
  if (!ticketID) {
    ticketID = generateTicketID();
    registrationsSheet.getRange(registrationRow, 6).setValue(ticketID); // Column 6 = TicketID
  }
  
  // Update status to VERIFIED
  registrationsSheet.getRange(registrationRow, 7).setValue('VERIFIED'); // Column 7 = Status
  
  // Add to FINAL_VERIFIED
  const verifiedTime = new Date();
  verifiedSheet.appendRow([
    ticketID,
    utr,
    studentData[0], // Name
    studentData[1], // RollNumber
    studentData[3], // Phone
    verifiedTime
  ]);
  
  return {
    success: true,
    status: 'VERIFIED',
    message: 'Ticket verified successfully!',
    ticketID: ticketID,
    name: studentData[0],
    rollNumber: studentData[1],
    phone: studentData[3],
    amount: paymentAmount,
    verifiedTime: verifiedTime
  };
}

/**
 * Get statistics about registrations and payments
 * @returns {Object} Statistics data
 */
function getStats() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const verifiedSheet = ss.getSheetByName(SHEET_FINAL_VERIFIED);
  const registrationsSheet = ss.getSheetByName(SHEET_REGISTRATIONS);
  
  const verifiedCount = verifiedSheet.getDataRange().getValues().length - 1; // -1 for header
  const totalRegistrations = registrationsSheet.getDataRange().getValues().length - 1;
  const pendingCount = totalRegistrations - verifiedCount;
  const totalAmount = verifiedCount * TICKET_PRICE;
  
  return {
    success: true,
    totalVerified: verifiedCount,
    totalPending: pendingCount,
    totalRegistrations: totalRegistrations,
    totalAmount: totalAmount,
    ticketPrice: TICKET_PRICE
  };
}

/**
 * Get list of all verified students
 * @returns {Object} Array of verified students
 */
function getVerifiedList() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const verifiedSheet = ss.getSheetByName(SHEET_FINAL_VERIFIED);
  
  const data = verifiedSheet.getDataRange().getValues();
  const verifiedList = [];
  
  // Skip header row (index 0)
  for (let i = 1; i < data.length; i++) {
    verifiedList.push({
      ticketID: data[i][0],
      utr: data[i][1],
      name: data[i][2],
      rollNumber: data[i][3],
      phone: data[i][4],
      verifiedTime: data[i][5]
    });
  }
  
  return {
    success: true,
    count: verifiedList.length,
    students: verifiedList
  };
}


/**
 * Get list of all unverified (PENDING) students  
 * @returns {Object} Array of unverified students
 */
function getUnverifiedList() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const registrationsSheet = ss.getSheetByName(SHEET_REGISTRATIONS);
  
  const data = registrationsSheet.getDataRange().getValues();
  const unverifiedList = [];
  
  // Skip header row (index 0)
  // Columns: Name, RollNumber, Year, Phone, UTR, TicketID, Status
  for (let i = 1; i < data.length; i++) {
    const status = data[i][6]; // Status column (index 6)
    
    // Only include PENDING students
    if (status === 'PENDING') {
      unverifiedList.push({
        name: data[i][0],
        rollNumber: data[i][1],
        year: data[i][2],
        phone: data[i][3]
      });
    }
  }
  
  return {
    success: true,
    count: unverifiedList.length,
    students: unverifiedList
  };
}

/**
 * Generate a unique ticket ID
 * @returns {string} Ticket ID in format TARANG-XXXX
 */
function generateTicketID() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const verifiedSheet = ss.getSheetByName(SHEET_FINAL_VERIFIED);
  
  const count = verifiedSheet.getDataRange().getValues().length; // Includes header
  const paddedNumber = count.toString().padStart(4, '0');
  
  return `TARANG-${paddedNumber}`;
}

/**
 * Helper function to create JSON response
 * @param {Object} data - Data to return
 * @param {number} statusCode - HTTP status code (default 200)
 * @returns {ContentService.TextOutput} JSON response
 */
function jsonResponse(data, statusCode = 200) {
  const output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}
