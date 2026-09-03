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

  // Primary Bottom Actions
  const btnShareEmail = document.getElementById('btnShareEmail');
  if (btnShareEmail) {
    btnShareEmail.addEventListener('click', handleShareProcess);
  }

  const btnBottomDownloadZip = document.getElementById('btnBottomDownloadZip');
  if (btnBottomDownloadZip) {
    btnBottomDownloadZip.addEventListener('click', handleDownloadZipProcess);
  }

  // Reset form button in header
  const btnReset = document.getElementById('btnResetForm');
  if (btnReset) {
    btnReset.addEventListener('click', resetForm);
  }

  // Modal Actions (Only Share to Apps and Download ZIP)
  const btnModalShare = document.getElementById('btnModalShare');
  if (btnModalShare) {
    btnModalShare.addEventListener('click', () => {
      const modal = document.getElementById('exportModal');
      if (modal) modal.classList.remove('active');
      triggerNativeShare();
    });
  }

  const btnModalDownloadZip = document.getElementById('btnModalDownloadZip');
  if (btnModalDownloadZip) {
    btnModalDownloadZip.addEventListener('click', downloadZipArchive);
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

  // Initialize Photo Markup Studio
  initMarkupStudio();
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

    const isImage = item.type.startsWith('image/') || ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'heic'].includes(ext);

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
        <div class="file-actions-col">
          ${isImage ? `
            <button type="button" class="btn-markup-file" onclick="openMarkupEditor('${item.id}')" title="Draw or write notes on photo">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 20h9"></path>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
              </svg>
              Markup
            </button>
          ` : ''}
          <button type="button" class="btn-remove-file" onclick="removeFile('${item.id}')" title="Remove file" aria-label="Remove file">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
          </button>
        </div>
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

  const btn = document.getElementById('btnShareEmail');
  const originalBtnText = btn ? btn.innerHTML : '';
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="spinner" style="width:18px;height:18px;border-width:2px;display:inline-block;margin:0 6px 0 0;vertical-align:middle;"></svg> Packaging ZIP...`;
  }

  try {
    const jobName = document.getElementById('jobName').value.trim();
    const category = document.getElementById('category').value.trim();
    const dateSent = document.getElementById('dateSent').value.trim();
    const shipDate = document.getElementById('shipDate').value.trim();
    const notes = document.getElementById('notes').value.trim();

    // 1. Generate safe ZIP filename: "<Job Number or Name> - <Category>.zip"
    currentZipFilename = generateSafeFilename(jobName, category) + '.zip';

    // 2. Fast Compress files into ZIP using JSZip (level 1 for instant response)
    const zip = new JSZip();
    const usedNames = new Set();

    for (const item of attachedFiles) {
      let fileName = item.name;
      if (usedNames.has(fileName)) {
        const parts = fileName.split('.');
        const ext = parts.length > 1 ? '.' + parts.pop() : '';
        const base = parts.join('.');
        fileName = `${base}_${Math.floor(Math.random() * 1000)}${ext}`;
      }
      usedNames.add(fileName);
      zip.file(fileName, item.file);
    }

    const summaryFileContent = buildTextSummary(jobName, category, dateSent, shipDate, notes);
    zip.file("JOB_SUMMARY.txt", summaryFileContent);

    generatedZipBlob = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 1 }
    });

    currentSummaryText = buildTextSummary(jobName, category, dateSent, shipDate, notes);
    currentSummaryHtml = buildHtmlSummary(jobName, category, dateSent, shipDate, notes);

    updateModalDetails(jobName, category);

    // Reset button
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = originalBtnText;
    }

    // Trigger Native Share directly to show mobile/tablet apps
    await triggerNativeShare();

  } catch (err) {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = originalBtnText;
    }
    console.error('Error in share process:', err);
    alert('An error occurred during preparation: ' + err.message);
  }
}

/**
 * Handle direct "Download ZIP" button click
 */
async function handleDownloadZipProcess() {
  if (!validateForm()) {
    showToast('⚠️ Please fill in all required fields marked with *');
    return;
  }

  const btn = document.getElementById('btnBottomDownloadZip');
  const originalBtnText = btn ? btn.innerHTML : '';
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `Downloading...`;
  }

  try {
    const jobName = document.getElementById('jobName').value.trim();
    const category = document.getElementById('category').value.trim();
    const dateSent = document.getElementById('dateSent').value.trim();
    const shipDate = document.getElementById('shipDate').value.trim();
    const notes = document.getElementById('notes').value.trim();

    currentZipFilename = generateSafeFilename(jobName, category) + '.zip';

    const zip = new JSZip();
    const usedNames = new Set();
    for (const item of attachedFiles) {
      let fileName = item.name;
      if (usedNames.has(fileName)) {
        const parts = fileName.split('.');
        const ext = parts.length > 1 ? '.' + parts.pop() : '';
        const base = parts.join('.');
        fileName = `${base}_${Math.floor(Math.random() * 1000)}${ext}`;
      }
      usedNames.add(fileName);
      zip.file(fileName, item.file);
    }

    zip.file("JOB_SUMMARY.txt", buildTextSummary(jobName, category, dateSent, shipDate, notes));

    generatedZipBlob = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 1 }
    });

    downloadZipArchive();

    if (btn) {
      btn.disabled = false;
      btn.innerHTML = originalBtnText;
    }
  } catch (err) {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = originalBtnText;
    }
    alert('Error creating ZIP: ' + err.message);
  }
}

/**
 * Trigger native mobile share sheet
 */
async function triggerNativeShare() {
  if (!generatedZipBlob) return;

  const jobName = document.getElementById('jobName').value.trim();
  const category = document.getElementById('category').value.trim();
  const shareTitle = `Field Dims: ${jobName} - ${category}`;

  // If browser supports navigator.share (Mobile / Tablet)
  if (navigator.share) {
    const zipFile = new File([generatedZipBlob], currentZipFilename, {
      type: 'application/zip',
      lastModified: Date.now()
    });

    // 1. Try sharing ZIP file directly (works on iOS/iPadOS Safari & supported Android browsers)
    if (navigator.canShare && navigator.canShare({ files: [zipFile] })) {
      try {
        await navigator.share({
          title: shareTitle,
          text: currentSummaryText,
          files: [zipFile]
        });
        return;
      } catch (err) {
        if (err.name === 'AbortError') return; // User closed sheet
        console.warn('Sharing with ZIP file not allowed by browser:', err);
      }
    }

    // 2. Try sharing photos and documents directly if device allows them
    if (attachedFiles.length > 0) {
      const rawFiles = attachedFiles.map(f => f.file);
      if (navigator.canShare && navigator.canShare({ files: rawFiles })) {
        try {
          await navigator.share({
            title: shareTitle,
            text: currentSummaryText,
            files: rawFiles
          });
          return;
        } catch (err) {
          if (err.name === 'AbortError') return;
          console.warn('Sharing raw files failed:', err);
        }
      }
    }

    // 3. Fallback: Share subject and summary text directly to apps (Outlook, Gmail, etc.)
    // Note: Do NOT call downloadZipArchive() here so the browser user activation is not consumed!
    try {
      await navigator.share({
        title: shareTitle,
        text: currentSummaryText
      });
      return;
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.warn('Text share failed:', err);
    }
  }

  // Desktop fallback: open the clean 2-button modal
  openExportModal();
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
 * Populate modal with the active job info
 */
function updateModalDetails(jobName, category) {
  const modalZipName = document.getElementById('modalZipName');
  const modalZipMeta = document.getElementById('modalZipMeta');

  if (modalZipName) modalZipName.textContent = currentZipFilename;
  if (modalZipMeta) {
    const sizeStr = formatBytes(generatedZipBlob ? generatedZipBlob.size : 0);
    modalZipMeta.textContent = `${attachedFiles.length} file(s) &bull; ${sizeStr} archive`;
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

// ==========================================
// PHOTO MARKUP & ANNOTATION STUDIO
// ==========================================

let markupActiveFileId = null;
let markupTool = 'pen'; // 'pen', 'arrow', 'text', 'box', 'eraser'
let markupColor = '#ef4444';
let markupLineWidth = 6;
let markupHistory = [];
let isMarkupDrawing = false;
let markupStartX = 0;
let markupStartY = 0;
let lastPointerX = 0;
let lastPointerY = 0;
let markupCanvasSnapshot = null;
let currentLoadedImage = null;

function initMarkupStudio() {
  const canvas = document.getElementById('markupCanvas');
  if (!canvas) return;

  // Tool buttons
  const toolButtons = document.querySelectorAll('.markup-tool-btn');
  const instructions = document.getElementById('markupInstructionText');
  toolButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      toolButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      markupTool = btn.getAttribute('data-tool');

      if (markupTool === 'pen') {
        instructions.textContent = '✏️ Draw freely with your finger or stylus.';
      } else if (markupTool === 'arrow') {
        instructions.textContent = '➡️ Touch and drag to draw a dimension arrow.';
      } else if (markupTool === 'text') {
        instructions.textContent = '🔤 Tap on the photo to enter a dimension or note.';
      } else if (markupTool === 'box') {
        instructions.textContent = '🔲 Touch and drag to draw a highlight box.';
      } else if (markupTool === 'eraser') {
        instructions.textContent = '🧹 Drag your finger to erase marks and reveal the original photo.';
      }
    });
  });

  // Color Swatches
  const colorSwatches = document.querySelectorAll('.color-swatch');
  colorSwatches.forEach(swatch => {
    swatch.addEventListener('click', () => {
      colorSwatches.forEach(s => s.classList.remove('active'));
      swatch.classList.add('active');
      markupColor = swatch.getAttribute('data-color');
    });
  });

  // Stroke Sizes
  const strokeButtons = document.querySelectorAll('.stroke-btn');
  strokeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      strokeButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      markupLineWidth = parseInt(btn.getAttribute('data-size'), 10);
    });
  });

  // Action Buttons (Header)
  const btnUndo = document.getElementById('btnMarkupUndo');
  if (btnUndo) btnUndo.addEventListener('click', undoLastMarkup);

  const btnClear = document.getElementById('btnMarkupClear');
  if (btnClear) btnClear.addEventListener('click', clearAllMarkup);

  const btnClose = document.getElementById('btnMarkupClose');
  if (btnClose) btnClose.addEventListener('click', closeMarkupEditor);

  const btnSave = document.getElementById('btnMarkupSave');
  if (btnSave) btnSave.addEventListener('click', saveMarkupChanges);

  // Dedicated Bottom Action Bar Buttons
  const btnBottomSave = document.getElementById('btnMarkupBottomSave');
  if (btnBottomSave) btnBottomSave.addEventListener('click', saveMarkupChanges);

  const btnBottomCancel = document.getElementById('btnMarkupBottomCancel');
  if (btnBottomCancel) btnBottomCancel.addEventListener('click', closeMarkupEditor);

  // Canvas Pointer Events
  canvas.addEventListener('pointerdown', handlePointerDown);
  canvas.addEventListener('pointermove', handlePointerMove);
  canvas.addEventListener('pointerup', handlePointerUp);
  canvas.addEventListener('pointercancel', handlePointerCancel);
}

function getCanvasCoords(e, canvas) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY
  };
}

function pushCanvasState() {
  const canvas = document.getElementById('markupCanvas');
  const ctx = canvas.getContext('2d');
  if (markupHistory.length > 20) {
    markupHistory.shift();
  }
  markupHistory.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
}

function handlePointerDown(e) {
  const canvas = document.getElementById('markupCanvas');
  const ctx = canvas.getContext('2d');
  try {
    canvas.setPointerCapture(e.pointerId);
  } catch (err) {}

  const coords = getCanvasCoords(e, canvas);
  markupStartX = coords.x;
  markupStartY = coords.y;
  lastPointerX = coords.x;
  lastPointerY = coords.y;

  if (markupTool === 'text') {
    const userText = prompt('Enter dimension or note to write on photo:', '');
    if (userText && userText.trim()) {
      pushCanvasState();
      drawTextBadge(ctx, userText.trim(), coords.x, coords.y, markupColor, markupLineWidth);
    }
    return;
  }

  pushCanvasState();
  markupCanvasSnapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
  isMarkupDrawing = true;

  if (markupTool === 'pen') {
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = markupColor;
    ctx.lineWidth = markupLineWidth;
  } else if (markupTool === 'eraser') {
    eraseLine(ctx, coords.x, coords.y, coords.x, coords.y, markupLineWidth * 4);
  }
}

function handlePointerMove(e) {
  if (!isMarkupDrawing) return;
  const canvas = document.getElementById('markupCanvas');
  const ctx = canvas.getContext('2d');
  const coords = getCanvasCoords(e, canvas);

  if (markupTool === 'pen') {
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  } else if (markupTool === 'arrow') {
    ctx.putImageData(markupCanvasSnapshot, 0, 0);
    drawArrow(ctx, markupStartX, markupStartY, coords.x, coords.y, markupColor, markupLineWidth);
  } else if (markupTool === 'box') {
    ctx.putImageData(markupCanvasSnapshot, 0, 0);
    ctx.beginPath();
    ctx.strokeStyle = markupColor;
    ctx.lineWidth = markupLineWidth;
    ctx.strokeRect(markupStartX, markupStartY, coords.x - markupStartX, coords.y - markupStartY);
  } else if (markupTool === 'eraser') {
    eraseLine(ctx, lastPointerX, lastPointerY, coords.x, coords.y, markupLineWidth * 4);
    lastPointerX = coords.x;
    lastPointerY = coords.y;
  }
}

function handlePointerUp(e) {
  if (!isMarkupDrawing) return;
  isMarkupDrawing = false;
  const canvas = document.getElementById('markupCanvas');
  try {
    canvas.releasePointerCapture(e.pointerId);
  } catch (err) {}
}

function handlePointerCancel(e) {
  if (isMarkupDrawing) {
    isMarkupDrawing = false;
    undoLastMarkup();
  }
}

function eraseLine(ctx, x1, y1, x2, y2, width) {
  if (!currentLoadedImage) return;
  const canvas = document.getElementById('markupCanvas');
  const dist = Math.hypot(x2 - x1, y2 - y1);
  const steps = Math.max(1, Math.ceil(dist / 4));
  const radius = Math.max(14, width / 2);

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const xi = x1 + (x2 - x1) * t;
    const yi = y1 + (y2 - y1) * t;

    ctx.save();
    ctx.beginPath();
    ctx.arc(xi, yi, radius, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(currentLoadedImage, 0, 0, canvas.width, canvas.height);
    ctx.restore();
  }
}

function drawArrow(ctx, fromX, fromY, toX, toY, color, width) {
  const headlen = Math.max(16, width * 3.5);
  const dx = toX - fromX;
  const dy = toY - fromY;
  const angle = Math.atan2(dy, dx);

  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Arrow shaft
  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.stroke();

  // Arrowhead
  ctx.beginPath();
  ctx.moveTo(toX, toY);
  ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawTextBadge(ctx, text, x, y, color, sizeMultiplier) {
  ctx.save();
  const fontSize = Math.max(20, sizeMultiplier * 4);
  ctx.font = `bold ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;

  const metrics = ctx.measureText(text);
  const textWidth = metrics.width;
  const paddingX = 12;
  const paddingY = 8;
  const boxWidth = textWidth + paddingX * 2;
  const boxHeight = fontSize + paddingY * 2;

  // Background Badge
  ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;

  const rectX = x;
  const rectY = y - boxHeight / 2;

  ctx.beginPath();
  const r = 8;
  ctx.moveTo(rectX + r, rectY);
  ctx.lineTo(rectX + boxWidth - r, rectY);
  ctx.quadraticCurveTo(rectX + boxWidth, rectY, rectX + boxWidth, rectY + r);
  ctx.lineTo(rectX + boxWidth, rectY + boxHeight - r);
  ctx.quadraticCurveTo(rectX + boxWidth, rectY + boxHeight, rectX + boxWidth - r, rectY + boxHeight);
  ctx.lineTo(rectX + r, rectY + boxHeight);
  ctx.quadraticCurveTo(rectX, rectY + boxHeight, rectX, rectY + boxHeight - r);
  ctx.lineTo(rectX, rectY + r);
  ctx.quadraticCurveTo(rectX, rectY, rectX + r, rectY);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Text
  ctx.fillStyle = color;
  ctx.textBaseline = 'middle';
  ctx.fillText(text, rectX + paddingX, rectY + boxHeight / 2);
  ctx.restore();
}

