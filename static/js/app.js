/**
 * Field Dimensions & Job Dispatch Web Application
 * Mobile & Tablet First - Direct Outlook / Gmail Sharing & ZIP Compression
 */

// State
let attachedFiles = [];
let generatedZipBlob = null;
let currentZipFilename = '';
let currentSummaryText = '';
let currentSummaryHtml = '';

document.addEventListener('DOMContentLoaded', () => {
  initDate();
  initEventListeners();
});

/**
 * Pre-populate "Date of sending field dims" with today's date (YYYY-MM-DD)
 */
function initDate() {
  const dateSentInput = document.getElementById('dateSent');
  if (dateSentInput) {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    dateSentInput.value = `${yyyy}-${mm}-${dd}`;
  }
}

/**
 * Initialize event listeners
 */
function initEventListeners() {
  // Category input listener
  const categoryInput = document.getElementById('category');
  if (categoryInput) {
    categoryInput.addEventListener('input', () => {
      if (categoryInput.value.trim()) {
        categoryInput.classList.remove('is-invalid');
        hideError('categoryError');
      }
    });
  }

  // Clear validation errors on typing
  ['jobName', 'dateSent', 'shipDate'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', () => {
        if (el.value.trim()) {
          el.classList.remove('is-invalid');
          hideError(`${id}Error`);
        }
      });
    }
  });

  // File Inputs
  const fileInputAll = document.getElementById('fileInputAll');
  const fileInputCamera = document.getElementById('fileInputCamera');
  const dropZone = document.getElementById('dropZone');

  if (dropZone && fileInputAll) {
    dropZone.addEventListener('click', () => fileInputAll.click());

    // Drag & Drop
    ['dragenter', 'dragover'].forEach(eventName => {
      dropZone.addEventListener(eventName, e => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.add('dragover');
      }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropZone.addEventListener(eventName, e => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.remove('dragover');
      }, false);
    });

    dropZone.addEventListener('drop', e => {
      const dt = e.dataTransfer;
      const files = dt.files;
      if (files && files.length > 0) {
        handleFiles(files);
      }
    });
  }

  if (fileInputAll) {
    fileInputAll.addEventListener('change', e => {
      if (e.target.files && e.target.files.length > 0) {
        handleFiles(e.target.files);
        fileInputAll.value = ''; // Reset so same file can be re-selected
      }
    });
  }

  if (fileInputCamera) {
    fileInputCamera.addEventListener('change', e => {
      if (e.target.files && e.target.files.length > 0) {
        handleFiles(e.target.files);
        fileInputCamera.value = '';
      }
    });
  }

  // Camera button trigger
  const btnCamera = document.getElementById('btnCameraUpload');
  if (btnCamera && fileInputCamera) {
    btnCamera.addEventListener('click', () => fileInputCamera.click());
  }

  // Browse files button trigger
  const btnBrowse = document.getElementById('btnBrowseUpload');
  if (btnBrowse && fileInputAll) {
    btnBrowse.addEventListener('click', () => fileInputAll.click());
  }

  // Primary Action: Share to Email
  const btnShareEmail = document.getElementById('btnShareEmail');
  if (btnShareEmail) {
    btnShareEmail.addEventListener('click', handleShareProcess);
  }

  // Reset form button in header
  const btnReset = document.getElementById('btnResetForm');
  if (btnReset) {
    btnReset.addEventListener('click', resetForm);
  }

  // Modal Actions
  const btnModalShare = document.getElementById('btnModalShare');
  if (btnModalShare) {
    btnModalShare.addEventListener('click', triggerNativeShare);
  }

  const btnModalDownloadZip = document.getElementById('btnModalDownloadZip');
  if (btnModalDownloadZip) {
    btnModalDownloadZip.addEventListener('click', downloadZipArchive);
  }

  const btnModalDownloadEml = document.getElementById('btnModalDownloadEml');
  if (btnModalDownloadEml) {
    btnModalDownloadEml.addEventListener('click', downloadOutlookEml);
  }

  const btnModalMailto = document.getElementById('btnModalMailto');
  if (btnModalMailto) {
    btnModalMailto.addEventListener('click', openMailto);
  }

  const btnModalCopy = document.getElementById('btnModalCopy');
  if (btnModalCopy) {
    btnModalCopy.addEventListener('click', copySummaryToClipboard);
  }

  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const exportModal = document.getElementById('exportModal');
  if (modalCloseBtn && exportModal) {
    modalCloseBtn.addEventListener('click', () => {
      exportModal.classList.remove('active');
    });
    exportModal.addEventListener('click', (e) => {
      if (e.target === exportModal) {
        exportModal.classList.remove('active');
      }
    });
  }
}

