import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getDatabase, ref, onValue, update } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyBWTSFTecq2_qEdyG90mM1hPNytwPXYyZ0",
  authDomain: "admin-37e09.firebaseapp.com",
  databaseURL: "https://admin-37e09-default-rtdb.firebaseio.com",
  projectId: "admin-37e09",
  storageBucket: "admin-37e09.firebasestorage.app",
  messagingSenderId: "637953105703",
  appId: "1:637953105703:web:db22cf323186b157de5302"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Theme Logic
const themeToggle = document.getElementById('themeToggle');
const body = document.body;
const icon = themeToggle.querySelector('i');
const savedTheme = localStorage.getItem('theme') || 'dark';
body.setAttribute('data-theme', savedTheme);
icon.className = savedTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';

themeToggle.addEventListener('click', () => {
  const newTheme = body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  body.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  icon.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
});

// Admin Logic
let allReports = [];
const reportsGrid = document.getElementById('reportsGrid');
const searchInput = document.getElementById('searchInput');
const modal = document.getElementById('imageModal');
const modalImg = document.getElementById('modalImg');
const closeModal = document.getElementById('closeModal');

closeModal.addEventListener('click', () => modal.classList.remove('active'));
modal.addEventListener('click', (e) => {
  if (e.target === modal) modal.classList.remove('active');
});

const reportsRef = ref(db, 'reports');

onValue(reportsRef, (snapshot) => {
  allReports = [];
  const data = snapshot.val();
  
  let newC = 0, revC = 0, resC = 0;

  if (data) {
    Object.keys(data).forEach(key => {
      const report = { id: key, ...data[key] };
      allReports.push(report);
      
      if(report.status === 'new') newC++;
      if(report.status === 'review') revC++;
      if(report.status === 'resolved') resC++;
    });
  }

  // Sort newest first
  allReports.sort((a, b) => b.createdAt - a.createdAt);
  
  // Update Stats
  document.getElementById('totalCount').innerText = allReports.length;
  document.getElementById('newCount').innerText = newC;
  document.getElementById('reviewCount').innerText = revC;
  document.getElementById('resolvedCount').innerText = resC;

  renderReports(allReports);
});

searchInput.addEventListener('input', (e) => {
  const query = e.target.value.toLowerCase();
  const filtered = allReports.filter(r => 
    r.name.toLowerCase().includes(query) || 
    r.email.toLowerCase().includes(query) ||
    r.phone.includes(query)
  );
  renderReports(filtered);
});

function renderReports(reports) {
  reportsGrid.innerHTML = '';
  
  if(reports.length === 0) {
    reportsGrid.innerHTML = '<p style="text-align:center; width:100%; color:var(--text-muted);">لا توجد بلاغات مطابقة.</p>';
    return;
  }

  reports.forEach(report => {
    const dateStr = new Date(report.createdAt).toLocaleString('ar-EG');
    
    const card = document.createElement('div');
    card.className = 'report-card';
    
    let imgHTML = '';
    if (report.hasImage && report.image) {
      imgHTML = `<img src="${report.image}" class="report-image" onclick="openModal('${report.image}')" alt="صورة المشكلة">`;
    }

    card.innerHTML = `
      <div class="report-header">
        <span class="report-name">${report.name}</span>
        <span class="report-date">${dateStr}</span>
      </div>
      <div class="report-info">
        <p><i class="fas fa-envelope"></i> ${report.email}</p>
        <p><i class="fas fa-phone"></i> <span dir="ltr">${report.phone}</span></p>
      </div>
      <div class="report-problem">${report.problem}</div>
      ${imgHTML}
      <div style="margin-top: auto; padding-top: 15px; border-top: 1px solid var(--glass-border);">
        <select class="status-select" data-id="${report.id}">
          <option value="new" ${report.status === 'new' ? 'selected' : ''}>جديد</option>
          <option value="review" ${report.status === 'review' ? 'selected' : ''}>قيد المراجعة</option>
          <option value="resolved" ${report.status === 'resolved' ? 'selected' : ''}>تم الحل</option>
        </select>
      </div>
    `;
    
    reportsGrid.appendChild(card);
  });

  // Attach event listeners to select elements
  document.querySelectorAll('.status-select').forEach(select => {
    select.addEventListener('change', async (e) => {
      const repId = e.target.getAttribute('data-id');
      const newStatus = e.target.value;
      const rRef = ref(db, `reports/${repId}`);
      await update(rRef, { status: newStatus });
    });
  });
}

window.openModal = function(src) {
  modalImg.src = src;
  modal.classList.add('active');
}
