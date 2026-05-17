const API_URL = window.location.origin + '/api';

document.addEventListener('DOMContentLoaded', () => {
    initPage();
});

function initPage() {
    const path = window.location.pathname;
    const page = path.split('/').pop();
    if (page === '' || page === 'index.html' || path === '/' || path.endsWith('/')) {
        loadHomePage();
    } else if (page === 'university.html') {
        loadUniversityDetail();
    } else if (page === 'dashboard.html') {
        loadDashboard();
    }
}

// ========== HOME PAGE ==========
async function loadHomePage() {
    try {
        const [universities, students, majors] = await Promise.all([
            fetch(`${API_URL}/universities`).then(r => r.json()),
            fetch(`${API_URL}/students`).then(r => r.json()),
            fetch(`${API_URL}/majors`).then(r => r.json())
        ]);

        const uniCountEl = document.getElementById('uniCountStat');
        const studentCountEl = document.getElementById('studentCountStat');
        const majorCountEl = document.getElementById('majorCountStat');
        if (uniCountEl) uniCountEl.textContent = universities.length;
        if (studentCountEl) studentCountEl.textContent = students.length;
        if (majorCountEl) majorCountEl.textContent = majors.length;

        const grid = document.getElementById('universitiesGrid');
        if (grid && universities.length > 0) {
            const colors = [
                'linear-gradient(135deg, #667eea, #764ba2)',
                'linear-gradient(135deg, #f093fb, #f5576c)',
                'linear-gradient(135deg, #4facfe, #00f2fe)',
                'linear-gradient(135deg, #43e97b, #38f9d7)',
                'linear-gradient(135deg, #fa709a, #fee140)',
                'linear-gradient(135deg, #a18cd1, #fbc2eb)',
                'linear-gradient(135deg, #ff9a9e, #fecfef)'
            ];
            const uniIcons = { 1:'🔬',2:'🏛️',3:'💻',4:'🎓',5:'📚',6:'🔭',7:'⚡' };
            grid.innerHTML = universities.map((uni, index) => {
                const bgColor = colors[index % colors.length];
                const icon = uniIcons[uni.University_ID] || '🏛️';
                if (uni.photo) {
                    return `<div class="university-card" onclick="viewUniversity(${uni.University_ID})">
                        <div class="uni-card-image" style="background-image: url('${uni.photo}'); background-size: cover; background-position: center;">
                            <div class="uni-card-overlay"></div>
                            <div class="uni-card-badge">${uni.Type || 'University'}</div>
                        </div>
                        <div class="uni-card-content">
                            <h3>${uni.Name}</h3>
                            <div class="uni-card-info">
                                <span>📍 ${uni.Location || 'Egypt'}</span>
                                <span>📧 ${uni.Email || 'Contact'}</span>
                            </div>
                            <p style="color:#666;font-size:13px;">Click to explore programs and apply</p>
                        </div>
                    </div>`;
                } else {
                    return `<div class="university-card" onclick="viewUniversity(${uni.University_ID})">
                        <div class="uni-card-image" style="background: ${bgColor};">
                            <span style="font-size:70px;">${icon}</span>
                            <div class="uni-card-badge">${uni.Type || 'University'}</div>
                        </div>
                        <div class="uni-card-content">
                            <h3>${uni.Name}</h3>
                            <div class="uni-card-info">
                                <span>📍 ${uni.Location || 'Egypt'}</span>
                                <span>📧 ${uni.Email || 'Contact'}</span>
                            </div>
                            <p style="color:#666;font-size:13px;">Click to explore programs and apply</p>
                        </div>
                    </div>`;
                }
            }).join('');
        } else if (grid) {
            grid.innerHTML = '<p>No universities found.</p>';
        }
        loadFooterUniversities(universities);
    } catch (error) {
        console.error('Error loading homepage:', error);
        const grid = document.getElementById('universitiesGrid');
        if (grid) grid.innerHTML = '<p style="color:red;">Error loading universities. Please try again.</p>';
    }
}