function undoLastMarkup() {
  if (markupHistory.length === 0) return;
  const canvas = document.getElementById('markupCanvas');
  const ctx = canvas.getContext('2d');
  const previousState = markupHistory.pop();
  ctx.putImageData(previousState, 0, 0);
}

function clearAllMarkup() {
  if (!currentLoadedImage) return;
  if (confirm('Clear all drawings and revert to original photo?')) {
    pushCanvasState();
    const canvas = document.getElementById('markupCanvas');
    const ctx = canvas.getContext('2d');
    ctx.drawImage(currentLoadedImage, 0, 0, canvas.width, canvas.height);
  }
}

function closeMarkupEditor() {
  const modal = document.getElementById('markupModal');
  if (modal) modal.classList.remove('active');
  markupActiveFileId = null;
  currentLoadedImage = null;
  markupHistory = [];
}

window.openMarkupEditor = function(fileId) {
  const fileObj = attachedFiles.find(f => f.id === fileId);
  if (!fileObj) return;

  markupActiveFileId = fileId;
  markupHistory = [];

  const titleEl = document.getElementById('markupPhotoTitle');
  if (titleEl) {
    const rawName = fileObj.name || 'Photo';
    const shortName = rawName.length > 20 
      ? rawName.substring(0, 10) + '...' + rawName.substring(rawName.length - 8)
      : rawName;
    titleEl.textContent = `Markup: ${shortName}`;
    titleEl.title = rawName;
  }

  const canvas = document.getElementById('markupCanvas');
  const ctx = canvas.getContext('2d');

  const img = new Image();
  img.onload = () => {
    currentLoadedImage = img;
    let width = img.naturalWidth || img.width;
    let height = img.naturalHeight || img.height;

    const maxDim = 2000;
    if (width > maxDim || height > maxDim) {
      if (width > height) {
        height = Math.round((height * maxDim) / width);
        width = maxDim;
      } else {
        width = Math.round((width * maxDim) / height);
        height = maxDim;
      }
    }

    canvas.width = width;
    canvas.height = height;

    ctx.drawImage(img, 0, 0, width, height);

    const modal = document.getElementById('markupModal');
    if (modal) modal.classList.add('active');
  };

  img.src = fileObj.previewUrl || URL.createObjectURL(fileObj.file);
};

