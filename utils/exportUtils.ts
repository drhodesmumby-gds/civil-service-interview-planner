import { InterviewSection, InterviewProfile, Theme } from '../types';

export const exportAsText = (
  sections: InterviewSection[], 
  profile?: Partial<InterviewProfile>
) => {
  let content = `==================================================\n`;
  content += `CIVIL SERVICE INTERVIEW PREPARATION NOTES\n`;
  content += `==================================================\n\n`;
  
  if (profile && (profile.roleTitle || profile.grade || profile.department || profile.team)) {
    content += `JOB DETAILS:\n`;
    if (profile.roleTitle) content += `- Role Title: ${profile.roleTitle}\n`;
    if (profile.grade) content += `- Grade: ${profile.grade}\n`;
    if (profile.department) content += `- Department: ${profile.department}\n`;
    if (profile.team) content += `- Team: ${profile.team}\n`;
    content += `\n`;
  }
  
  if (profile && profile.requiredBehaviours && profile.requiredBehaviours.length > 0) {
    content += `BEHAVIOURS / COMPETENCIES:\n`;
    profile.requiredBehaviours.forEach(b => {
      content += `- ${b}\n`;
    });
    content += `\n`;
  }

  const totalMins = sections.reduce((sum, s) => sum + (s.durationMinutes || 0), 0);
  
  content += `==================================================\n`;
  content += `INTERVIEW SECTIONS & STARR NOTES (${totalMins} Mins Total)\n`;
  content += `==================================================\n\n`;
  
  sections.forEach((sec, idx) => {
    content += `SECTION ${idx + 1}: ${sec.title.toUpperCase()} (${sec.durationMinutes} Mins)\n`;
    if (sec.questionText) {
      content += `Question: ${sec.questionText}\n`;
    }
    content += `--------------------------------------------------\n`;
    content += `${sec.notes || 'No notes provided.'}\n\n`;
  });

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const fileName = (profile?.roleTitle || 'Civil_Service').replace(/[^a-z0-9]/gi, '_') + '_Interview_Notes.txt';
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const exportAsPdf = (
  sections: InterviewSection[], 
  profile: Partial<InterviewProfile> = {},
  theme?: Theme
) => {
  const isGds = true;

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <title>${profile.roleTitle || 'Civil Service'} Interview Notes</title>
        <style>
          @page {
            size: A4;
            margin: 1.5cm;
          }
          body {
            font-family: ${isGds ? '"GDS Transport", arial, sans-serif' : 'system-ui, -apple-system, sans-serif'};
            color: #0b0c0c;
            line-height: 1.5;
            margin: 0;
            padding: 20px;
            background: #ffffff;
          }
          .header {
            border-bottom: ${isGds ? '4px solid #1d70b8' : '3px solid #2563eb'};
            padding-bottom: 12px;
            margin-bottom: 24px;
          }
          h1 {
            font-size: 24px;
            margin: 0 0 6px 0;
            color: ${isGds ? '#0b0c0c' : '#0f172a'};
          }
          .subtitle {
            font-size: 14px;
            color: ${isGds ? '#505a5f' : '#64748b'};
            margin: 0;
          }
          .meta-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
            background: ${isGds ? '#f3f2f1' : '#f8fafc'};
            padding: 16px;
            border-left: ${isGds ? '4px solid #1d70b8' : '4px solid #3b82f6'};
            margin-bottom: 24px;
            border-radius: 4px;
          }
          .meta-item {
            font-size: 13px;
          }
          .meta-label {
            font-weight: bold;
            color: ${isGds ? '#505a5f' : '#475569'};
          }
          .section-card {
            border: ${isGds ? '2px solid #b1b4b6' : '1px solid #e2e8f0'};
            border-left: ${isGds ? '6px solid #1d70b8' : '4px solid #2563eb'};
            padding: 16px;
            margin-bottom: 20px;
            page-break-inside: avoid;
            background: #ffffff;
            border-radius: ${isGds ? '0' : '8px'};
          }
          .section-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid ${isGds ? '#b1b4b6' : '#f1f5f9'};
            padding-bottom: 8px;
            margin-bottom: 12px;
          }
          .section-title {
            font-size: 16px;
            font-weight: bold;
            color: ${isGds ? '#0b0c0c' : '#1e293b'};
            margin: 0;
          }
          .duration-badge {
            font-size: 12px;
            font-weight: bold;
            padding: 2px 8px;
            background: ${isGds ? '#1d70b8' : '#eff6ff'};
            color: ${isGds ? '#ffffff' : '#1d4ed8'};
            border-radius: 4px;
          }
          .question-box {
            font-style: italic;
            background: ${isGds ? '#f3f2f1' : '#f8fafc'};
            padding: 10px 14px;
            margin-bottom: 12px;
            border-left: 3px solid ${isGds ? '#0b0c0c' : '#94a3b8'};
            font-size: 13px;
          }
          .notes-content {
            white-space: pre-wrap;
            font-size: 13px;
            line-height: 1.6;
            color: ${isGds ? '#0b0c0c' : '#334155'};
          }
          .action-bar {
            position: fixed;
            top: 12px;
            right: 12px;
            background: #ffffff;
            padding: 8px 16px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            display: flex;
            gap: 8px;
            z-index: 1000;
          }
          .btn-print {
            background: #1d70b8;
            color: #ffffff;
            border: none;
            padding: 8px 16px;
            font-weight: bold;
            border-radius: 4px;
            cursor: pointer;
            font-size: 13px;
          }
          .btn-print:hover {
            background: #003078;
          }
          @media print {
            .action-bar { display: none !important; }
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="action-bar">
          <button class="btn-print" onclick="window.print()">🖨️ Print / Save as PDF</button>
        </div>

        <div class="header">
          <h1>Civil Service Interview Companion</h1>
          <p class="subtitle">Structured Interview Preparation Notes & Timing Guide</p>
        </div>

        ${(profile.roleTitle || profile.grade || profile.department || (profile.requiredBehaviours && profile.requiredBehaviours.length)) ? `
          <div class="meta-grid">
            ${profile.roleTitle ? `<div class="meta-item"><span class="meta-label">Role:</span> ${profile.roleTitle}</div>` : ''}
            ${profile.grade ? `<div class="meta-item"><span class="meta-label">Grade:</span> ${profile.grade}</div>` : ''}
            ${profile.department ? `<div class="meta-item"><span class="meta-label">Department:</span> ${profile.department}</div>` : ''}
            ${profile.team ? `<div class="meta-item"><span class="meta-label">Team:</span> ${profile.team}</div>` : ''}
            ${profile.requiredBehaviours && profile.requiredBehaviours.length ? `<div class="meta-item" style="grid-column: span 2;"><span class="meta-label">Behaviours:</span> ${profile.requiredBehaviours.join(', ')}</div>` : ''}
          </div>
        ` : ''}

        <h2 style="font-size: 18px; margin-bottom: 16px;">
          Interview Sections (${sections.reduce((a, b) => a + (b.durationMinutes || 0), 0)} Minutes Total)
        </h2>

        ${sections.map((sec, idx) => `
          <div class="section-card">
            <div class="section-header">
              <span class="section-title">Section ${idx + 1}: ${sec.title}</span>
              <span class="duration-badge">${sec.durationMinutes} mins</span>
            </div>
            ${sec.questionText ? `<div class="question-box"><strong>Question:</strong> ${sec.questionText}</div>` : ''}
            <div class="notes-content">${sec.notes || '<em>No notes added for this section.</em>'}</div>
          </div>
        `).join('')}

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
    </html>
  `;

  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const printWindow = window.open(url, '_blank');
  if (!printWindow) {
    alert('Please allow popups to open the PDF export preview.');
  }
};
