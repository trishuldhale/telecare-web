// monitoring/monitoring.js
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    checkAuth();
    
    // Load health data
    loadHealthData();
    
    // Setup time range selector
    setupTimeRangeSelector();
    
    function checkAuth() {
        const authToken = localStorage.getItem('authToken');
        if (!authToken) {
            window.location.href = '/auth/login.html';
        }
    }
    
    function loadHealthData() {
        // Simulated health data
        const healthData = {
            heartRate: generateRandomData(60, 100, 24),
            bloodPressure: {
                systolic: generateRandomData(110, 140, 24),
                diastolic: generateRandomData(70, 90, 24)
            },
            spO2: generateRandomData(95, 100, 24),
            temperature: generateRandomData(97, 99, 24),
            steps: 8542,
            sleep: {
                duration: 442, // in minutes
                quality: 8 // 1-10 scale
            }
        };
        
        // Render charts
        renderHeartRateChart(healthData.heartRate);
        renderBloodPressureChart(healthData.bloodPressure);
        
        // Update summary cards
        document.querySelector('.current-value').textContent = `${healthData.heartRate[healthData.heartRate.length - 1]} BPM`;
        document.querySelectorAll('.small-vital-card .vital-value')[0].textContent = `${healthData.spO2[healthData.spO2.length - 1]}%`;
        document.querySelectorAll('.small-vital-card .vital-value')[1].textContent = `${healthData.temperature[healthData.temperature.length - 1].toFixed(1)}°F`;
        document.querySelectorAll('.small-vital-card .vital-value')[2].textContent = healthData.steps.toLocaleString();
        document.querySelectorAll('.small-vital-card .vital-value')[3].textContent = `${Math.floor(healthData.sleep.duration / 60)}h ${healthData.sleep.duration % 60}m`;
    }
    
    function generateRandomData(min, max, count) {
        const data = [];
        for (let i = 0; i < count; i++) {
            data.push(Math.floor(Math.random() * (max - min + 1)) + min);
        }
        return data;
    }
    
    function renderHeartRateChart(data) {
        const ctx = document.getElementById('heart-rate-chart').getContext('2d');
        
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: Array.from({length: 24}, (_, i) => `${i}:00`),
                datasets: [{
                    label: 'Heart Rate (BPM)',
                    data: data,
                    borderColor: '#3182ce',
                    backgroundColor: 'rgba(49, 130, 206, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        min: 50,
                        max: 110
                    }
                }
            }
        });
    }
    
    function renderBloodPressureChart(data) {
        const ctx = document.getElementById('blood-pressure-chart').getContext('2d');
        
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: Array.from({length: 24}, (_, i) => `${i}:00`),
                datasets: [
                    {
                        label: 'Systolic',
                        data: data.systolic,
                        borderColor: '#e53e3e',
                        backgroundColor: 'rgba(229, 62, 62, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'Diastolic',
                        data: data.diastolic,
                        borderColor: '#3182ce',
                        backgroundColor: 'rgba(49, 130, 206, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        min: 60,
                        max: 150
                    }
                }
            }
        });
    }
    
    function setupTimeRangeSelector() {
        const selector = document.getElementById('time-range');
        
        selector.addEventListener('change', function() {
            // In a real app, you would fetch data for the selected time range
            showAlert(`Showing data for ${this.value} time range`, 'info');
        });
    }
    
    function showAlert(message, type) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;
        alertDiv.textContent = message;
        
        // Insert after header
        const header = document.querySelector('.content-header');
        header.parentNode.insertBefore(alertDiv, header.nextSibling);
        
        // Remove after 3 seconds
        setTimeout(() => {
            alertDiv.remove();
        }, 3000);
    }
});