/**
 * Handle new files selected by user
 */
function handleFiles(fileList) {
  for (let i = 0; i < fileList.length; i++) {
    const file = fileList[i];
    // Create unique ID
    const fileObj = {
      id: Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      file: file,
      name: file.name,
      size: file.size,
      type: file.type,
      previewUrl: null
    };

    // If image, create thumbnail URL
    if (file.type.startsWith('image/')) {
      try {
        fileObj.previewUrl = URL.createObjectURL(file);
      } catch (err) {
        console.warn('Could not create preview for image', err);
      }
    }

    attachedFiles.push(fileObj);
  }
  renderFileList();
}

/**
 * Render list of attached files
 */
function renderFileList() {
  const container = document.getElementById('fileListContainer');
  const countBadge = document.getElementById('fileCountBadge');
  if (!container || !countBadge) return;

  countBadge.textContent = `${attachedFiles.length} file${attachedFiles.length === 1 ? '' : 's'}`;

  if (attachedFiles.length === 0) {
    container.innerHTML = `<div class="file-empty-state">No files attached yet. Photos, PDFs, drawings, and documents will appear here.</div>`;
    return;
  }

  let html = '';
  attachedFiles.forEach(item => {
    const formattedSize = formatBytes(item.size);
    const ext = getFileExtension(item.name);

    let visual = '';
    if (item.previewUrl) {
      visual = `<img src="${item.previewUrl}" class="file-thumb" alt="Thumbnail" />`;
    } else {
      visual = `<div class="file-icon-box">${ext}</div>`;
    }

    html += `
      <div class="file-item" data-id="${item.id}">
        <div class="file-info-col">
          ${visual}
          <div class="file-name-size">
            <div class="file-name" title="${escapeHtml(item.name)}">${escapeHtml(item.name)}</div>
            <div class="file-size">${formattedSize} &bull; ${ext.toUpperCase()}</div>
          </div>
        </div>
        <button type="button" class="btn-remove-file" onclick="removeFile('${item.id}')" title="Remove file" aria-label="Remove file">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            <line x1="10" y1="11" x2="10" y2="17"></line>
            <line x1="14" y1="11" x2="14" y2="17"></line>
          </svg>
        </button>
      </div>
    `;
  });

  container.innerHTML = html;
}

/**
 * Remove an attached file by ID
 */
window.removeFile = function(id) {
  const index = attachedFiles.findIndex(f => f.id === id);
  if (index !== -1) {
    if (attachedFiles[index].previewUrl) {
      URL.revokeObjectURL(attachedFiles[index].previewUrl);
    }
    attachedFiles.splice(index, 1);
    renderFileList();
  }
};

/**
 * Form Validation
 */
