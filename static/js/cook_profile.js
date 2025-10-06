document.addEventListener('DOMContentLoaded', function () {
    console.log('Profile script loaded');

    // Utility function to handle server interactions
    async function sendToServer(url, method, data = {}) {
        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log(`Server response from ${url}:`, result);
            return result;
        } catch (error) {
            console.error(`Error while communicating with ${url}:`, error);
            alert('An error occurred while processing your request. Please try again.');
            return null;
        }
    }

    // Utility function to display validation error messages
    function showError(field, message) {
        let errorSpan = field.nextElementSibling;
        if (!errorSpan || errorSpan.tagName.toLowerCase() !== 'span') {
            errorSpan = document.createElement('span');
            errorSpan.classList.add('error-message');
            field.parentNode.insertBefore(errorSpan, field.nextSibling);
        }
        errorSpan.textContent = message;
    }

    function clearError(field) {
        let errorSpan = field.nextElementSibling;
        if (errorSpan && errorSpan.tagName.toLowerCase() === 'span') {
            errorSpan.textContent = '';
        }
    }

    // Utility function to enable editing for a field
    function enableEditing(fieldId, buttonId) {
        const field = document.getElementById(fieldId);
        const button = document.getElementById(buttonId);

        if (!field || !button) {
            console.error(`Field or button with ID ${fieldId}/${buttonId} not found`);
            return;
        }

        if (button.textContent === 'Edit' || button.textContent === 'Change') {
            // Enable editing
            field.removeAttribute('readonly');
            field.focus();
            button.textContent = 'Save';
        } else if (button.textContent === 'Save') {
            const newValue = field.value.trim();
            clearError(field);

            if (!newValue) {
                showError(field, `${fieldId.charAt(0).toUpperCase() + fieldId.slice(1)} cannot be empty.`);
                return;
            }

            // Field-specific validations
            if (fieldId === 'email' && !newValue.includes('@')) {
                showError(field, 'Email must include @.');
                return;
            }

            if (fieldId === 'password') {
                const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@&#])[A-Za-z\d@&#]{8,}$/;
                if (!passwordRegex.test(newValue)) {
                    showError(
                        field,
                        'Password must be greater than 8 characters and include letters, numbers, and special symbols (@, &, #).'
                    );
                    return;
                }
            }

            if (fieldId === 'telephone') {
                if (!/^\d+$/.test(newValue)) {
                    showError(field, 'Telephone can only contain numbers.');
                    return;
                }
            }

            // Submit the updated value to the server
            sendToServer('/update_profile_field', 'POST', { field: fieldId, value: newValue })
                .then((data) => {
                    if (data.message && data.message.includes('updated successfully')) {
                        alert(`${fieldId.charAt(0).toUpperCase() + fieldId.slice(1)} updated successfully!`);
                        field.setAttribute('readonly', true);
                        button.textContent = 'Change';
                    } else {
                        showError(field, data.message || 'Failed to update the field. Please try again.');
                    }
                })
                .catch((error) => {
                    console.error('Error:', error);
                    showError(field, 'An error occurred. Please try again.');
                });
        }
    }

    // Utility function to toggle password visibility
    function togglePasswordVisibility(passwordFieldId, toggleButtonId) {
        const passwordField = document.getElementById(passwordFieldId);
        const toggleButton = document.getElementById(toggleButtonId);

        toggleButton.addEventListener('click', () => {
            if (passwordField.type === 'password') {
                passwordField.type = 'text';
                toggleButton.textContent = 'Hide';
            } else {
                passwordField.type = 'password';
                toggleButton.textContent = 'Show';
            }
        });
    }

    // Upload avatar
    const changeAvatarButton = document.getElementById('change-avatar');
    const avatarImg = document.getElementById('avatar');

    if (changeAvatarButton) {
        changeAvatarButton.addEventListener('click', () => {
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = 'image/*';

            fileInput.addEventListener('change', async () => {
                const file = fileInput.files[0];
                if (file) {
                    const formData = new FormData();
                    formData.append('avatar', file);

                    try {
                        const response = await fetch('/update_avatar', {
                            method: 'POST',
                            body: formData,
                        });

                        const result = await response.json();
                        if (result.success) {
                            alert('Avatar updated successfully!');
                            avatarImg.src = result.new_avatar_url; // Update the displayed avatar
                        } else {
                            alert(result.message);
                        }
                    } catch (error) {
                        console.error('Error uploading avatar:', error);
                        alert('Failed to update avatar. Please try again.');
                    }
                }
            });

            fileInput.click();
        });
    }

    // Delete user profile
    const deleteButton = document.querySelector('button.delete');
    if (deleteButton) {
        deleteButton.addEventListener('click', async function () {
            if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                return;
            }

            const result = await sendToServer('/delete_profile', 'POST', {});
            if (result) {
                if (result.success) {
                    alert(result.message); // Show success message
                    window.location.href = '/'; // Redirect to login page
                } else {
                    alert(result.message || 'Failed to delete your account. Please try again.');
                }
            }
        });
    }

    // Add event listeners to "Change" buttons
    const fieldConfig = [
        { fieldId: 'username', buttonId: 'change-username' },
        { fieldId: 'email', buttonId: 'change-email' },
        { fieldId: 'telephone', buttonId: 'change-telephone' },
        { fieldId: 'password', buttonId: 'change-password' },
        { fieldId: 'introduction', buttonId: 'edit-introduction' },
    ];

    fieldConfig.forEach(({ fieldId, buttonId }) => {
        const button = document.getElementById(buttonId);
        if (button) {
            button.addEventListener('click', () => enableEditing(fieldId, buttonId));
        } else {
            console.warn(`Button with ID ${buttonId} not found`);
        }
    });

    // Add event listener for toggling password visibility
    togglePasswordVisibility('password', 'toggle-password');
});


