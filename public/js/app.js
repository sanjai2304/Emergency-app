// Auth Check
const user = JSON.parse(localStorage.getItem('user'));
if (!user) {
    window.location.href = 'index.html';
}

document.getElementById('userDisplay').innerHTML = `
    <span style="opacity: 0.7;">Logged in:</span> 
    <strong style="color: var(--text-color);">${user.name || user.role}</strong>
    ${user.specialty ? `<span class="badge" style="background: var(--accent); color: white; margin-left: 0.5rem; font-size: 0.7rem;">${user.specialty}</span>` : ''}
`;

// Role Management
const admissionPanel = document.getElementById('admissionPanel');
const doctorPanel = document.getElementById('doctorPanel');
const doctorVitalsPanel = document.getElementById('doctorVitalsPanel');
const patientStatusTracker = document.getElementById('patientStatusTracker');
const patientBookDoctor = document.getElementById('patientBookDoctor');
const statsGrid = document.querySelector('.stats-grid');

if (user.role === 'doctor') {
    admissionPanel.style.display = 'none';
    doctorPanel.style.display = 'block';
    if (doctorVitalsPanel) doctorVitalsPanel.style.display = 'block';
} else if (user.role === 'patient') {
    admissionPanel.style.display = 'none';
    doctorPanel.style.display = 'none';
    if (statsGrid) statsGrid.style.display = 'none';
    if (patientStatusTracker) patientStatusTracker.style.display = 'block';
    if (patientBookDoctor) {
        patientBookDoctor.style.display = 'block';
        loadDoctors(); // Initial Load
    }
} else {
    // Admin
    admissionPanel.style.display = 'block';
    doctorPanel.style.display = 'none';
}

// Mock Data for Demo Mode
let mockQueue = JSON.parse(localStorage.getItem('mockQueue')) || [
    { name: 'Alice Smith', age: 45, severity: 'Critical', severityScore: 4, arrivalTime: Date.now() - 1000 * 60 * 15 },

    { name: 'Bob Jones', age: 22, severity: 'High', severityScore: 3, arrivalTime: Date.now() - 1000 * 60 * 30 },
    { name: 'Charlie Brown', age: 60, severity: 'Medium', severityScore: 2, arrivalTime: Date.now() - 1000 * 60 * 5 }
];

function saveMockQueue() {
    localStorage.setItem('mockQueue', JSON.stringify(mockQueue));
}


// --- DOCTOR DIRECTORY LOGIC ---
let allDoctors = [];

function loadDoctors() {
    // 1. Get real registered doctors
    const registered = JSON.parse(localStorage.getItem('registeredDoctors') || '[]');

    // 2. Add some fake mock doctors so the list isn't empty on first run
    const mocks = [
        { name: 'Dr. Gregory House', specialty: 'Neurology', location: 'Princeton', id: 'mock1' },
        { name: 'Dr. Meredith Grey', specialty: 'General Surgery', location: 'Seattle', id: 'mock2' },
        { name: 'Dr. Shaun Murphy', specialty: 'General Surgery', location: 'San Jose', id: 'mock3' },
        { name: 'Dr. Strange', specialty: 'Neurosurgery', location: 'New York', id: 'mock4' }
    ];

    // Combine unique
    allDoctors = [...registered, ...mocks];
    renderDoctorList(allDoctors);
}

function renderDoctorList(doctors) {
    const list = document.getElementById('doctorDirectoryList');
    if (!list) return;
    list.innerHTML = '';

    if (doctors.length === 0) {
        list.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 2rem;">No doctors found matching criteria.</div>`;
        return;
    }

    doctors.forEach(doc => {
        const card = document.createElement('div');
        // Mini Card Style
        card.style.background = 'rgba(255,255,255,0.05)';
        card.style.padding = '1.2rem';
        card.style.borderRadius = '8px';
        card.style.border = '1px solid rgba(255,255,255,0.1)';

        card.innerHTML = `
            <div class="flex justify-between items-start">
                <div style="width: 40px; height: 40px; background: var(--accent); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.2rem;">
                    <ion-icon name="person"></ion-icon>
                </div>
                <span class="badge" style="background: rgba(99, 102, 241, 0.2); color: #a5b4fc;">${doc.specialty}</span>
            </div>
            <h4 style="margin-top: 1rem; font-size: 1.1rem;">${doc.name}</h4>
            <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.2rem;">
                <ion-icon name="location-outline" style="vertical-align: -2px;"></ion-icon> ${doc.location || 'Main Hospital'}
            </div>
            <button onclick="bookDoctor('${doc.name}')" class="btn" style="width: 100%; margin-top: 1rem; background: transparent; border: 1px solid var(--primary); font-size: 0.9rem; padding: 0.5rem;">
                Book Appointment
            </button>
        `;
        list.appendChild(card);
    });
}