function validateForm() {
  let isValid = true;
  let firstErrorElement = null;

  const jobName = document.getElementById('jobName');
  const category = document.getElementById('category');
  const dateSent = document.getElementById('dateSent');
  const shipDate = document.getElementById('shipDate');

  if (!jobName.value.trim()) {
    jobName.classList.add('is-invalid');
    showError('jobNameError', 'Job Number / Job Name is required');
    isValid = false;
    if (!firstErrorElement) firstErrorElement = jobName;
  } else {
    jobName.classList.remove('is-invalid');
    hideError('jobNameError');
  }

  if (!category.value.trim()) {
    category.classList.add('is-invalid');
    showError('categoryError', 'Please select or enter a Category');
    isValid = false;
    if (!firstErrorElement) firstErrorElement = category;
  } else {
    category.classList.remove('is-invalid');
    hideError('categoryError');
  }

  if (!dateSent.value.trim()) {
    dateSent.classList.add('is-invalid');
    showError('dateSentError', 'Date of sending field dims is required');
    isValid = false;
    if (!firstErrorElement) firstErrorElement = dateSent;
  } else {
    dateSent.classList.remove('is-invalid');
    hideError('dateSentError');
  }

  if (!shipDate.value.trim()) {
    shipDate.classList.add('is-invalid');
    showError('shipDateError', 'Ship Date is required');
    isValid = false;
    if (!firstErrorElement) firstErrorElement = shipDate;
  } else {
    shipDate.classList.remove('is-invalid');
    hideError('shipDateError');
  }

  if (!isValid && firstErrorElement) {
    firstErrorElement.focus();
    firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  return isValid;
}

function showError(id, msg) {
  const el = document.getElementById(id);
  if (el) {
    el.textContent = msg;
    el.classList.add('visible');
  }
}

function hideError(id) {
  const el = document.getElementById(id);
  if (el) {
    el.classList.remove('visible');
  }
}

/**
 * Main Share / Email Process
 */
async function handleShareProcess() {
  if (!validateForm()) {
    showToast('⚠️ Please fill in all required fields marked with *');
    return;
  }

  if (attachedFiles.length === 0) {
    const confirmNoFiles = confirm("No files or photos are currently attached. Would you like to proceed without attachments?");
    if (!confirmNoFiles) {
      document.getElementById('dropZone').scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
  }

  showLoading(true, 'Packaging ZIP Archive', 'Compressing attached files...');

  try {
    const jobName = document.getElementById('jobName').value.trim();
    const category = document.getElementById('category').value.trim();
    const dateSent = document.getElementById('dateSent').value.trim();
    const shipDate = document.getElementById('shipDate').value.trim();
    const notes = document.getElementById('notes').value.trim();

    // 1. Generate safe ZIP filename: "<Job Number or Name> - <Category>.zip"
    currentZipFilename = generateSafeFilename(jobName, category) + '.zip';

    // 2. Compress files into ZIP using JSZip
    const zip = new JSZip();
    const usedNames = new Set();

    for (const item of attachedFiles) {
      let fileName = item.name;
      // Prevent colliding names inside zip
      if (usedNames.has(fileName)) {
        const parts = fileName.split('.');
        const ext = parts.length > 1 ? '.' + parts.pop() : '';
        const base = parts.join('.');
        fileName = `${base}_${Math.floor(Math.random() * 1000)}${ext}`;
      }
      usedNames.add(fileName);
      zip.file(fileName, item.file);
    }

    // Add a text summary file inside the ZIP as well for convenience
    const summaryFileContent = buildTextSummary(jobName, category, dateSent, shipDate, notes);
    zip.file("JOB_SUMMARY.txt", summaryFileContent);

    generatedZipBlob = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    });

    // 3. Prepare summary strings
    currentSummaryText = buildTextSummary(jobName, category, dateSent, shipDate, notes);
    currentSummaryHtml = buildHtmlSummary(jobName, category, dateSent, shipDate, notes);

    showLoading(false);

    // 4. Update UI modal details
    updateModalDetails(jobName, category, dateSent, shipDate, notes);

    // 5. Check if native Web Share API supports file sharing (Mobile/Tablets)
    const canShareFiles = testCanShareFile();

    if (canShareFiles) {
      // Attempt native share directly
      await triggerNativeShare();
    } else {
      // On desktop or browsers without file sharing, open the options modal
      openExportModal();
    }
  } catch (err) {
    showLoading(false);
    console.error('Error creating ZIP archive:', err);
    alert('An error occurred during ZIP compression: ' + err.message);
  }
}

/**
 * Test whether device browser supports sharing files via Web Share API
 */
function testCanShareFile() {
  if (!navigator.canShare || !navigator.share || !window.File) {
    return false;
  }
  try {
    const dummyFile = new File(['test'], 'test.txt', { type: 'text/plain' });
    return navigator.canShare({ files: [dummyFile] });
  } catch (e) {
    return false;
  }
}

