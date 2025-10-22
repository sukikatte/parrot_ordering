// Universal Theme Switcher for Parrot Ordering Platform
// This file provides theme switching functionality for all pages

// Switch theme across the page
function switchTheme(theme) {
    // Remove all existing themes and theme variants
    document.body.classList.remove('animal-theme', 'night-theme', 'parrot-theme', 'classic-theme', 'theme-1', 'theme-2', 'theme-3');
    
    const elementsToUpdate = [
        document.body, 
        document.querySelector('nav'), 
        document.querySelector('header'),
        document.querySelector('.search-bar'),
        document.querySelector('footer'),
        document.querySelector('.menu-list'),
        document.querySelector('.admin-profile-container'),
        document.querySelector('.customer-profile-container'),
        document.querySelector('.cook-profile-container')
    ];

    // Add the new theme class
    elementsToUpdate.forEach(element => {
        if (element) {
            element.classList.remove('animal-theme', 'night-theme', 'parrot-theme', 'classic-theme', 'theme-1', 'theme-2', 'theme-3');
            element.classList.add(theme + '-theme');
        }
    });

    // Handle animal theme variants
    if (theme === 'animal') {
        // Check if user has a specific animal theme preference
        const animalThemeVariant = localStorage.getItem('animalThemeVariant') || 'theme-1';
        document.body.classList.add(animalThemeVariant);
    }

    // Store the selected theme in localStorage
    localStorage.setItem('masterTheme', theme);
}

// Function to switch animal theme background
function switchAnimalTheme(variant) {
    if (document.body.classList.contains('animal-theme')) {
        document.body.classList.remove('theme-1', 'theme-2', 'theme-3');
        document.body.classList.add(variant);
        localStorage.setItem('animalThemeVariant', variant);
        
        // Show notification
        showThemeNotification(`Animal Theme ${variant.replace('theme-', '')} Applied`);
    }
}

// Handle theme change from a select dropdown or button
function changeTheme() {
    const themeSelect = document.getElementById('theme');
    if (themeSelect) {
        const theme = themeSelect.value;
        switchTheme(theme);
        showThemeNotification(`${theme.charAt(0).toUpperCase() + theme.slice(1)} Theme Applied`);
    }
}

// Handle animal theme variant change
function changeAnimalTheme() {
    const animalThemeSelect = document.getElementById('animal-theme-variant');
    if (animalThemeSelect) {
        const variant = animalThemeSelect.value;
        switchAnimalTheme(variant);
    }
}

// Initialize theme on page load
function initializeTheme() {
    const savedTheme = localStorage.getItem('masterTheme') || 'classic';
    const savedAnimalVariant = localStorage.getItem('animalThemeVariant') || 'theme-1';
    
    // Apply the saved theme
    switchTheme(savedTheme);
    
    // If animal theme is selected, apply the variant
    if (savedTheme === 'animal') {
        document.body.classList.add(savedAnimalVariant);
    }
    
    // Update select elements if they exist
    const themeSelect = document.getElementById('theme');
    if (themeSelect) {
        themeSelect.value = savedTheme;
    }
    
    const animalThemeSelect = document.getElementById('animal-theme-variant');
    if (animalThemeSelect) {
        animalThemeSelect.value = savedAnimalVariant;
    }
}

// Show theme change notification
function showThemeNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'theme-notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 10px 20px;
        border-radius: 5px;
        z-index: 10000;
        font-size: 14px;
        transition: opacity 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Add CSS for animal theme variant selector
function addAnimalThemeSelector() {
    const style = document.createElement('style');
    style.textContent = `
        .animal-theme-selector {
            display: none;
            margin-top: 10px;
        }
        
        .animal-theme.active .animal-theme-selector {
            display: block;
        }
        
        .animal-theme-selector select {
            padding: 5px 10px;
            border-radius: 3px;
            border: 1px solid #ddd;
            background: white;
            font-size: 14px;
        }
        
        .animal-theme-selector label {
            display: block;
            margin-bottom: 5px;
            font-size: 12px;
            color: #666;
        }
    `;
    document.head.appendChild(style);
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeTheme();
    addAnimalThemeSelector();
    
    // Add event listeners for theme changes
    const themeSelect = document.getElementById('theme');
    if (themeSelect) {
        themeSelect.addEventListener('change', changeTheme);
    }
    
    const animalThemeSelect = document.getElementById('animal-theme-variant');
    if (animalThemeSelect) {
        animalThemeSelect.addEventListener('change', changeAnimalTheme);
    }
    
    // Show/hide animal theme variant selector based on main theme
    if (themeSelect) {
        themeSelect.addEventListener('change', function() {
            const animalThemeSelector = document.querySelector('.animal-theme-selector');
            if (animalThemeSelector) {
                if (this.value === 'animal') {
                    animalThemeSelector.style.display = 'block';
                } else {
                    animalThemeSelector.style.display = 'none';
                }
            }
        });
    }
});
