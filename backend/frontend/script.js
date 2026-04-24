const API_URL = window.location.origin + '/api';
// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    initPage();
});

function initPage() {
    const path = window.location.pathname;
    
    if (path.includes('index.html') || path === '/' || path.endsWith('/')) {
        loadHomePage();
    } else if (path.includes('login.html')) {
        // Login page
    } else if (path.includes('register.html')) {
        // Register page
    } else if (path.includes('university.html')) {
        loadUniversityDetail();
    } else if (path.includes('dashboard.html')) {
        loadDashboard();
    }
}

// ============================================
// HOME PAGE
// ============================================
async function loadHomePage() {
    try {
        console.log('Loading homepage...');
        
        const [universities, students, majors] = await Promise.all([
            fetch(`${API_URL}/universities`).then(r => {
                console.log('Universities response:', r.status);
                return r.json();
            }),
            fetch(`${API_URL}/students`).then(r => r.json()),
            fetch(`${API_URL}/majors`).then(r => r.json())
        ]);

        console.log('Universities:', universities);
        console.log('Students:', students);
        console.log('Majors:', majors);

        const uniCountEl = document.getElementById('uniCountStat');
        const studentCountEl = document.getElementById('studentCountStat');
        const majorCountEl = document.getElementById('majorCountStat');
        const grid = document.getElementById('universitiesGrid');

        if (uniCountEl) uniCountEl.textContent = universities.length;
        if (studentCountEl) studentCountEl.textContent = students.length;
        if (majorCountEl) majorCountEl.textContent = majors.length;

        if (grid && universities.length > 0) {
            loadUniversitiesGrid(universities);
        } else if (grid) {
            grid.innerHTML = '<p style="color:red;">No universities loaded. Check console.</p>';
        }
        
        loadFooterUniversities(universities);

    } catch (error) {
        console.error('Error loading homepage:', error);
        const grid = document.getElementById('universitiesGrid');
        if (grid) grid.innerHTML = '<p style="color:red;">Error: ' + error.message + '</p>';
    }
}
// ============================================
// AUTHENTICATION
// ============================================
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
            
            // Save student to localStorage
            localStorage.setItem('currentStudent', JSON.stringify(data.student));
            
            // Redirect to dashboard
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
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
    
    const studentData = {
        First_Name: document.getElementById('regFirstName').value,
        Last_Name: document.getElementById('regLastName').value,
        Email: document.getElementById('regEmail').value,
        Password: document.getElementById('regPassword').value,
        Gender: document.getElementById('regGender').value,
        Date_of_Birth: document.getElementById('regDOB').value,
        Phone: document.getElementById('regPhone').value,
        Address: document.getElementById('regAddress').value
    };
    
    const messageDiv = document.getElementById('registerMessage');
    
    try {
        const response = await fetch(`${API_URL}/students`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(studentData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            messageDiv.className = 'message success';
            messageDiv.textContent = 'Registration successful! Redirecting to login...';
            
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1500);
        } else {
            messageDiv.className = 'message error';
            messageDiv.textContent = data.error || 'Registration failed';
        }
    } catch (error) {
        messageDiv.className = 'message error';
        messageDiv.textContent = 'Connection error. Please try again.';
    }
}

function logout() {
    localStorage.removeItem('currentStudent');
    window.location.href = 'index.html';
}

function checkAuth() {
    const student = JSON.parse(localStorage.getItem('currentStudent'));
    if (!student) {
        window.location.href = 'login.html';
        return null;
    }
    return student;
}

// ============================================
// UNIVERSITY DETAIL PAGE
// ============================================
async function loadUniversityDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const uniId = urlParams.get('id');
    
    if (!uniId) {
        window.location.href = 'index.html';
        return;
    }
    
    // Update nav buttons
    updateNavAuth();
    
    try {
        const response = await fetch(`${API_URL}/universities/${uniId}`);
        const university = await response.json();
        
        displayUniversityDetail(university);
    } catch (error) {
        console.error('Error loading university:', error);
    }
}