/**
 * Trigger native mobile share sheet with ZIP file attached
 */
async function triggerNativeShare() {
  if (!generatedZipBlob) return;

  const jobName = document.getElementById('jobName').value.trim();
  const category = document.getElementById('category').value.trim();
  const shareTitle = `Field Dims: ${jobName} - ${category}`;

  try {
    const zipFile = new File([generatedZipBlob], currentZipFilename, {
      type: 'application/zip',
      lastModified: Date.now()
    });

    if (navigator.canShare && navigator.canShare({ files: [zipFile] })) {
      await navigator.share({
        title: shareTitle,
        text: currentSummaryText,
        files: [zipFile]
      });
      showToast('✅ Shared successfully!');
    } else if (navigator.share) {
      // Can share text only
      await navigator.share({
        title: shareTitle,
        text: currentSummaryText
      });
      // Also download zip for user
      downloadZipArchive();
      showToast('✅ Summary shared! ZIP file downloaded.');
    } else {
      openExportModal();
    }
  } catch (err) {
    if (err.name !== 'AbortError') {
      console.warn('Share sheet was dismissed or failed:', err);
      // Fallback: show modal
      openExportModal();
    }
  }
}

/**
 * Show the export modal
 */
function openExportModal() {
  const exportModal = document.getElementById('exportModal');
  if (exportModal) {
    exportModal.classList.add('active');
  }
}

/**
 * Populate modal with the active job info and summary preview
 */
function updateModalDetails(jobName, category, dateSent, shipDate, notes) {
  const modalZipName = document.getElementById('modalZipName');
  const modalZipMeta = document.getElementById('modalZipMeta');
  const modalSummaryPreview = document.getElementById('modalSummaryPreview');

  if (modalZipName) modalZipName.textContent = currentZipFilename;
  if (modalZipMeta) {
    const sizeStr = formatBytes(generatedZipBlob ? generatedZipBlob.size : 0);
    modalZipMeta.textContent = `${attachedFiles.length} file(s) &bull; ${sizeStr} archive`;
  }

  if (modalSummaryPreview) {
    modalSummaryPreview.innerHTML = `
      <div class="preview-title">Outlook Summary Details</div>
      <table class="summary-table">
        <tr><td>Job Number / Name:</td><td><strong>${escapeHtml(jobName)}</strong></td></tr>
        <tr><td>Category:</td><td>${escapeHtml(category)}</td></tr>
        <tr><td>Date Sent (Dims):</td><td>${escapeHtml(dateSent)}</td></tr>
        <tr><td>Ship Date:</td><td>${escapeHtml(shipDate)}</td></tr>
        <tr><td>Additional Notes:</td><td>${notes ? escapeHtml(notes).replace(/\n/g, '<br>') : '<em>None</em>'}</td></tr>
        <tr><td>ZIP Archive:</td><td><code>${escapeHtml(currentZipFilename)}</code></td></tr>
      </table>
    `;
  }
}

/**
 * Generate and download an .eml file that opens directly in Microsoft Outlook
 * with HTML body and the ZIP file attached!
 */
