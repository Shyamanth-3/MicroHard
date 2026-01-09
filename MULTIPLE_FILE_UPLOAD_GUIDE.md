# Multiple File Upload & Sharing Implementation

## 🎯 Overview
Updated the FinSight application to support **multiple file uploads** and make all uploaded files **instantly accessible across all pages** (Upload, Simulation, Forecast, Optimize, etc.).

## 📋 Changes Made

### 1. **Upload Page** (`frontend/src/pages/Upload.jsx`)
- ✅ Changed file input to accept **multiple files** (`multiple` attribute)
- ✅ Show count of selected files before upload
- ✅ Upload all files in **parallel** using `Promise.all()`
- ✅ Display upload previews for all files
- ✅ Show **all uploaded files** in a grid below
- ✅ File deletion option (UI ready)
- ✅ Success message with count of uploaded files

### 2. **Simulation Page** (`frontend/src/pages/Simulation.jsx`)
- ✅ Improved file selector UI with icons
- ✅ Added refresh button with 🔄 icon
- ✅ Show file info (rows, columns) when loaded
- ✅ Better visual feedback
- ✅ Added storage change listener for cross-tab updates
- ✅ Cleaner column selection interface

### 3. **Forecast Page** (`frontend/src/pages/Forecast.jsx`)
- ✅ Same improvements as Simulation page
- ✅ Better UI styling
- ✅ Storage change listener
- ✅ Improved file/column selection

### 4. **New Utility: FileManager** (`frontend/src/utils/fileManager.js`)
- ✅ Centralized file management API
- ✅ `getAllFiles()` - Fetch all uploaded files
- ✅ `getFileColumns()` - Get columns from a file
- ✅ `getColumnValues()` - Get values from a column
- ✅ `saveToLocalStorage()` - Cross-page data sharing
- ✅ `getFromLocalStorage()` - Retrieve shared data
- ✅ `onFilesChanged()` - Listen for file updates across tabs

### 5. **New Component: FileSelector** (`frontend/src/components/FileSelector.jsx`)
- ✅ Reusable file selection component
- ✅ Shows all available files
- ✅ Automatically loads columns
- ✅ Auto-selects first numeric column
- ✅ File info display
- ✅ Consistent UI across pages

## 🚀 How It Works

### **Multiple File Upload Flow:**
```
1. User opens Upload page
2. Selects multiple CSV files (Ctrl+Click or Shift+Click)
3. Clicks "Upload All"
4. All files uploaded in parallel
5. Preview shown for each file
6. All files listed below in grid
7. Files are now accessible everywhere!
```

### **Cross-Page Access:**
```
1. File uploaded via Upload page
2. Stored on backend (data/raw/)
3. Listed in /api/uploads endpoint
4. Any page (Simulation, Forecast, etc.) can:
   - Fetch list of all files
   - Select any file
   - Get columns from selected file
   - Get values from selected column
5. Storage event listener enables real-time updates across tabs
```

## 🎨 UI Improvements

### Upload Page
- File count badge
- Grid display of all uploaded files
- File modification date
- Delete buttons (ready for backend implementation)

### Simulation & Forecast Pages
- Emoji icons for better UX (📁, 📊, 🔄)
- File info card showing rows/columns
- Better spacing and styling
- Responsive select dropdowns

## 💡 Usage Examples

### In Upload Page:
```jsx
// Select 3 files, upload all at once
// See previews and full file list
const files = await FileManager.getAllFiles();
```

### In Simulation Page:
```jsx
// Access any uploaded file
const columns = await FileManager.getFileColumns('historical_prices.csv');
const values = await FileManager.getColumnValues('historical_prices.csv', 'INFY_price');
```

### In Any Page:
```jsx
// Listen for file changes from other tabs
const unsubscribe = FileManager.onFilesChanged(() => {
  // Refresh file list
});
```

## 🔄 Cross-Tab Synchronization
- Storage event listeners detect file changes
- When file uploaded in one tab, appears instantly in others
- No page refresh needed

## ✅ Features Ready to Use

1. ✅ Upload multiple files at once
2. ✅ All files accessible to all pages
3. ✅ File list visible everywhere
4. ✅ Select any file on any page
5. ✅ Auto-load columns when file selected
6. ✅ Real-time cross-tab updates
7. ✅ Clean, reusable components

## 📝 Testing Steps

1. Go to **Upload page**
2. Select **3 CSV files** (personal_portfolio.csv, historical_prices.csv, transaction_history.csv)
3. Click **"Upload All"**
4. See preview for each file
5. See all files in grid below
6. Go to **Simulation page**
7. File dropdown shows all 3 files
8. Select different files and columns
9. Go to **Forecast page**
10. Same files/columns available
11. Works across all pages! 🎉

## 🎯 Next Steps (Optional Enhancements)

- [ ] Implement file delete backend endpoint
- [ ] Add file tagging/organization
- [ ] Create custom hooks: `useUploadedFiles()`, `useFileColumns()`
- [ ] Add file preview modal
- [ ] Implement file renaming
- [ ] Add file size limits
- [ ] Create file activity log