function displayUniversityDetail(uni) {
    const container = document.getElementById('universityDetail');
    
    const colors = ['#667eea', '#f093fb', '#4facfe', '#43e97b', '#fa709a', '#a18cd1', '#ff9a9e'];
    const randomColor = colors[uni.University_ID % colors.length];
    
    container.innerHTML = `
        <div class="uni-detail-header">
            <div class="uni-detail-image" style="background: linear-gradient(135deg, ${randomColor}, ${randomColor}dd);">
                <span>🏛️</span>
            </div>
            <div class="uni-detail-info">
                <h1>${uni.Name}</h1>
                <div class="uni-detail-meta">
                    <span class="meta-tag">📍 ${uni.Location || 'Egypt'}</span>
                    <span class="meta-tag">🏫 ${uni.Type || 'University'}</span>
                    ${uni.Email ? `<span class="meta-tag">📧 ${uni.Email}</span>` : ''}
                    ${uni.Phone ? `<span class="meta-tag">📞 ${uni.Phone}</span>` : ''}
                </div>
                <p>${uni.Description || 'A prestigious university offering world-class education with state-of-the-art facilities and experienced faculty.'}</p>
                ${uni.Website ? `<p><a href="${uni.Website}" target="_blank" style="color: var(--accent);">Visit Official Website →</a></p>` : ''}
                
                ${localStorage.getItem('currentStudent') ? 
                    `<a href="dashboard.html?uni=${uni.University_ID}" class="apply-btn">Apply Now →</a>` :
                    `<a href="login.html" class="apply-btn">Login to Apply →</a>`
                }
            </div>
        </div>
        
        <h2 style="font-size: 32px; margin-bottom: 20px;">Colleges & Programs</h2>
        <div class="colleges-grid">
            ${uni.colleges && uni.colleges.length > 0 ? 
                uni.colleges.map(college => `
                    <div class="college-card">
                        <h4>${college.Name}</h4>
                        <p>${college.Description || ''}</p>
                        ${college.majors && college.majors.length > 0 ? `
                            <div class="majors-list">
                                ${college.majors.map(major => `
                                    <span class="major-tag">${major.Name} (${major.Degree_Type || 'Bachelor'})</span>
                                `).join('')}
                            </div>
                        ` : ''}
                    </div>
                `).join('') :
                '<p>No colleges found for this university.</p>'
            }
        </div>
    `;
}

function updateNavAuth() {
    const navAuth = document.getElementById('navAuth');
    if (!navAuth) return;
    
    const student = JSON.parse(localStorage.getItem('currentStudent'));
    
    if (student) {
        navAuth.innerHTML = `
            <span style="margin-right: 10px; font-size: 14px;">👋 ${student.First_Name}</span>
            <a href="dashboard.html" class="btn-primary">Dashboard</a>
            <button class="btn-outline" onclick="logout()">Logout</button>
        `;
    } else {
        navAuth.innerHTML = `
            <a href="login.html" class="btn-outline">Login</a>
            <a href="register.html" class="btn-primary">Register</a>
        `;
    }
}

// ============================================
// STUDENT DASHBOARD
// ============================================
async function loadDashboard() {
    const student = checkAuth();
    if (!student) return;
    
    // Display student info
    displayStudentProfile(student);
    
    // Load applications tab by default
    loadMyApplications(student.Student_ID);
}

function displayStudentProfile(student) {
    const profileDiv = document.getElementById('studentProfile');
    const welcomeSpan = document.getElementById('welcomeUser');
    
    if (profileDiv) {
        profileDiv.innerHTML = `
            <div class="student-avatar">${student.First_Name[0]}${student.Last_Name[0]}</div>
            <h3>${student.First_Name} ${student.Last_Name}</h3>
            <p>${student.Email}</p>
        `;
    }
    
    if (welcomeSpan) {
        welcomeSpan.textContent = `👋 Welcome, ${student.First_Name}!`;
    }
}

function showDashboardTab(tabName, element) {
    // Update active link
    document.querySelectorAll('.dashboard-menu a').forEach(a => a.classList.remove('active'));
    if (element) element.classList.add('active');
    
    const student = JSON.parse(localStorage.getItem('currentStudent'));
    
    switch(tabName) {
        case 'applications':
            loadMyApplications(student.Student_ID);
            break;
        case 'newApp':
            loadNewApplicationForm();
            break;
        case 'profile':
            loadProfileTab(student);
            break;
    }
}