async function downloadOutlookEml() {
  if (!generatedZipBlob) return;

  showLoading(true, 'Preparing Outlook Email', 'Embedding ZIP attachment into email draft...');

  try {
    const jobName = document.getElementById('jobName').value.trim();
    const category = document.getElementById('category').value.trim();
    const subject = `Field Dims: ${jobName} - ${category}`;

    // Read ZIP blob as base64
    const zipBase64 = await blobToBase64(generatedZipBlob);
    const boundary = "boundary_field_dims_" + Date.now().toString(16);

    const emlContent = [
      `MIME-Version: 1.0`,
      `Subject: ${subject}`,
      `Date: ${new Date().toUTCString()}`,
      `Content-Type: multipart/mixed; boundary="${boundary}"`,
      ``,
      `--${boundary}`,
      `Content-Type: text/html; charset=UTF-8`,
      `Content-Transfer-Encoding: 7bit`,
      ``,
      currentSummaryHtml,
      ``,
      `--${boundary}`,
      `Content-Type: application/zip; name="${currentZipFilename}"`,
      `Content-Disposition: attachment; filename="${currentZipFilename}"`,
      `Content-Transfer-Encoding: base64`,
      ``,
      zipBase64,
      ``,
      `--${boundary}--`
    ].join('\r\n');

    const emlBlob = new Blob([emlContent], { type: 'message/rfc822' });
    const emlFilename = `${generateSafeFilename(jobName, category)}.eml`;
    triggerDownload(emlBlob, emlFilename);

    showLoading(false);
    showToast('✉️ Outlook draft downloaded! Double-click to open in Outlook.');
  } catch (err) {
    showLoading(false);
    console.error('Error generating EML:', err);
    alert('Could not generate Outlook .eml file: ' + err.message);
  }
}

/**
 * Download the standalone ZIP archive
 */
function downloadZipArchive() {
  if (!generatedZipBlob) return;
  triggerDownload(generatedZipBlob, currentZipFilename);
  showToast('📥 ZIP archive downloaded!');
}

/**
 * Open Outlook / default email client via mailto: URL
 */
function openMailto() {
  const jobName = document.getElementById('jobName').value.trim();
  const category = document.getElementById('category').value.trim();
  const subject = encodeURIComponent(`Field Dims: ${jobName} - ${category}`);
  const body = encodeURIComponent(currentSummaryText);

  // Copy summary to clipboard just in case
  copySummaryToClipboard(false);

  // Trigger download of zip so user can easily attach it
  downloadZipArchive();

  window.location.href = `mailto:?subject=${subject}&body=${body}`;
  showToast('📧 Opened email client! (ZIP downloaded to attach)');
}

/**
 * Copy summary text to clipboard
 */
async function copySummaryToClipboard(notify = true) {
  try {
    await navigator.clipboard.writeText(currentSummaryText);
    if (notify) {
      showToast('📋 Summary copied to clipboard!');
    }
  } catch (err) {
    // Fallback
    const textarea = document.createElement('textarea');
    textarea.value = currentSummaryText;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    if (notify) {
      showToast('📋 Summary copied to clipboard!');
    }
  }
}

/**
 * Build Plain Text Summary
 */
function buildTextSummary(jobName, category, dateSent, shipDate, notes) {
  let fileListStr = '';
  if (attachedFiles.length > 0) {
    fileListStr = attachedFiles.map(f => `  - ${f.name} (${formatBytes(f.size)})`).join('\n');
  } else {
    fileListStr = '  (No files attached)';
  }

  return `QIW - FIELD DIMENSION DISPATCHER
=====================================================
Job Number / Name : ${jobName}
Category          : ${category}
Date Sent (Dims)  : ${dateSent}
Ship Date         : ${shipDate}

Additional Notes:
${notes ? notes : 'None'}

Attached Files (ZIP: ${currentZipFilename}):
${fileListStr}
=====================================================
Generated by QIW- Field dimention dispatcher`;
}

/**
 * Build Rich HTML Summary for Outlook EML / email body
 */