function loadFooterUniversities(universities) {
    const footer = document.getElementById('footerUnis');
    if (!footer) return;
    footer.innerHTML = universities.map(uni => `<a href="#" onclick="event.preventDefault(); viewUniversity(${uni.University_ID})">${uni.Name}</a>`).join('');
}

function viewUniversity(id) { window.location.href = `university.html?id=${id}`; }
function scrollToUniversities() { const el = document.getElementById('universities'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }
function scrollToAbout() { const el = document.getElementById('about'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }
function scrollToContact() { const el = document.getElementById('contact'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }
function toggleMenu() { document.getElementById('navMenu').classList.toggle('active'); }

// ========== AUTH ==========
async function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const messageDiv = document.getElementById('loginMessage');
    try {
        const response = await fetch(`${API_URL}/students/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ Email: email, Password: password })
        });
        const data = await response.json();
        if (response.ok) {
            messageDiv.className = 'message success';
            messageDiv.textContent = 'Login successful! Redirecting...';
            localStorage.setItem('currentStudent', JSON.stringify(data.student));
            setTimeout(() => { window.location.href = 'dashboard.html'; }, 1000);
        } else {
            messageDiv.className = 'message error';
            messageDiv.textContent = data.error || 'Invalid credentials';
        }
    } catch (error) {
        messageDiv.className = 'message error';
        messageDiv.textContent = 'Connection error. Please try again.';
    }
}

async function handleRegister(event) {
    event.preventDefault();
    const messageDiv = document.getElementById('registerMessage');
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    const firstName = document.getElementById('regFirstName').value.trim();
    const lastName = document.getElementById('regLastName').value.trim();
    const dob = document.getElementById('regDOB').value;
    const phone = document.getElementById('regPhone').value.trim();
    const address = document.getElementById('regAddress').value.trim();

    // Check all fields are filled (extra safety)
    if (!firstName || !lastName || !email || !password || !dob || !phone || !address) {
        messageDiv.className = 'message error';
        messageDiv.textContent = 'All fields are required.';
        return;
    }

    if (password.length < 8) {
        messageDiv.className = 'message error';
        messageDiv.textContent = 'Password must be at least 8 characters';
        return;
    }
    if (!email.includes('@')) {
        messageDiv.className = 'message error';
        messageDiv.textContent = 'Please enter a valid email';
        return;
    }

    const btn = document.querySelector('#registerStep1 button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Sending...';
    messageDiv.textContent = '';

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
        const response = await fetch(`${API_URL}/students/send-code`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
            signal: controller.signal
        });
        clearTimeout(timeout);
        const data = await response.json();

        if (response.ok) {
            document.getElementById('registerStep1').style.display = 'none';
            document.getElementById('registerStep2').style.display = 'block';

            const fallbackMsg = document.getElementById('fallbackMessage');
            if (data.fallback) {
                document.getElementById('fallbackCode').textContent = data.code;
                if (fallbackMsg) fallbackMsg.style.display = 'block';
            } else {
                if (fallbackMsg) fallbackMsg.style.display = 'none';
            }
        } else {
            messageDiv.className = 'message error';
            messageDiv.textContent = data.error || 'Something went wrong';
        }
    } catch (error) {
        if (error.name === 'AbortError') {
            messageDiv.className = 'message error';
            messageDiv.textContent = 'Request timed out. Please try again.';
        } else {
            messageDiv.className = 'message error';
            messageDiv.textContent = 'Connection error.';
        }
    } finally {
        btn.disabled = false;
        btn.textContent = 'Send Verification Code';
    }
}

async function verifyAndRegister(event) {
    event.preventDefault();
    const messageDiv = document.getElementById('registerMessage');
    const email = document.getElementById('regEmail').value;
    const code = document.getElementById('verificationCode').value;

    const studentData = {
        First_Name: document.getElementById('regFirstName').value,
        Last_Name: document.getElementById('regLastName').value,
        Gender: document.getElementById('regGender').value,
        Date_of_Birth: document.getElementById('regDOB').value,
        Phone: document.getElementById('regPhone').value,
        Address: document.getElementById('regAddress').value,
        Password: document.getElementById('regPassword').value
    };

    // Quick check again for required fields (just in case)
    if (!studentData.First_Name || !studentData.Last_Name || !studentData.Gender || !studentData.Date_of_Birth || !studentData.Phone || !studentData.Address) {
        messageDiv.className = 'message error';
        messageDiv.textContent = 'All fields are required.';
        return;
    }

    try {
        const response = await fetch(`${API_URL}/students/verify-and-register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, code, ...studentData })
        });
        const data = await response.json();
        if (response.ok) {
            messageDiv.className = 'message success';
            messageDiv.textContent = 'Registration successful! Redirecting...';
            setTimeout(() => { window.location.href = 'login.html'; }, 1500);
        } else {
            messageDiv.className = 'message error';
            messageDiv.textContent = data.error;
        }
    } catch (error) {
        messageDiv.className = 'message error';
        messageDiv.textContent = 'Connection error.';
    }
}