function saveMarkupChanges() {
  if (!markupActiveFileId) return;
  const canvas = document.getElementById('markupCanvas');
  const fileObjIndex = attachedFiles.findIndex(f => f.id === markupActiveFileId);
  if (fileObjIndex === -1) return;

  showLoading(true, 'Saving Marked-up Photo', 'Updating photo with your annotations...');

  canvas.toBlob((blob) => {
    showLoading(false);
    if (!blob) {
      alert('Could not save annotated image.');
      return;
    }

    const origName = attachedFiles[fileObjIndex].name;
    const dotIdx = origName.lastIndexOf('.');
    const baseName = dotIdx !== -1 ? origName.substring(0, dotIdx) : origName;
    const newName = baseName.endsWith('_annotated') ? origName : `${baseName}_annotated.jpg`;

    const newFile = new File([blob], newName, { type: 'image/jpeg', lastModified: Date.now() });

    if (attachedFiles[fileObjIndex].previewUrl) {
      URL.revokeObjectURL(attachedFiles[fileObjIndex].previewUrl);
    }

    attachedFiles[fileObjIndex].file = newFile;
    attachedFiles[fileObjIndex].name = newName;
    attachedFiles[fileObjIndex].size = blob.size;
    attachedFiles[fileObjIndex].type = 'image/jpeg';
    attachedFiles[fileObjIndex].previewUrl = URL.createObjectURL(blob);

    renderFileList();
    closeMarkupEditor();
    showToast('✅ Photo markup saved and updated in files list!');
  }, 'image/jpeg', 0.92);
}
