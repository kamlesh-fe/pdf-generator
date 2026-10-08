/**
 * Sample HTML Templates
 * Self-contained documents with print-optimized CSS.
 */

export const TEMPLATES = {
  invoice: {
    name: "Commercial Invoice",
    filename: "invoice_INV-2026-001.pdf",
    pageSize: "a4",
    orientation: "portrait",
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Invoice #INV-2026-001</title>
  <style>
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    @page {
      size: A4;
      margin: 15mm;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      line-height: 1.5;
      margin: 0;
      padding: 24px;
      background: #ffffff;
      font-size: 13px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #2563eb;
      padding-bottom: 20px;
      margin-bottom: 24px;
    }
    .brand h1 {
      margin: 0;
      font-size: 24px;
      color: #1e3a8a;
      letter-spacing: -0.5px;
    }
    .brand p {
      margin: 4px 0 0;
      color: #64748b;
      font-size: 12px;
    }
    .inv-meta {
      text-align: right;
    }
    .inv-badge {
      display: inline-block;
      background: #eff6ff;
      color: #1d4ed8;
      font-weight: 700;
      font-size: 13px;
      padding: 4px 12px;
      border-radius: 6px;
      border: 1px solid #bfdbfe;
    }
    .inv-meta p {
      margin: 4px 0;
      color: #64748b;
      font-size: 12px;
    }
    .grid {
      display: flex;
      gap: 20px;
      margin-bottom: 24px;
    }
    .card {
      flex: 1;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 14px 16px;
    }
    .card h3 {
      margin: 0 0 8px;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #64748b;
    }
    .card strong {
      display: block;
      color: #0f172a;
      font-size: 14px;
      margin-bottom: 2px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
    }
    th {
      background: #0f172a;
      color: #ffffff;
      font-weight: 600;
      text-align: left;
      padding: 10px 12px;
      font-size: 12px;
    }
    th.right, td.right {
      text-align: right;
    }
    td {
      padding: 10px 12px;
      border-bottom: 1px solid #e2e8f0;
    }
    tr:nth-child(even) td {
      background: #f8fafc;
    }
    .summary-section {
      display: flex;
      justify-content: flex-end;
    }
    .summary-table {
      width: 260px;
    }
    .summary-table td {
      padding: 6px 12px;
      border: none;
    }
    .summary-table .total-row td {
      border-top: 2px solid #0f172a;
      font-size: 15px;
      font-weight: 700;
      color: #1e3a8a;
      padding-top: 10px;
    }
    .footer {
      margin-top: 36px;
      padding-top: 16px;
      border-top: 1px solid #e2e8f0;
      text-align: center;
      color: #94a3b8;
      font-size: 11px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">
      <h1>ACME DIGITAL STUDIO</h1>
      <p>123 Creative Avenue, Suite 400 &bull; San Francisco, CA</p>
    </div>
    <div class="inv-meta">
      <div class="inv-badge">INVOICE #INV-2026-001</div>
      <p>Issue Date: Oct 08, 2026</p>
      <p>Due Date: Oct 22, 2026</p>
    </div>
  </div>

  <div class="grid">
    <div class="card">
      <h3>Billed To:</h3>
      <strong>Nexus Enterprise Inc.</strong>
      <div>Attn: Alex Johnson</div>
      <div>742 Evergreen Terrace</div>
      <div>Chicago, IL 60601</div>
    </div>
    <div class="card">
      <h3>Payment Details:</h3>
      <strong>Bank Wire Transfer</strong>
      <div>Account: 9876-5432-1098</div>
      <div>Routing: 123456789</div>
      <div>Status: <span style="color: #16a34a; font-weight: 600;">Pending Payment</span></div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th class="right">Qty</th>
        <th class="right">Unit Price</th>
        <th class="right">Total</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Web Application Redesign &amp; UX Prototyping</td>
        <td class="right">1</td>
        <td class="right">$3,500.00</td>
        <td class="right">$3,500.00</td>
      </tr>
      <tr>
        <td>Front-End Engineering (HTML5, Tailwind, Vue)</td>
        <td class="right">40 hrs</td>
        <td class="right">$95.00</td>
        <td class="right">$3,800.00</td>
      </tr>
      <tr>
        <td>Performance &amp; SEO Optimization Audit</td>
        <td class="right">1</td>
        <td class="right">$750.00</td>
        <td class="right">$750.00</td>
      </tr>
    </tbody>
  </table>

  <div class="summary-section">
    <table class="summary-table">
      <tr>
        <td>Subtotal:</td>
        <td class="right">$8,050.00</td>
      </tr>
      <tr>
        <td>Tax (8.5%):</td>
        <td class="right">$684.25</td>
      </tr>
      <tr class="total-row">
        <td>Amount Due:</td>
        <td class="right">$8,734.25</td>
      </tr>
    </table>
  </div>

  <div class="footer">
    Thank you for your business! Please direct questions to billing@acmedigital.com.
  </div>
</body>
</html>`
  },

  report: {
    name: "Executive Report",
    filename: "executive_summary_q3.pdf",
    pageSize: "a4",
    orientation: "portrait",
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Q3 Executive Performance Report</title>
  <style>
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    @page {
      size: A4;
      margin: 15mm;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      line-height: 1.6;
      margin: 0;
      padding: 24px;
      font-size: 13px;
    }
    .header {
      border-bottom: 3px solid #0f172a;
      padding-bottom: 16px;
      margin-bottom: 24px;
    }
    .tag {
      display: inline-block;
      background: #0f172a;
      color: #ffffff;
      font-size: 11px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 4px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    h1 {
      margin: 8px 0 4px;
      font-size: 24px;
      color: #0f172a;
    }
    .meta {
      color: #64748b;
      font-size: 12px;
    }
    .kpi-row {
      display: flex;
      gap: 16px;
      margin-bottom: 24px;
    }
    .kpi-card {
      flex: 1;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 16px;
      border-left: 4px solid #2563eb;
    }
    .kpi-title {
      font-size: 11px;
      color: #64748b;
      text-transform: uppercase;
      font-weight: 600;
    }
    .kpi-value {
      font-size: 22px;
      font-weight: 700;
      color: #0f172a;
      margin: 4px 0;
    }
    .kpi-change {
      font-size: 12px;
      color: #16a34a;
      font-weight: 600;
    }
    h2 {
      font-size: 16px;
      color: #1e293b;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 6px;
      margin: 24px 0 12px;
    }
    p {
      margin: 0 0 12px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
    }
    th {
      background: #f1f5f9;
      color: #334155;
      font-size: 12px;
      font-weight: 600;
      text-align: left;
      padding: 8px 12px;
      border-bottom: 2px solid #cbd5e1;
    }
    td {
      padding: 8px 12px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 12px;
    }
    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
    }
    .badge-success { background: #dcfce7; color: #15803d; }
    .badge-info { background: #e0f2fe; color: #0369a1; }
  </style>
</head>
<body>
  <div class="header">
    <span class="tag">Confidential</span>
    <h1>Q3 Executive Performance &amp; Growth Report</h1>
    <div class="meta">Prepared by: Global Strategy &bull; Date: October 2026 &bull; Version 1.0</div>
  </div>

  <div class="kpi-row">
    <div class="kpi-card">
      <div class="kpi-title">Gross Revenue</div>
      <div class="kpi-value">$4,280,000</div>
      <div class="kpi-change">+18.4% vs target</div>
    </div>
    <div class="kpi-card" style="border-left-color: #10b981;">
      <div class="kpi-title">Active Customers</div>
      <div class="kpi-value">12,450</div>
      <div class="kpi-change">+1,200 this quarter</div>
    </div>
    <div class="kpi-card" style="border-left-color: #8b5cf6;">
      <div class="kpi-title">System Uptime</div>
      <div class="kpi-value">99.98%</div>
      <div class="kpi-change">Zero critical outages</div>
    </div>
  </div>

  <h2>1. Executive Summary</h2>
  <p>
    During Q3 2026, the company exceeded revenue milestones across enterprise and self-service tiers. Customer retention stood at 96.2%, driven by enhancements to platform stability and our new automated reporting engine.
  </p>

  <h2>2. Departmental Milestones</h2>
  <table>
    <thead>
      <tr>
        <th>Workstream</th>
        <th>Owner</th>
        <th>Deliverable</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Platform Infrastructure</td>
        <td>Cloud Ops</td>
        <td>Multi-region database migration</td>
        <td><span class="badge badge-success">Completed</span></td>
      </tr>
      <tr>
        <td>Product Engineering</td>
        <td>Core Team</td>
        <td>HTML to PDF generation pipeline</td>
        <td><span class="badge badge-success">Completed</span></td>
      </tr>
      <tr>
        <td>Security &amp; Compliance</td>
        <td>InfoSec</td>
        <td>SOC 2 Type II recertification</td>
        <td><span class="badge badge-info">In Progress</span></td>
      </tr>
    </tbody>
  </table>
</body>
</html>`
  },

  resume: {
    name: "Professional Resume",
    filename: "resume_sarah_connor.pdf",
    pageSize: "a4",
    orientation: "portrait",
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Resume - Sarah Connor</title>
  <style>
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    @page {
      size: A4;
      margin: 15mm;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      line-height: 1.5;
      margin: 0;
      padding: 24px;
      font-size: 12.5px;
    }
    .header {
      border-bottom: 2px solid #0f172a;
      padding-bottom: 12px;
      margin-bottom: 16px;
    }
    h1 {
      margin: 0 0 4px;
      font-size: 24px;
      color: #0f172a;
    }
    .role {
      font-size: 14px;
      color: #2563eb;
      font-weight: 600;
      margin-bottom: 6px;
    }
    .contact {
      color: #64748b;
      font-size: 11.5px;
    }
    h2 {
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #0f172a;
      border-bottom: 1px solid #cbd5e1;
      padding-bottom: 4px;
      margin: 16px 0 10px;
    }
    .item {
      margin-bottom: 12px;
    }
    .item-header {
      display: flex;
      justify-content: space-between;
      font-weight: 600;
      color: #0f172a;
    }
    .item-sub {
      color: #64748b;
      font-size: 11.5px;
      margin-bottom: 4px;
    }
    ul {
      margin: 4px 0 0 18px;
      padding: 0;
    }
    li {
      margin-bottom: 3px;
    }
    .skills-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .skill-pill {
      background: #f1f5f9;
      color: #334155;
      padding: 3px 10px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 500;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Sarah Connor</h1>
    <div class="role">Staff Software Engineer &bull; Full-Stack Architect</div>
    <div class="contact">
      sarah.connor@example.com &bull; +1 (555) 234-5678 &bull; San Francisco, CA &bull; github.com/sconnor
    </div>
  </div>

  <h2>Professional Experience</h2>
  <div class="item">
    <div class="item-header">
      <span>Lead Full-Stack Engineer &bull; CloudScale Tech</span>
      <span>2022 &ndash; Present</span>
    </div>
    <div class="item-sub">San Francisco, CA</div>
    <ul>
      <li>Architected high-throughput document processing engine generating over 500k client PDFs monthly.</li>
      <li>Reduced front-end bundle size by 42% through code-splitting and asset optimization.</li>
      <li>Mentored 8 mid-level engineers and established team-wide automated test standards.</li>
    </ul>
  </div>

  <div class="item">
    <div class="item-header">
      <span>Senior Web Developer &bull; Acme Solutions</span>
      <span>2019 &ndash; 2022</span>
    </div>
    <div class="item-sub">Austin, TX</div>
    <ul>
      <li>Engineered customer-facing billing dashboard handling $12M annual transactions.</li>
      <li>Created reusable design system components used across 5 company web applications.</li>
    </ul>
  </div>

  <h2>Education</h2>
  <div class="item">
    <div class="item-header">
      <span>B.S. in Computer Science &bull; University of Texas</span>
      <span>2015 &ndash; 2019</span>
    </div>
    <div class="item-sub">Summa Cum Laude (GPA: 3.92 / 4.0)</div>
  </div>

  <h2>Technical Skills</h2>
  <div class="skills-grid">
    <span class="skill-pill">JavaScript (ES6+)</span>
    <span class="skill-pill">TypeScript</span>
    <span class="skill-pill">HTML5 / CSS3</span>
    <span class="skill-pill">Node.js</span>
    <span class="skill-pill">React</span>
    <span class="skill-pill">Vue.js</span>
    <span class="skill-pill">Tailwind CSS</span>
    <span class="skill-pill">PDF Generation</span>
    <span class="skill-pill">REST &amp; GraphQL APIs</span>
    <span class="skill-pill">Docker &amp; CI/CD</span>
  </div>
</body>
</html>`
  },

  certificate: {
    name: "Award Certificate (Landscape)",
    filename: "certificate_of_achievement.pdf",
    pageSize: "a4",
    orientation: "landscape",
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Certificate of Achievement</title>
  <style>
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    @page {
      size: A4 landscape;
      margin: 12mm;
    }
    body {
      font-family: 'Georgia', 'Times New Roman', serif;
      background: #faf8f5;
      color: #2c2316;
      margin: 0;
      padding: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
    }
    .cert-frame {
      width: 100%;
      height: 100%;
      border: 6px double #b8860b;
      outline: 2px solid #d4af37;
      outline-offset: -12px;
      background: #ffffff;
      padding: 36px 48px;
      text-align: center;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
      box-shadow: inset 0 0 40px rgba(184, 134, 11, 0.05);
    }
    .kicker {
      font-family: -apple-system, sans-serif;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.25em;
      text-transform: uppercase;
      color: #996515;
    }
    h1 {
      font-size: 34px;
      font-weight: 400;
      letter-spacing: 0.06em;
      color: #1a150e;
      margin: 10px 0 4px;
      text-transform: uppercase;
    }
    .subtitle {
      font-size: 13px;
      font-style: italic;
      color: #7a6a52;
    }
    .recipient {
      font-size: 32px;
      font-family: 'Brush Script MT', 'Bickham Script Pro', cursive, serif;
      color: #8b6508;
      border-bottom: 2px solid #d4af37;
      display: inline-block;
      margin: 16px auto;
      padding: 0 40px 6px;
      min-width: 380px;
    }
    .reason {
      font-size: 14px;
      line-height: 1.6;
      max-width: 680px;
      margin: 0 auto;
      color: #4a3e2e;
    }
    .meta-row {
      display: flex;
      justify-content: space-around;
      align-items: flex-end;
      margin-top: 30px;
      padding: 0 30px;
    }
    .signature-block {
      text-align: center;
      width: 200px;
    }
    .sig-line {
      border-top: 1px solid #7a6a52;
      margin-top: 30px;
      padding-top: 6px;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #665239;
      font-family: -apple-system, sans-serif;
    }
    .seal {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      background: radial-gradient(circle, #f3e5ab 0%, #d4af37 70%, #aa820a 100%);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      border: 3px double #ffffff;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
    }
  </style>
</head>
<body>
  <div class="cert-frame">
    <div>
      <div class="kicker">Apex Institute of Technology</div>
      <h1>Certificate of Achievement</h1>
      <div class="subtitle">This certificate is proudly conferred upon</div>
    </div>

    <div>
      <div class="recipient">Alexander Morgan</div>
      <p class="reason">
        For extraordinary proficiency and groundbreaking contributions in Full-Stack Architecture, Clean Code Engineering, and Scalable Cloud Systems.
      </p>
    </div>

    <div class="meta-row">
      <div class="signature-block">
        <div class="sig-line">Dr. Eleanor Vance<br><small>Dean of Academics</small></div>
      </div>
      <div class="seal">VERIFIED</div>
      <div class="signature-block">
        <div class="sig-line">October 08, 2026<br><small>Date of Issuance</small></div>
      </div>
    </div>
  </div>
</body>
</html>`
  },

  payslip: {
    name: "Salary Payslip",
    filename: "payslip_october_2026.pdf",
    pageSize: "a4",
    orientation: "portrait",
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Payslip - October 2026</title>
  <style>
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    @page {
      size: A4;
      margin: 15mm;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #1e293b;
      margin: 0;
      padding: 24px;
      font-size: 12px;
      line-height: 1.5;
      background: #ffffff;
    }
    .corp-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 14px;
      margin-bottom: 18px;
    }
    .corp-title h1 {
      margin: 0;
      font-size: 20px;
      color: #0f172a;
      letter-spacing: -0.02em;
    }
    .corp-title p {
      margin: 2px 0 0;
      color: #64748b;
      font-size: 11px;
    }
    .slip-badge {
      text-align: right;
    }
    .slip-badge span {
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 4px;
      font-size: 12px;
      color: #0f172a;
    }
    .emp-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
    }
    .emp-table td {
      padding: 8px 12px;
      border: 1px solid #e2e8f0;
      font-size: 11.5px;
    }
    .emp-table td.label {
      font-weight: 600;
      color: #475569;
      background: #f1f5f9;
      width: 25%;
    }
    .financials-grid {
      display: flex;
      gap: 16px;
      margin-bottom: 20px;
    }
    .fin-card {
      flex: 1;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      overflow: hidden;
    }
    .fin-header {
      background: #0f172a;
      color: #ffffff;
      padding: 8px 12px;
      font-weight: 600;
      font-size: 12px;
      display: flex;
      justify-content: space-between;
    }
    .fin-table {
      width: 100%;
      border-collapse: collapse;
    }
    .fin-table td {
      padding: 7px 12px;
      border-bottom: 1px solid #f1f5f9;
    }
    .fin-table tr:last-child td {
      border-bottom: none;
      font-weight: 700;
      background: #f8fafc;
      border-top: 1px solid #cbd5e1;
    }
    .right { text-align: right; }
    .net-banner {
      background: #ecfdf5;
      border: 2px solid #10b981;
      border-radius: 8px;
      padding: 14px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }
    .net-label {
      font-size: 14px;
      font-weight: 700;
      color: #065f46;
    }
    .net-amount {
      font-size: 22px;
      font-weight: 800;
      color: #047857;
    }
    .footer-note {
      font-size: 10.5px;
      color: #94a3b8;
      text-align: center;
      border-top: 1px solid #e2e8f0;
      padding-top: 14px;
    }
  </style>
</head>
<body>
  <div class="corp-header">
    <div class="corp-title">
      <h1>METROLOGIC SYSTEMS PVT. LTD.</h1>
      <p>CIN: U72200DL2018PTC123456 &bull; Cyber City, Gurugram, India</p>
    </div>
    <div class="slip-badge">
      <span>PAYSLIP: OCT 2026</span>
    </div>
  </div>

  <table class="emp-table">
    <tr>
      <td class="label">Employee Name:</td>
      <td>Rohan Sharma</td>
      <td class="label">Employee ID:</td>
      <td>MET-2024-892</td>
    </tr>
    <tr>
      <td class="label">Designation:</td>
      <td>Senior Product Designer</td>
      <td class="label">Department:</td>
      <td>UI/UX &amp; Creative</td>
    </tr>
    <tr>
      <td class="label">Bank Account:</td>
      <td>HDFC Bank &bull;&bull;&bull;&bull; 4091</td>
      <td class="label">PAN / UAN:</td>
      <td>ABCDE1234F / 101234567890</td>
    </tr>
    <tr>
      <td class="label">Working Days:</td>
      <td>31 Days</td>
      <td class="label">Paid Days:</td>
      <td>31 Days (0 LOP)</td>
    </tr>
  </table>

  <div class="financials-grid">
    <div class="fin-card">
      <div class="fin-header">
        <span>Earnings</span>
        <span>Amount (₹)</span>
      </div>
      <table class="fin-table">
        <tr><td>Basic Salary</td><td class="right">₹55,000</td></tr>
        <tr><td>House Rent Allowance (HRA)</td><td class="right">₹22,000</td></tr>
        <tr><td>Special Allowance</td><td class="right">₹18,500</td></tr>
        <tr><td>Performance Bonus</td><td class="right">₹7,500</td></tr>
        <tr><td>Total Gross Earnings</td><td class="right">₹1,03,000</td></tr>
      </table>
    </div>

    <div class="fin-card">
      <div class="fin-header" style="background: #334155;">
        <span>Deductions</span>
        <span>Amount (₹)</span>
      </div>
      <table class="fin-table">
        <tr><td>Provident Fund (EPF Employee)</td><td class="right">₹1,800</td></tr>
        <tr><td>Professional Tax</td><td class="right">₹200</td></tr>
        <tr><td>Income Tax (TDS)</td><td class="right">₹8,400</td></tr>
        <tr><td>Health Insurance</td><td class="right">₹1,200</td></tr>
        <tr><td>Total Deductions</td><td class="right">₹11,600</td></tr>
      </table>
    </div>
  </div>

  <div class="net-banner">
    <div class="net-label">
      Net Disbursed Take-Home Pay
      <div style="font-size: 11px; font-weight: normal; color: #047857;">Ninety-One Thousand Four Hundred Rupees Only</div>
    </div>
    <div class="net-amount">₹91,400.00</div>
  </div>

  <div class="footer-note">
    This payslip is system-generated and does not require a physical signature. Direct payroll queries to hr@metrologic.io.
  </div>
</body>
</html>`
  }
};