async function loadMyApplications(studentId) {
    const content = document.getElementById('dashboardContent');
    
    try {
        const response = await fetch(`${API_URL}/students/${studentId}/applications`);
        const applications = await response.json();
        
        content.innerHTML = `
            <h2 style="margin-bottom: 25px;">My Applications</h2>
            ${applications.length === 0 ? 
                '<p>No applications yet. <a href="#" onclick="showDashboardTab(\'newApp\', this)" style="color: var(--accent);">Apply now</a></p>' :
                `<div class="applications-list">
                    ${applications.map(app => `
                        <div class="application-item">
                            <div class="app-info">
                                <h4>${app.Major_Name}</h4>
                                <p>${app.University_Name} | Applied: ${new Date(app.Application_Date).toLocaleDateString()}</p>
                                <p>GPA: ${app.GPA} | Score: ${app.High_School_Score}</p>
                            </div>
                            <span class="status-badge status-${app.Status.toLowerCase()}">${app.Status}</span>
                        </div>
                    `).join('')}
                </div>`
            }
        `;
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
        
        content.innerHTML = `
            <h2 style="margin-bottom: 25px;">Apply to University</h2>
            <div class="application-form">
                <form onsubmit="submitApplication(event)">
                    <div class="form-group">
                        <label>Student</label>
                        <input type="text" value="${student.First_Name} ${student.Last_Name}" disabled>
                    </div>
                    <div class="form-group">
                        <label>Select University</label>
                        <select id="appUni" onchange="filterMajorsByUni(${JSON.stringify(universities).replace(/"/g, '&quot;')}, ${JSON.stringify(majors).replace(/"/g, '&quot;')})" required>
                            <option value="">Choose university...</option>
                            ${universities.map(uni => `<option value="${uni.University_ID}">${uni.Name}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Select Major</label>
                        <select id="appMajor" required>
                            <option value="">Choose major...</option>
                        </select>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>GPA (0-4)</label>
                            <input type="number" id="appGPA" step="0.01" min="0" max="4" placeholder="e.g., 3.5" required>
                        </div>
                        <div class="form-group">
                            <label>High School Score (0-100)</label>
                            <input type="number" id="appScore" step="0.01" min="0" max="100" placeholder="e.g., 95" required>
                        </div>
                    </div>
                    <button type="submit" class="btn-primary btn-full" style="margin-top: 10px;">Submit Application</button>
                </form>
                <div id="appMessage" class="message"></div>
            </div>
        `;
    } catch (error) {
        content.innerHTML = '<p>Error loading form. Please try again.</p>';
    }
}

function filterMajorsByUni(universities, majors) {
    const uniId = document.getElementById('appUni').value;
    const majorSelect = document.getElementById('appMajor');
    
    // Find colleges for this university
    const uni = universities.find(u => u.University_ID == uniId);
    
    majorSelect.innerHTML = '<option value="">Choose major...</option>';
    
    // Filter majors that belong to this university's colleges
    // This is a simplified version
    majors.forEach(major => {
        majorSelect.innerHTML += `<option value="${major.Major_ID}">${major.Name} - ${major.College_Name || ''}</option>`;
    });
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
            messageDiv.textContent = 'Application submitted successfully!';
            
            setTimeout(() => {
                loadMyApplications(student.Student_ID);
            }, 1500);
        } else {
            const data = await response.json();
            messageDiv.className = 'message error';
            messageDiv.textContent = data.error || 'Failed to submit application';
        }
    } catch (error) {
        messageDiv.className = 'message error';
        messageDiv.textContent = 'Connection error. Please try again.';
    }
}

function loadProfileTab(student) {
    const content = document.getElementById('dashboardContent');
    
    content.innerHTML = `
        <h2 style="margin-bottom: 25px;">My Profile</h2>
        <div class="application-form">
            <div class="form-row">
                <div class="form-group">
                    <label>First Name</label>
                    <input type="text" value="${student.First_Name}" disabled>
                </div>
                <div class="form-group">
                    <label>Last Name</label>
                    <input type="text" value="${student.Last_Name}" disabled>
                </div>
            </div>
            <div class="form-group">
                <label>Email</label>
                <input type="email" value="${student.Email}" disabled>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Gender</label>
                    <input type="text" value="${student.Gender || 'N/A'}" disabled>
                </div>
                <div class="form-group">
                    <label>Date of Birth</label>
                    <input type="text" value="${student.Date_of_Birth ? new Date(student.Date_of_Birth).toLocaleDateString() : 'N/A'}" disabled>
                </div>
            </div>
            <div class="form-group">
                <label>Phone</label>
                <input type="text" value="${student.Phone || 'N/A'}" disabled>
            </div>
            <div class="form-group">
                <label>Address</label>
                <input type="text" value="${student.Address || 'N/A'}" disabled>
            </div>
        </div>
    `;
}

// ============================================
// UTILITIES
// ============================================
function toggleMenu() {
    document.querySelector('.nav-menu').classList.toggle('active');
}

function handleContact(event) {
    event.preventDefault();
    alert('Thank you for your message! We will get back to you soon.');
    event.target.reset();
}