// Make accessible globally
window.filterDoctors = function () {
    const nameFilter = document.getElementById('searchDocName').value.toLowerCase();
    const locFilter = document.getElementById('searchDocLoc').value.toLowerCase();
    const specFilter = document.getElementById('searchDocSpec').value;

    const filtered = allDoctors.filter(doc => {
        const matchName = doc.name.toLowerCase().includes(nameFilter);
        const matchLoc = (doc.location || '').toLowerCase().includes(locFilter);
        const matchSpec = specFilter ? doc.specialty === specFilter : true;
        return matchName && matchLoc && matchSpec;
    });

    renderDoctorList(filtered);
};

window.bookDoctor = function (docName) {
    // Simulate booking
    if (confirm(`Request appointment with ${docName}?`)) {
        alert(`Appointment Request Sent to ${docName}. You are prioritized in their queue.`);

        // Add to Mock Queue as a "Scheduled" patient
        mockQueue.push({
            name: user.name,
            age: 30, // Default since we don't have age in this quick flow
            severity: 'Low', // Appointments are usually lower urgency initially
            severityScore: 1,
            arrivalTime: Date.now(),
            notes: `Booked with ${docName}`
        });
        saveMockQueue();
        fetchQueue(); // Refresh view
    }
};


// Check for Pending Self-Admission

// Check for Pending Self-Admission
const pending = JSON.parse(localStorage.getItem('pendingAdmission'));
if (pending) {
    const severityMap = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
    pending.severityScore = severityMap[pending.severity];
    mockQueue.push(pending);

    saveMockQueue();
    localStorage.removeItem('pendingAdmission');

}

// Global polling
setInterval(() => {
    fetchQueue();
    fetchStats();
}, 2000);

fetchQueue();
fetchStats();


// --- Functions ---

async function fetchQueue() {
    try {
        const res = await fetch('/api/queue');
        if (!res.ok) throw new Error("Server Offline");
        const queue = await res.json();
        renderQueue(queue);
    } catch (err) {
        renderQueue(mockQueue);
    }
}

async function fetchStats() {
    try {
        const res = await fetch('/api/stats');
        if (!res.ok) throw new Error("Server Offline");
        const stats = await res.json();
        updateStatsUI(stats);
    } catch (err) {
        // Mock Stats
        const criticalCount = mockQueue.filter(p => p.severity === 'Critical').length;
        updateStatsUI({
            waitingCount: mockQueue.length,
            criticalCount: criticalCount,
            avgWaitTime: 12
        });
    }
}

function updateStatsUI(stats) {
    if (document.getElementById('waitingCount')) document.getElementById('waitingCount').innerText = stats.waitingCount;
    if (document.getElementById('criticalCount')) document.getElementById('criticalCount').innerText = stats.criticalCount;
    if (document.getElementById('avgWaitTime')) document.getElementById('avgWaitTime').innerText = stats.avgWaitTime + 'm';
}

function renderQueue(queue) {
    const list = document.getElementById('queueList');
    list.innerHTML = '';

    // Sort Queue
    const displayQueue = [...queue].sort((a, b) => {
        if (a.severityScore !== b.severityScore) return b.severityScore - a.severityScore;
        return a.arrivalTime - b.arrivalTime;
    });

    if (displayQueue.length === 0) {
        list.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 2rem;">No patients waiting.</div>`;
        updateDoctorVitals(null);
        return;
    }

    // Role Specific Updates
    if (user.role === 'doctor') {
        updateDoctorVitals(displayQueue[0]); // Peek highest priority
    }
    if (user.role === 'patient') {
        updatePatientTracker(displayQueue, user.name);
    }

    displayQueue.forEach((p, index) => {
        const waitingTime = Math.floor((Date.now() - p.arrivalTime) / 60000);
        const div = document.createElement('div');
        div.className = `patient-item priority-${p.severity}`;

        // Highlight "Me"
        if (user.role === 'patient' && p.name === user.name) {
            div.style.border = '2px solid var(--primary)';
            div.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
        }

        div.innerHTML = `
            <div>
                <div style="font-weight: bold; font-size: 1.1rem;">
                    ${index + 1}. ${p.name} 
                    <span style="font-size: 0.8rem; font-weight: normal; color: var(--text-muted);">(${p.age}y)</span>
                </div>
                <div style="font-size: 0.85rem; margin-top: 0.2rem;">
                    Priority Score: <strong>${p.severityScore * 10}</strong> 
                    <span style="color: var(--text-muted);"> | Arrived: ${new Date(p.arrivalTime).toLocaleTimeString()}</span>
                </div>
            </div>
            <div style="text-align: right;">
                <span class="badge badge-${p.severity}">${p.severity}</span>
                <div class="time-ago">${waitingTime} min wait</div>
            </div>
        `;
        list.appendChild(div);
    });
}

