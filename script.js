// Initialize storage for recent numbers
let recentNumbers = JSON.parse(localStorage.getItem('recentNumbers')) || [];

// DOM elements
const countryCodeInput = document.getElementById('countryCode');
const phoneNumberInput = document.getElementById('phoneNumber');
const whatsappMessageInput = document.getElementById('whatsappMessage');
const phoneErrorElement = document.getElementById('phoneError');
const messageBtn = document.getElementById('messageBtn');
const recentNumbersList = document.getElementById('recentNumbersList');
const messageAlert = document.getElementById('messageAlert');
const confirmationDialog = document.getElementById('confirmationDialog');

// Set initial theme from localStorage or default to dark
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
        updateThemeIcon(savedTheme);
    }
    
    // Focus on country code input on page load
    countryCodeInput.focus();
    
    // Load recent numbers from localStorage
    displayRecentNumbers();
    
    // Add enter key event listener for form submission
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            openWhatsApp();
        }
    });
    
    // Add input event listeners
    countryCodeInput.addEventListener('input', validateInputs);
    phoneNumberInput.addEventListener('input', validateInputs);
});

// Toggle theme function
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    updateThemeIcon(newTheme);
}

// Update theme icon
function updateThemeIcon(theme) {
    const themeToggle = document.querySelector('.theme-toggle i');
    if (theme === 'dark') {
        themeToggle.className = 'ph ph-sun';
    } else {
        themeToggle.className = 'ph ph-moon';
    }
}

// Validate inputs for proper formatting
function validateInputs() {
    // Format country code input
    let countryCode = countryCodeInput.value.trim();
    if (countryCode && !countryCode.startsWith('+')) {
        countryCode = '+' + countryCode;
        countryCodeInput.value = countryCode;
    }
    
    // Allow only numbers in country code (except the + sign)
    countryCodeInput.value = countryCodeInput.value.replace(/[^\d+]/g, '');
    
    // Allow only numbers in phone number
    phoneNumberInput.value = phoneNumberInput.value.replace(/\D/g, '');
    
    // Check for valid input
    const isValid = validatePhoneNumber();
    messageBtn.disabled = !isValid;
}

// Validate phone number format
function validatePhoneNumber() {
    const countryCode = countryCodeInput.value.trim();
    const phoneNumber = phoneNumberInput.value.trim();
    
    if (!countryCode || !phoneNumber) {
        phoneErrorElement.textContent = 'Country code and phone number are required';
        return false;
    }
    
    if (!countryCode.startsWith('+')) {
        phoneErrorElement.textContent = 'Country code must start with +';
        return false;
    }
    
    if (phoneNumber.length < 5) {
        phoneErrorElement.textContent = 'Please enter a valid phone number';
        return false;
    }
    
    phoneErrorElement.textContent = '';
    return true;
}

// Open WhatsApp with the entered phone number and optional message
function openWhatsApp() {
    if (!validatePhoneNumber()) {
        return;
    }
    
    const countryCode = countryCodeInput.value.trim();
    
    // Remove leading zero from phone number if present
    let phoneNumber = phoneNumberInput.value.trim();
    if (phoneNumber.startsWith('0')) {
        phoneNumber = phoneNumber.substring(1);
    }
    
    const fullNumber = countryCode + phoneNumber;
    
    // Get message if provided
    const message = whatsappMessageInput.value.trim();
    
    // Add to recent numbers if not already present
    addToRecentNumbers(countryCode, phoneNumber);
    
    // Show loading state
    messageBtn.innerHTML = '<i class="ph ph-spinner loading-spinner"></i> Opening...';
    messageBtn.disabled = true;
    
    // WhatsApp API URL format with optional message
    let whatsappUrl = `https://wa.me/${fullNumber.replace(/\D/g, '')}`;
    
    // Add message parameter if message is provided
    if (message) {
        whatsappUrl += `?text=${encodeURIComponent(message)}`;
        
        // Log analytics event with message
        if (typeof gtag === 'function') {
            gtag('event', 'open_whatsapp_with_message', {
                'event_category': 'engagement',
                'event_label': 'whatsapp_chat_message',
                'value': 1
            });
        }
    } else {
        // Log analytics event without message
        if (typeof gtag === 'function') {
            gtag('event', 'open_whatsapp', {
                'event_category': 'engagement',
                'event_label': 'whatsapp_chat',
                'value': 1
            });
        }
    }
    
    // Open WhatsApp in a new tab
    setTimeout(() => {
        window.open(whatsappUrl, '_blank');
        
        // Reset button state
        messageBtn.innerHTML = '<i class="ph ph-paper-plane-right"></i> Open Chat';
        messageBtn.disabled = false;
        
        // Show success message
        showMessage('success', 'WhatsApp chat opened successfully!');
        
        // Clear inputs
        phoneNumberInput.value = '';
        whatsappMessageInput.value = '';
        phoneNumberInput.focus();
    }, 800);
}

// Add number to recent numbers list
function addToRecentNumbers(countryCode, phoneNumber) {
    const newEntry = {
        countryCode,
        phoneNumber,
        timestamp: Date.now()
    };
    
    // Remove if already exists
    recentNumbers = recentNumbers.filter(entry => 
        entry.countryCode !== countryCode || entry.phoneNumber !== phoneNumber
    );
    
    // Add to beginning of array
    recentNumbers.unshift(newEntry);
    
    // Keep only the 5 most recent numbers
    if (recentNumbers.length > 5) {
        recentNumbers = recentNumbers.slice(0, 5);
    }
    
    // Save to localStorage
    localStorage.setItem('recentNumbers', JSON.stringify(recentNumbers));
    
    // Update display
    displayRecentNumbers();
}

// Display recent numbers in the UI
function displayRecentNumbers() {
    recentNumbersList.innerHTML = '';
    
    if (recentNumbers.length === 0) {
        recentNumbersList.innerHTML = '<div class="recent-number" style="justify-content: center; opacity: 0.6;">No recent numbers</div>';
        return;
    }
    
    recentNumbers.forEach(entry => {
        const numberElement = document.createElement('button');
        numberElement.className = 'recent-number';
        numberElement.innerHTML = `
            <i class="ph ph-phone"></i>
            ${entry.countryCode} ${entry.phoneNumber}
        `;
        
        numberElement.addEventListener('click', () => {
            useRecentNumber(entry.countryCode, entry.phoneNumber);
        });
        
        recentNumbersList.appendChild(numberElement);
    });
}

// Use a recent number from the list
function useRecentNumber(countryCode, phoneNumber) {
    countryCodeInput.value = countryCode;
    phoneNumberInput.value = phoneNumber;
    validateInputs();
    
    // Show message
    showMessage('success', 'Phone number loaded from history');
}

// Show confirmation dialog for clearing history
function showConfirmation() {
    confirmationDialog.classList.add('show');
}

// Hide confirmation dialog
function hideConfirmation() {
    confirmationDialog.classList.remove('show');
}

// Clear history after confirmation
function clearHistory() {
    recentNumbers = [];
    localStorage.removeItem('recentNumbers');
    displayRecentNumbers();
    hideConfirmation();
    
    // Show message
    showMessage('success', 'History cleared successfully');
}

// Show message alert
function showMessage(type, text) {
    messageAlert.className = `message ${type}`;
    messageAlert.innerHTML = `
        <i class="ph ${type === 'success' ? 'ph-check-circle' : 'ph-warning-circle'}"></i>
        ${text}
    `;
    
    messageAlert.classList.add('show');
    
    // Hide after 3 seconds
    setTimeout(() => {
        messageAlert.classList.remove('show');
    }, 3000);
}
