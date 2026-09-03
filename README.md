# QIW- Field dimention dispatcher

A modern, responsive web application designed for mobile phones, tablets, and desktop workstations. Field workers can log job details, capture site photos or upload documents, annotate/write dimensions on photos, automatically package everything into a standardized ZIP file (`<Job Number or Name> - <Category>.zip`), and share directly into **Outlook** or **Gmail** with the ZIP file attached.

---

## 🌟 Key Features

1. **Required Fields (*)**:
   - **Job Number / Job Name** (Required)
   - **Category (What Field Dims Are For)** (Required - freeform entry for canopy, stairs, railings, etc.)
   - **Date of Sending Field Dims** (Required - pre-filled with **today's date** by default)
   - **Ship Date** (Required)
2. **Optional Notes**:
   - **Additional Notes** (Optional - no star, included in the email summary)
3. **Multi-Format File & Photo Upload + In-App Photo Markup Studio**:
   - Drag-and-drop zone
   - 📷 One-tap **Take Photo / Camera** button for mobile/tablets
   - 📄 **Browse Documents** for PDFs, CAD/DWG, Excel, Word, or any file type
   - ✏️ **Photo Markup Studio (Write & Draw on Photos)**:
     - Tap **"Markup"** on any attached photo to open the canvas editor.
     - **🔤 Write Text & Measurements**: Type measurements (e.g. `48 1/2"`, `Check Elevation`, `Verify Clearance`) with high-contrast text badges.
     - **➡️ Dimension Arrows**: Touch and drag to draw directional arrows pointing at joints, beams, or openings.
     - **✏️ Freehand Pen**: Draw circles, underline, or handwrite notes using your finger or stylus.
     - **🔲 Highlight Box**: Draw rectangles around critical areas.
     - **Colors & Strokes**: Red 🔴, Yellow 🟡, Green 🟢, Blue 🔵, White ⚪, Black ⚫ in Fine, Medium, or Bold.
     - **Undo & Clear**: Step back or revert changes.
     - **Save & Apply**: Instantly updates the photo in the attachment list and embeds it into the final ZIP archive!
4. **Automated ZIP Compression**:
   - Compresses all attached files into one `.zip` file named:
     ```
     <Job Number or Name> - <Category>.zip
     ```
   - Automatically sanitizes special characters to guarantee valid filenames.
5. **Direct Outlook & Gmail Native Integration**:
   - **Mobile & Tablets (iOS / iPadOS / Android)**: Uses the native **Web Share API** (`navigator.share`). Tapping "Share to Email" directly launches the device's native share sheet. Selecting **Outlook** or **Gmail** opens a draft with the **ZIP file attached**, subject line populated, and summary table in the email body!
   - **Desktop Workstations**: Generates a downloadable `.eml` draft with the ZIP file embedded as an attachment. Double-clicking the `.eml` file immediately launches Microsoft Outlook ready to send.
   - **Alternative Options**: Also provides 📥 standalone ZIP download, 📧 `mailto:` launcher, and 📋 one-click summary clipboard copy.

---

## 🚀 How to Run

### Method 1: One-Click Launcher (Windows)
Double-click `start.bat`. This automatically starts the server and opens `http://localhost:5000` in your default browser.

### Method 2: Command Line
```powershell
python app.py
```
Open `http://localhost:5000` in your browser.

### Method 3: Access from Phone or Tablet (Same Wi-Fi)
1. Ensure your phone or tablet is connected to the same Wi-Fi network as this computer.
2. Open the browser on your phone/tablet and navigate to:
   ```
   http://<YOUR-LOCAL-IP>:5000
   ```
   *(The app displays your exact IP address in the terminal and in the top banner upon starting)*.

### Method 4: Standalone / Offline Static File
You can also open `index.html` directly in any web browser without running Python. All compression and export features run client-side.

---

## 📋 Email Summary Format

When shared to Outlook or Gmail, the email body is automatically formatted as:

```text
FIELD DIMENSIONS & JOB DETAILS SUMMARY
=====================================================
Job Number / Name : 24-5082 / Downtown Plaza Tower
Category          : Field Dims
Date Sent (Dims)  : 2026-09-03
Ship Date         : 2026-09-25

Additional Notes:
All critical dimensions verified on site; clearances noted in sheet 4.

Attached Files (ZIP: 24-5082 - Downtown Plaza Tower - Field Dims.zip):
  - field_measurements.pdf (1.2 MB)
  - photo_elevation_A.jpg (2.4 MB)
  - site_details.dwg (3.1 MB)
=====================================================
```