// New: Update Doctor Vitals Panel
function updateDoctorVitals(patient) {
    const vitalsPanel = document.getElementById('doctorVitalsPanel');
    if (!vitalsPanel) return;

    if (!patient) {
        document.getElementById('nextPatientPreview').innerText = "Queue Empty";
        document.getElementById('vitals-bpm').innerText = "--";
        document.getElementById('vitals-bp').innerText = "--/--";
        document.getElementById('vitals-spo2').innerText = "--";
        return;
    }

    document.getElementById('nextPatientPreview').innerHTML = `Next: <strong>${patient.name}</strong> (${patient.severity})`;

    // Generate Random Vitals if not present (Simulation)
    if (!patient.vitals) {
        // Critical patients have worse vitals logic
        const isCritical = patient.severity === 'Critical';
        patient.vitals = {
            bpm: isCritical ? Math.floor(Math.random() * 40 + 130) : Math.floor(Math.random() * 20 + 70),
            bpSys: isCritical ? Math.floor(Math.random() * 30 + 80) : Math.floor(Math.random() * 20 + 110),
            bpDia: isCritical ? Math.floor(Math.random() * 20 + 50) : Math.floor(Math.random() * 10 + 70),
            spo2: isCritical ? Math.floor(Math.random() * 10 + 80) : Math.floor(Math.random() * 3 + 97)
        };
    }

    document.getElementById('vitals-bpm').innerText = patient.vitals.bpm;
    document.getElementById('vitals-bp').innerText = `${patient.vitals.bpSys}/${patient.vitals.bpDia}`;
    document.getElementById('vitals-spo2').innerText = patient.vitals.spo2;
}

// New: Update Patient Tracker
function updatePatientTracker(queue, myName) {
    const myIndex = queue.findIndex(p => p.name === myName);
    const estWaitDisplay = document.getElementById('estWait');
    if (!estWaitDisplay) return;

    if (myIndex === -1) {
        estWaitDisplay.innerText = "You are currently with the doctor or discharged.";
        return;
    }

    const waitTime = (myIndex + 1) * 10;
    estWaitDisplay.innerText = `~${waitTime} Minutes (${myIndex} ahead of you)`;
}

// Admission Form
const form = document.getElementById('admitForm');
if (form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('pName').value;
        const age = document.getElementById('pAge').value;
        const severity = document.getElementById('pSeverity').value;
        const severityMap = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };

        try {
            const res = await fetch('/api/admit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, age, severity })
            });
            if (res.ok) {
                clearForm();
                fetchQueue();
            } else { throw new Error('API Failed'); }
        } catch (err) {
            // Mock Admission
            mockQueue.push({
                name, age, severity,
                severityScore: severityMap[severity],
                arrivalTime: Date.now()
            });

            saveMockQueue();
            clearForm();
            renderQueue(mockQueue);

            alert("Patient admitted (Demo Mode)");
        }
    });
}

function clearForm() {
    document.getElementById('pName').value = '';
    document.getElementById('pAge').value = '';
}

// Doctor Actions
async function treatNextPatient() {
    try {
        const res = await fetch('/api/process', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ doctorName: user.name || 'Dr. OnCall' })
        });
        const data = await res.json();

        if (res.ok) {
            showStatus(data.patient);
            fetchQueue();
        }
    } catch (err) {
        // Mock Treat
        mockQueue.sort((a, b) => b.severityScore - a.severityScore || a.arrivalTime - b.arrivalTime);
        const patient = mockQueue.shift(); // Remove first
        saveMockQueue();
        if (patient) {
            showStatus(patient);
            renderQueue(mockQueue);

        } else {
            alert("No patients to treat");
        }
    }
}

function showStatus(patient) {
    const statusDiv = document.getElementById('treatmentStatus');
    statusDiv.innerText = `Treating: ${patient.name} (${patient.severity})`;
    statusDiv.style.color = 'var(--success)';
    setTimeout(() => { statusDiv.innerText = ''; }, 5000);
}

function logout() {
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}
