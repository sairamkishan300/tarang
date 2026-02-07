# Tarang#1 Event Registration System

A modern, neon-themed event registration and ticket verification system for musical events.

## 🎯 Quick Start

### 1. Configuration
Edit `config.js` to customize your event:
```javascript
const CONFIG = {
    eventName: "Your Event",
    ticketPrice: 85,
    upiId: "your-upi@bank",
    apiUrl: "your-apps-script-url",
    adminEmails: ['admin@email.com']
};
```

### 2. Google Apps Script Setup
1. Create a new Google Spreadsheet with 3 sheets:
   - `REGISTRATIONS` (Name, RollNumber, Year, Phone, UTR, TicketID, Status)
   - `BANK_CSV` (Date, Narration, Chq./Ref.No., Value Dt, Withdrawal, Deposit Amt, Balance)
   - `FINAL_VERIFIED` (TicketID, UTR, Name, RollNumber, Phone, VerifiedTime)

2. Open **Extensions → Apps Script**
3. Copy contents of `Code.gs` into the script editor
4. Click **Deploy → New deployment → Web app**
5. Settings:
   - Execute as: **Me**
   - Who has access: **Anyone**
6. Copy the Web App URL and paste into `config.js` as `apiUrl`

### 3. Bank Statement Upload
1. Download HDFC bank statement as CSV
2. Open your Google Spreadsheet
3. Go to `BANK_CSV` sheet
4. **File → Import → Upload** CSV file
5. Select **Replace data** at selected cell (A1)

### 4. Admin Access
Add authorized emails to `config.js`:
```javascript
adminEmails: [
    'admin1@gmail.com',
    'admin2@gmail.com'
]
```

## 📁 File Structure

```
├── index.html          # Landing page with event info
├── registration.html   # Student registration form
├── retrieve.html       # Retrieve ticket by phone
├── admin.html          # Admin verification panel
├── stats.html          # Live statistics
├── config.js           # Central configuration
└── Code.gs             # Google Apps Script backend
```

## 🎨 Features

### For Students
- ✅ Online registration with UPI payment
- ✅ Automatic QR code generation
- ✅ Retrieve ticket using phone number
- ✅ Real-time status checking

### For Admins
- ✅ Google Sign-In authentication
- ✅ QR code scanner for verification
- ✅ Manual UTR verification
- ✅ Live statistics dashboard
- ✅ View pending registrations
- ✅ Download verified students list (CSV)

## 🔧 Customization

### Update API URL
When redeploying Code.gs, update `config.js`:
```javascript
apiUrl: "your-new-deployment-url"
```

### Change Ticket Price
Update in `config.js`:
```javascript
ticketPrice: 100  // New price
```

### Modify Theme Colors
Edit `config.js`:
```javascript
theme: {
    primary: "#667eea",
    secondary: "#764ba2",
    // ... other colors
}
```

## 📊 Google Sheets Structure

### REGISTRATIONS Sheet
| Name | RollNumber | Year | Phone | UTR | TicketID | Status |
|------|------------|------|-------|-----|----------|--------|
| John | 103 | 2nd | 9876543210 | 603785... | TARANG-0001 | VERIFIED |

### BANK_CSV Sheet
| Date | Narration | Chq./Ref.No. | Value Dt | Withdrawal | Deposit Amt | Balance |
|------|-----------|--------------|----------|------------|-------------|---------|
| 07/02/2026 | UPI/CR/... | 603785... | 07/02/2026 | | 85.00 | ... |

### FINAL_VERIFIED Sheet
| TicketID | UTR | Name | RollNumber | Phone | VerifiedTime |
|----------|-----|------|------------|-------|--------------|
| TARANG-0001 | 603785... | John | 103 | 9876... | 2026-02-07... |

## 🚀 Deployment

### Vercel (Recommended)
1. Push code to GitHub
2. Connect to Vercel
3. Deploy automatically

### GitHub Pages
1. Push code to GitHub repository
2. Enable Pages in repository settings
3. Select branch and deploy

## 🐛 Troubleshooting

**Issue**: API returning 404
- **Solution**: Redeploy Code.gs as new version and update `config.js`

**Issue**: QR scanner not working
- **Solution**: Use manual UTR entry field below scanner

**Issue**: Pending students not showing
- **Solution**: Ensure Code.gs is deployed with latest version

## 📝 Admin Operations

### Daily Workflow
1. Upload bank CSV to `BANK_CSV` sheet
2. Admins verify tickets using QR scanner or manual UTR
3. Download verified students list at end of day

## 🔐 Security

- Admin access controlled via Google OAuth
- Email whitelist in `config.js`
- API validates payment amounts
- Prevents duplicate UTR usage

## 📞 Support

Update support contact in `config.js`:
```javascript
supportEmail: "your-email@domain.com",
supportPhone: "+91 XXXXXXXXXX"
```

---

**Built with ❤️ by Troizeantz'22**