function buildHtmlSummary(jobName, category, dateSent, shipDate, notes) {
  let filesHtml = '';
  if (attachedFiles.length > 0) {
    filesHtml = attachedFiles.map(f => `<li style="padding: 3px 0;"><strong>${escapeHtml(f.name)}</strong> (${formatBytes(f.size)})</li>`).join('');
  } else {
    filesHtml = '<li><em>No files attached</em></li>';
  }

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.5; margin: 0; padding: 15px; }
  .box { max-width: 600px; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden; background: #ffffff; }
  .header { background: #1e40af; color: #ffffff; padding: 16px 20px; }
  .header h2 { margin: 0; font-size: 18px; }
  .header p { margin: 4px 0 0; font-size: 13px; color: #bfdbfe; }
  .table { width: 100%; border-collapse: collapse; }
  .table td { padding: 10px 16px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
  .label { font-weight: 600; color: #475569; width: 38%; background: #f8fafc; }
  .val { color: #0f172a; }
  .notes-box { padding: 14px 16px; background: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 14px; }
  .files-box { padding: 14px 16px; background: #ffffff; border-top: 1px solid #e2e8f0; font-size: 13px; }
  .files-box ul { margin: 6px 0 0; padding-left: 20px; }
</style>
</head>
<body>
<div class="box">
  <div class="header">
    <h2>QIW- Field dimention dispatcher</h2>
    <p>Summary for Outlook & Project Records</p>
  </div>
  <table class="table">
    <tr>
      <td class="label">Job Number / Name:</td>
      <td class="val"><strong>${escapeHtml(jobName)}</strong></td>
    </tr>
    <tr>
      <td class="label">Category:</td>
      <td class="val">${escapeHtml(category)}</td>
    </tr>
    <tr>
      <td class="label">Date of Sending Field Dims:</td>
      <td class="val">${escapeHtml(dateSent)}</td>
    </tr>
    <tr>
      <td class="label">Ship Date:</td>
      <td class="val"><strong>${escapeHtml(shipDate)}</strong></td>
    </tr>
  </table>
  <div class="notes-box">
    <strong>Additional Notes:</strong><br>
    ${notes ? escapeHtml(notes).replace(/\n/g, '<br>') : '<em>None</em>'}
  </div>
  <div class="files-box">
    <strong>Attached Files Compressed in ZIP (<code>${escapeHtml(currentZipFilename)}</code>):</strong>
    <ul>${filesHtml}</ul>
  </div>
</div>
</body>
</html>`;
}

/**
 * Reset the form
 */
function resetForm() {
  if (confirm('Clear the form and attached files?')) {
    document.getElementById('jobName').value = '';
    document.getElementById('category').value = '';
    document.getElementById('shipDate').value = '';
    document.getElementById('notes').value = '';

    document.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
    document.querySelectorAll('.error-text').forEach(el => el.classList.remove('visible'));

    initDate();

    // Revoke object URLs
    attachedFiles.forEach(f => {
      if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
    });
    attachedFiles = [];
    renderFileList();

    generatedZipBlob = null;
    currentZipFilename = '';
    currentSummaryText = '';
    currentSummaryHtml = '';

    showToast('Form reset.');
  }
}

/**
 * Helper: Sanitized filename
 * Rule: "<Job Number or Name> - <Category>"
 */
function generateSafeFilename(job, cat) {
  const combined = `${job.trim()} - ${cat.trim()}`;
  // Remove / \ : * ? " < > | and clean spaces
  return combined.replace(/[\/\\:*?"<>|]/g, '-').replace(/\s+/g, ' ').trim();
}

/**
 * Helper: Format Bytes to human readable
 */
function formatBytes(bytes, decimals = 1) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Helper: Get File Extension
 */
function getFileExtension(filename) {
  const idx = filename.lastIndexOf('.');
  return idx !== -1 ? filename.substring(idx + 1).toLowerCase() : 'file';
}

/**
 * Helper: Escape HTML
 */
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Helper: Blob to Base64 (without prefix, with line wrapping for MIME)
 */
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result.split(',')[1];
      // Break into 76-character chunks for MIME RFC compliance
      const wrapped = base64String.match(/.{1,76}/g).join('\r\n');
      resolve(wrapped);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Helper: Trigger file download in browser
 */
function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/**
 * Helper: Show/Hide Loading Overlay
 */
function showLoading(show, title = '', subtitle = '') {
  const overlay = document.getElementById('loadingOverlay');
  if (!overlay) return;

  if (show) {
    document.getElementById('loadingTitle').textContent = title;
    document.getElementById('loadingSubtitle').textContent = subtitle;
    overlay.classList.add('active');
  } else {
    overlay.classList.remove('active');
  }
}

/**
 * Helper: Show Toast Notification
 */
let toastTimeout;
function showToast(msg) {
  const toast = document.getElementById('toast');
  if (!toast) return;

  toast.textContent = msg;
  toast.classList.add('show');

  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 3500);
}
