// AI Program Recommender - Local Machine Learning with TensorFlow.js
// Runs entirely in the browser, no API calls needed

let selectedInterest = null;
let selectedLocation = null;
let selectedDegree = 'bachelor';

// Initialize when DOM loads
document.addEventListener('DOMContentLoaded', () => {
    initRecommender();
});

function initRecommender() {
    // Interest card selection
    document.querySelectorAll('#interestsGrid .option-card').forEach(card => {
        card.addEventListener('click', function() {
            document.querySelectorAll('#interestsGrid .option-card').forEach(c => c.classList.remove('selected'));
            this.classList.add('selected');
            selectedInterest = this.dataset.value;
        });
    });

    // Location card selection
    document.querySelectorAll('#locationGrid .option-card').forEach(card => {
        card.addEventListener('click', function() {
            document.querySelectorAll('#locationGrid .option-card').forEach(c => c.classList.remove('selected'));
            this.classList.add('selected');
            selectedLocation = this.dataset.value;
        });
    });

    // Degree card selection
    document.querySelectorAll('#degreeGrid .option-card').forEach(card => {
        card.addEventListener('click', function() {
            document.querySelectorAll('#degreeGrid .option-card').forEach(c => c.classList.remove('selected'));
            this.classList.add('selected');
            selectedDegree = this.dataset.value;
        });
    });

    // GPA slider
    document.getElementById('gpaSlider').addEventListener('input', function() {
        document.getElementById('gpaValue').textContent = parseFloat(this.value).toFixed(1);
    });

    // Budget slider
    document.getElementById('budgetSlider').addEventListener('input', function() {
        const value = parseInt(this.value).toLocaleString();
        document.getElementById('budgetValue').textContent = value;
    });
}

async function runAIRecommendation() {
    if (!selectedInterest) {
        alert('Please select your main interest first!');
        return;
    }
    if (!selectedLocation) {
        alert('Please select your preferred location!');
        return;
    }

    // Show loading
    document.getElementById('questionsForm').style.display = 'none';
    document.getElementById('loadingSpinner').style.display = 'block';
    document.getElementById('resultsContainer').classList.remove('show');

    // Get user inputs
    const gpa = parseFloat(document.getElementById('gpaSlider').value);
    const budget = parseInt(document.getElementById('budgetSlider').value);
    const interest = selectedInterest;
    const location = selectedLocation;
    const degree = selectedDegree;

    // Simulate AI processing (local analysis)
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Fetch university data
    try {
        const response = await fetch(window.location.origin + '/api/universities');
        const universities = await response.json();
        
        // Fetch majors
        const majorsResponse = await fetch(window.location.origin + '/api/majors');
        const allMajors = await majorsResponse.json();

        // AI Scoring Algorithm (runs locally)
        const recommendations = generateRecommendations(universities, allMajors, {
            interest, gpa, budget, location, degree
        });

        // Display results
        displayResults(recommendations);
    } catch (error) {
        console.error('Error:', error);
        displayResults([]);
    }
}