window.onload = function () {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        // Apply saved theme to body and all relevant sections
        document.body.classList.add(savedTheme + '-theme');

        const sections = ['nav', 'header', '.search-bar', 'footer', '.menu-list', '.admin-profile-container'];
        sections.forEach(selector => {
            const element = document.querySelector(selector);
            if (element) {
                element.classList.add(savedTheme + '-theme');
            }
        });

        const themeSelector = document.getElementById('theme');
        if (themeSelector) {
            themeSelector.value = savedTheme;
        }
    }
};

// Tab functionality
function openTab(evt, tabName) {
    var i, tabcontent, tabbuttons;

    // Hide all tab content
    tabcontent = document.getElementsByClassName("tab-content");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
        tabcontent[i].classList.remove("active");
    }

    // Remove active state from all tab buttons
    tabbuttons = document.getElementsByClassName("tab-button");
    for (i = 0; i < tabbuttons.length; i++) {
        tabbuttons[i].classList.remove("active");
    }

    // Show current tab content and set button as active
    document.getElementById(tabName).style.display = "block";
    document.getElementById(tabName).classList.add("active");
    evt.currentTarget.classList.add("active");
}

// Initialize default tab
document.addEventListener("DOMContentLoaded", function() {
    document.getElementById("personal-info").style.display = "block";
});


// Switch theme across the page
function switchTheme(theme) {
    // Remove all existing themes
    document.body.classList.remove('animal-theme', 'night-theme', 'parrot-theme', 'classic-theme');
    
    const elementsToUpdate = [
        document.body, 
        document.querySelector('nav'), 
        document.querySelector('header'),
        document.querySelector('.search-bar'),
        document.querySelector('footer'),
        document.querySelector('.menu-list'),
        document.querySelector('.admin-profile-container')
    ];

    // Add the new theme class
    elementsToUpdate.forEach(element => {
        if (element) {
            element.classList.remove('animal-theme', 'night-theme', 'parrot-theme', 'classic-theme');
            element.classList.add(theme + '-theme');
        }
    });

    // Store the selected theme in localStorage
    localStorage.setItem('theme', theme);
}

// Handle theme change from a select dropdown or button
function changeTheme() {
    const theme = document.getElementById('theme').value;

    // Apply the new theme globally
    switchTheme(theme);
}