function logout() { localStorage.removeItem('currentStudent'); window.location.href = 'index.html'; }
function checkAuth() {
    const student = JSON.parse(localStorage.getItem('currentStudent'));
    if (!student) { window.location.href = 'login.html'; return null; }
    return student;
}

// ========== UNIVERSITY DETAIL ==========
async function loadUniversityDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const uniId = urlParams.get('id');
    if (!uniId) { window.location.href = 'index.html'; return; }
    updateNavAuth();
    try {
        const response = await fetch(`${API_URL}/universities/${uniId}`);
        const university = await response.json();
        displayUniversityDetail(university);
    } catch (error) {
        document.getElementById('universityDetail').innerHTML = '<p style="color:red;">Error loading university details.</p>';
    }
}

function displayUniversityDetail(uni) {
    const container = document.getElementById('universityDetail');
    const colors = ['#667eea', '#f093fb', '#4facfe', '#43e97b', '#fa709a', '#a18cd1', '#ff9a9e'];
    const randomColor = colors[uni.University_ID % colors.length];
    const photos = uni.photos ? JSON.parse(uni.photos) : [];
    const mainPhoto = uni.photo || null;

    container.innerHTML = `
        <div class="uni-detail-header">
            <div class="uni-detail-image" style="background: linear-gradient(135deg, ${randomColor}, ${randomColor}dd);">
                ${mainPhoto ? `<img src="${mainPhoto}" alt="${uni.Name}" style="width:100%;height:100%;object-fit:cover;border-radius:20px;">` : `<span style="font-size:100px;">🏛️</span>`}
            </div>
            <div class="uni-detail-info">
                <h1>${uni.Name}</h1>
                <div class="uni-detail-meta">
                    <span class="meta-tag">📍 ${uni.Location || 'Egypt'}</span>
                    <span class="meta-tag">🏫 ${uni.Type || 'University'}</span>
                    ${uni.Email ? `<span class="meta-tag">📧 ${uni.Email}</span>` : ''}
                    ${uni.Phone ? `<span class="meta-tag">📞 ${uni.Phone}</span>` : ''}
                </div>
                <p>A prestigious university offering world-class education.</p>
                ${uni.Website ? (() => { let url = uni.Website; if (!url.startsWith('http')) url = 'https://' + url; return `<p><a href="${url}" target="_blank" style="color:#ff6600;">Visit Official Website →</a></p>`; })() : ''}
                ${localStorage.getItem('currentStudent') ? `<a href="dashboard.html" class="apply-btn">Apply Now →</a>` : `<a href="login.html" class="apply-btn">Login to Apply →</a>`}
            </div>
        </div>

        ${uni.prosCons && uni.prosCons.length > 0 ? `
        <div class="pros-cons-section">
            <h4 style="color:#2e7d32;">✅ Pros</h4>
            <ul>${uni.prosCons.filter(p => p.type === 'pro').map(p => `<li>${p.text}</li>`).join('')}</ul>
            <h4 style="color:#c62828;">❌ Cons</h4>
            <ul>${uni.prosCons.filter(p => p.type === 'con').map(p => `<li>${p.text}</li>`).join('')}</ul>
        </div>` : ''}

        ${photos.length > 0 ? `
        <div class="photo-gallery-section">
            <h2>📸 Campus Photos</h2>
            <div class="photo-gallery">
                ${photos.map(photo => `<div class="gallery-item" onclick="openPhotoModal('${photo}')"><img src="${photo}" alt="Photo"></div>`).join('')}
            </div>
        </div>` : ''}

        <h2>Colleges & Programs</h2>
        <p style="color:#666;">Click on a college to view detailed study plan</p>
        <div class="colleges-grid">
            ${uni.colleges && uni.colleges.length > 0 ? uni.colleges.map(college => {
                const allFees = college.majors.flatMap(m => m.fees || []);
                const feeValues = allFees.map(f => (parseFloat(f.Tuition_Fee)||0)+(parseFloat(f.Registration_Fee)||0)+(parseFloat(f.Other_Fees)||0));
                const minFee = feeValues.length ? Math.min(...feeValues) : null;
                const maxFee = feeValues.length ? Math.max(...feeValues) : null;
                const feeText = minFee ? (minFee === maxFee ? `💰 ${minFee.toLocaleString()} EGP` : `💰 ${minFee.toLocaleString()} – ${maxFee.toLocaleString()} EGP`) : '';
                return `
                <div class="college-card" onclick="showStudyPlan('${college.Name.replace(/'/g, "\\'")}', ${JSON.stringify(college.majors || []).replace(/"/g, '&quot;')})">
                    <h4>${college.Name}</h4>
                    <p>${college.Description || ''}</p>
                    ${feeText ? `<p style="color:#31487A;font-weight:600;">${feeText}</p>` : ''}
                    ${college.majors && college.majors.length > 0 ? `<div class="majors-list">${college.majors.map(m => `<span class="major-tag">${m.Name} (${m.Degree_Type || 'Bachelor'})</span>`).join('')}</div>` : ''}
                    <p style="color:#ff6600;font-size:12px;margin-top:10px;">📚 Click to view study plan →</p>
                </div>`;
            }).join('') : '<p>No colleges found.</p>'}
        </div>

        <div id="studyPlanModal" class="modal" style="display:none;">
            <div class="modal-content">
                <div class="modal-header"><h3 id="modalTitle">Study Plan</h3><button class="modal-close" onclick="closeModal()">&times;</button></div>
                <div class="modal-body" id="modalBody"></div>
            </div>
        </div>
    `;
}

function openPhotoModal(src) {
    const modal = document.getElementById('photoModal');
    if (!modal) return;
    document.getElementById('modalImage').src = src;
    modal.style.display = 'block';
    modal.onclick = function(e) { if (e.target === modal) closePhotoModal(); };
}
function closePhotoModal() { const modal = document.getElementById('photoModal'); if (modal) modal.style.display = 'none'; }

function updateNavAuth() {
    const navAuth = document.getElementById('navAuth');
    if (!navAuth) return;
    const student = JSON.parse(localStorage.getItem('currentStudent'));
    if (student) {
        navAuth.innerHTML = `<span>👋 ${student.First_Name}</span><a href="dashboard.html" class="btn-primary">Dashboard</a><button class="btn-outline" onclick="logout()">Logout</button>`;
    } else {
        navAuth.innerHTML = `<a href="login.html" class="btn-outline">Login</a><a href="register.html" class="btn-primary">Register</a>`;
    }
}

function showStudyPlan(collegeName, majors) {
    const modal = document.getElementById('studyPlanModal');
    if (!modal) return;
    document.getElementById('modalTitle').textContent = collegeName + ' - Study Plan';
    let html = '';
    if (majors.length === 0) {
        html = '<p>No study plans available.</p>';
    } else {
        majors.forEach(major => {
            html += `<div style="margin-bottom:30px;"><h4>🎓 ${major.Name} <span>(${major.Degree_Type || 'Bachelor'} - ${major.Duration_Years || 4} years)</span></h4>`;
            if (major.studyPlans && major.studyPlans.length > 0) {
                major.studyPlans.forEach(plan => {
                    html += `<p>📋 ${plan.Plan_Name} - ${plan.Total_Credit_Hours || 0} Credit Hours</p>`;
                    if (plan.courses && plan.courses.length > 0) {
                        const levels = {};
                        plan.courses.forEach(c => {
                            const level = c.Level || 'Other';
                            if (!levels[level]) levels[level] = [];
                            levels[level].push(c);
                        });
                        html += '<table style="width:100%;"><thead><tr><th>Code</th><th>Name</th><th>Credits</th><th>Semester</th><th>Level</th></tr></thead><tbody>';
                        Object.keys(levels).sort().forEach(level => {
                            html += `<tr><td colspan="5" style="background:#e8eaf6;">📚 ${level}</td></tr>`;
                            levels[level].forEach(c => {
                                html += `<tr><td>${c.Course_Code||''}</td><td>${c.Course_Name}</td><td>${c.Credit_Hours||''}</td><td>${c.Semester||''}</td><td>${c.Level||''}</td></tr>`;
                            });
                        });
                        html += '</tbody></table>';
                    } else {
                        html += '<p>No courses available.</p>';
                    }
                });
            } else {
                html += '<p>No study plan available.</p>';
            }
            html += '</div>';
        });
    }
    document.getElementById('modalBody').innerHTML = html;
    modal.style.display = 'block';
    modal.onclick = function(e) { if (e.target === modal) closeModal(); };
}
function closeModal() { document.getElementById('studyPlanModal').style.display = 'none'; }

// ========== DASHBOARD ==========
async function loadDashboard() {
    const student = checkAuth();
    if (!student) return;
    displayStudentProfile(student);
    loadMyApplications(student.Student_ID);
}

function displayStudentProfile(student) {
    const profileDiv = document.getElementById('studentProfile');
    const welcomeSpan = document.getElementById('welcomeUser');
    if (profileDiv) profileDiv.innerHTML = `<div class="student-avatar">${student.First_Name[0]}${student.Last_Name[0]}</div><h3>${student.First_Name} ${student.Last_Name}</h3><p>${student.Email}</p>`;
    if (welcomeSpan) welcomeSpan.textContent = `👋 Welcome, ${student.First_Name}!`;
}

function showDashboardTab(tabName, element) {
    document.querySelectorAll('.dashboard-menu a').forEach(a => a.classList.remove('active'));
    if (element) element.classList.add('active');
    const student = JSON.parse(localStorage.getItem('currentStudent'));
    if (tabName === 'applications') loadMyApplications(student.Student_ID);
    else if (tabName === 'newApp') loadNewApplicationForm();
    else if (tabName === 'profile') loadProfileTab(student);
}

async function loadMyApplications(studentId) {
    const content = document.getElementById('dashboardContent');
    try {
        const response = await fetch(`${API_URL}/students/${studentId}/applications`);
        const applications = await response.json();
        content.innerHTML = `<h2>My Applications</h2>${applications.length === 0 ? '<p>No applications yet. <a href="#" onclick="showDashboardTab(\'newApp\', this)">Apply now</a></p>' : `<div class="applications-list">${applications.map(a => `<div class="application-item"><div class="app-info"><h4>${a.Major_Name}</h4><p>${a.University_Name} | ${new Date(a.Application_Date).toLocaleDateString()}</p><p>GPA: ${a.GPA} | Score: ${a.High_School_Score}</p></div><span class="status-badge status-${a.Status.toLowerCase()}">${a.Status}</span></div>`).join('')}</div>`}`;
    } catch (error) {
        content.innerHTML = '<p>Error loading applications.</p>';
    }
}

async function loadNewApplicationForm() {
    const content = document.getElementById('dashboardContent');
    const student = JSON.parse(localStorage.getItem('currentStudent'));
    try {
        const [majors, universities] = await Promise.all([
            fetch(`${API_URL}/majors`).then(r => r.json()),
            fetch(`${API_URL}/universities`).then(r => r.json())
        ]);
        window.allMajors = majors;
        content.innerHTML = `
            <h2>Apply to University</h2>
            <div class="application-form">
                <form onsubmit="submitApplication(event)">
                    <div class="form-group"><label>Student</label><input type="text" value="${student.First_Name} ${student.Last_Name}" disabled></div>
                    <div class="form-group">
                        <label>Select University</label>
                        <select id="appUni" required onchange="filterMajorsByUniversity()">
                            <option value="">Choose university...</option>
                            ${universities.map(uni => `<option value="${uni.University_ID}">${uni.Name}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Select Major</label>
                        <select id="appMajor" required><option value="">Choose a university first</option></select>
                    </div>
                    <div class="form-row">
                        <div class="form-group"><label>GPA (0-4)</label><input type="number" id="appGPA" step="0.01" min="0" max="4" required></div>
                        <div class="form-group"><label>High School Score (0-100)</label><input type="number" id="appScore" step="0.01" min="0" max="100" required></div>
                    </div>
                    <button type="submit" class="btn-primary btn-full">Submit Application</button>
                </form>
                <div id="appMessage" class="message"></div>
            </div>`;
    } catch (error) {
        content.innerHTML = '<p>Error loading form.</p>';
    }
}

function filterMajorsByUniversity() {
    const uniId = parseInt(document.getElementById('appUni').value);
    const majorSelect = document.getElementById('appMajor');
    const allMajors = window.allMajors || [];
    const field = allMajors[0] && 'University_ID' in allMajors[0] ? 'University_ID' : (allMajors[0] && 'university_id' in allMajors[0] ? 'university_id' : null);
    if (!field) { majorSelect.innerHTML = '<option value="">Error loading majors</option>'; return; }
    const filtered = allMajors.filter(m => parseInt(m[field]) === uniId);
    majorSelect.innerHTML = filtered.length === 0 ? '<option value="">No majors available</option>' : '<option value="">Select a major...</option>' + filtered.map(m => `<option value="${m.Major_ID}">${m.Name} (${m.Degree_Type || 'Bachelor'})</option>`).join('');
}

async function submitApplication(event) {
    event.preventDefault();
    const student = JSON.parse(localStorage.getItem('currentStudent'));
    const messageDiv = document.getElementById('appMessage');
    const appData = {
        Student_ID: student.Student_ID,
        Major_ID: document.getElementById('appMajor').value,
        GPA: document.getElementById('appGPA').value,
        High_School_Score: document.getElementById('appScore').value
    };
    try {
        const response = await fetch(`${API_URL}/applications`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(appData)
        });
        if (response.ok) {
            messageDiv.className = 'message success';
            messageDiv.textContent = 'Application submitted!';
            setTimeout(() => loadMyApplications(student.Student_ID), 1500);
        } else {
            const data = await response.json();
            messageDiv.className = 'message error';
            messageDiv.textContent = data.error || 'Failed to submit';
        }
    } catch (error) {
        messageDiv.className = 'message error';
        messageDiv.textContent = 'Connection error.';
    }
}

function loadProfileTab(student) {
    const content = document.getElementById('dashboardContent');
    content.innerHTML = `<h2>My Profile</h2><div class="application-form">
        <div class="form-row"><div class="form-group"><label>First Name</label><input value="${student.First_Name}" disabled></div><div class="form-group"><label>Last Name</label><input value="${student.Last_Name}" disabled></div></div>
        <div class="form-group"><label>Email</label><input value="${student.Email}" disabled></div>
        <div class="form-row"><div class="form-group"><label>Gender</label><input value="${student.Gender || ''}" disabled></div><div class="form-group"><label>Date of Birth</label><input value="${student.Date_of_Birth ? new Date(student.Date_of_Birth).toLocaleDateString() : ''}" disabled></div></div>
        <div class="form-group"><label>Phone</label><input value="${student.Phone || ''}" disabled></div>
        <div class="form-group"><label>Address</label><input value="${student.Address || ''}" disabled></div>
    </div>`;
}

function handleContact(event) { event.preventDefault(); alert('Thank you for your message!'); event.target.reset(); }