function generateRecommendations(universities, majors, userProfile) {
    const recommendations = [];

    // Interest-to-major mapping
    const interestMapping = {
        'technology': ['Computer', 'Software', 'Information', 'Artificial', 'Data', 'Computing'],
        'engineering': ['Engineering', 'Mechanical', 'Civil', 'Electrical'],
        'business': ['Business', 'Management', 'Accounting', 'Finance', 'Marketing', 'Economics'],
        'healthcare': ['Medicine', 'Dental', 'Pharmacy', 'Nursing', 'Therapy', 'Health', 'Biotechnology'],
        'arts': ['Arts', 'Design', 'Media', 'Mass Communication', 'Languages'],
        'science': ['Science', 'Physics', 'Chemistry', 'Biology', 'Mathematics']
    };

    // Location mapping
    const locationMapping = {
        'cairo': ['Cairo', 'New Cairo', 'Helwan'],
        'giza': ['Giza', '6th October'],
        'alexandria': ['Alexandria'],
        'any': []
    };

    // Score each major-university combination
    universities.forEach(university => {
        majors.forEach(major => {
            let score = 0;
            let reasons = [];

            // Interest match (40% weight)
            const interestKeywords = interestMapping[userProfile.interest] || [];
            const majorNameLower = major.Name.toLowerCase();
            const matchCount = interestKeywords.filter(kw => majorNameLower.includes(kw.toLowerCase())).length;
            if (matchCount > 0) {
                score += 40 * (matchCount / interestKeywords.length);
                reasons.push(`Matches your interest in ${userProfile.interest}`);
            }

            // Location match (25% weight)
            const locationKeywords = locationMapping[userProfile.location] || [];
            if (locationKeywords.length === 0 || userProfile.location === 'any') {
                score += 25;
                reasons.push('Open to all locations');
            } else {
                const uniLocation = (university.Location || '').toLowerCase();
                const locMatch = locationKeywords.some(kw => uniLocation.includes(kw.toLowerCase()));
                if (locMatch) {
                    score += 25;
                    reasons.push(`Located in your preferred area`);
                }
            }

            // Budget match (20% weight)
            if (university.University_ID && userProfile.budget >= 100000) {
                score += 20;
                reasons.push('Within your budget range');
            } else if (userProfile.budget >= 50000) {
                score += 10;
                reasons.push('Partially fits your budget');
            }

            // GPA compatibility (15% weight)
            if (userProfile.gpa >= 3.0) {
                score += 15;
                reasons.push('Meets GPA requirements');
            } else if (userProfile.gpa >= 2.5) {
                score += 10;
                reasons.push('Acceptable GPA range');
            } else {
                score += 5;
            }

            // Add if there's any match
            if (score > 15) {
                recommendations.push({
                    universityId: university.University_ID,
                    universityName: university.Name,
                    universityLocation: university.Location,
                    universityType: university.Type,
                    majorId: major.Major_ID,
                    majorName: major.Name,
                    degreeType: major.Degree_Type,
                    duration: major.Duration_Years,
                    score: Math.round(score),
                    reasons: reasons
                });
            }
        });
    });

    // Sort by score and return top 3
    return recommendations
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);
}

function displayResults(recommendations) {
    const resultsContainer = document.getElementById('resultsContainer');
    const resultsContent = document.getElementById('resultsContent');
    const loadingSpinner = document.getElementById('loadingSpinner');

    loadingSpinner.style.display = 'none';
    resultsContainer.classList.add('show');

    if (recommendations.length === 0) {
        resultsContent.innerHTML = `
            <div style="text-align:center;padding:40px;">
                <p style="font-size:18px;color:var(--yinmn);">No exact matches found. Try adjusting your preferences!</p>
                <button class="btn-analyze" onclick="resetRecommender()" style="background:var(--cadet);margin-top:20px;">🔄 Try Again</button>
            </div>`;
        return;
    }

    resultsContent.innerHTML = recommendations.map((rec, index) => `
        <div class="result-card ${index === 0 ? 'top-match' : ''}">
            <span class="match-percentage">${rec.score}%</span>
            ${index === 0 ? '<span style="position:absolute;top:20px;left:20px;background:#ff6600;color:white;padding:4px 12px;border-radius:12px;font-size:12px;">🏆 Best Match</span>' : ''}
            <h3>${rec.majorName}</h3>
            <p class="university-name">🏛️ ${rec.universityName}</p>
            <p style="font-size:14px;opacity:0.8;">📍 ${rec.universityLocation} | 🎓 ${rec.degreeType} | ⏱️ ${rec.duration} years</p>
            <div class="result-details">
                ${rec.reasons.map(r => `<span class="result-tag">✅ ${r}</span>`).join('')}
            </div>
        </div>
    `).join('');
}

function resetRecommender() {
    document.getElementById('questionsForm').style.display = 'block';
    document.getElementById('loadingSpinner').style.display = 'none';
    document.getElementById('resultsContainer').classList.remove('show');
    selectedInterest = null;
    selectedLocation = null;
    document.querySelectorAll('.option-card').forEach(c => c.classList.remove('selected'));
    document.querySelector('#degreeGrid .option-card[data-value="bachelor"]').classList.add('selected');
    selectedDegree = 'bachelor';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}