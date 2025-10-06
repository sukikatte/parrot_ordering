document.addEventListener('DOMContentLoaded', function () {
    const changeButtons = document.querySelectorAll('.change-button');
    const returnButton = document.querySelector('#return-button');
    const avatarChangeButton = document.querySelector('#change-avatar');
    const deleteButton = document.querySelector('.delete');
    const categorySelect = document.querySelector('#category-select');
    const assignCategoryButton = document.querySelector('#assign-category-button');
    const banButton = document.getElementById('ban-button'); // New Ban button

    const userId = window.location.pathname.split('/').pop();

    // Utility function to display validation error messages
    function showError(field, message) {
        const errorSpan = document.getElementById(`${field.id}-error`);
        if (errorSpan) {
            errorSpan.textContent = message;
            errorSpan.style.color = 'red';
        }
    }

    function clearError(field) {
        const errorSpan = document.getElementById(`${field.id}-error`);
        if (errorSpan) {
            errorSpan.textContent = '';
        }
    }

    /**
     * Enable field editing
     */
    function enableEditing(field, button) {
        if (button.textContent === 'Change') {
            field.removeAttribute('readonly');
            field.focus();
            button.textContent = 'Save';
        } else {
            const fieldName = field.getAttribute('id');
            const newValue = field.value.trim();

            clearError(field);

            // Validation rules
            if (fieldName === 'email') {
                if (!newValue.includes('@')) {
                    showError(field, 'Email must contain @.');
                    return;
                }
            }
            if (fieldName === 'password') {
                const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@&#]).{9,}$/;
                if (!passwordRegex.test(newValue)) {
                    showError(
                        field,
                        'Password must be greater than 8 characters and include letters, numbers, and special symbols (@, &, #).'
                    );
                    return;
                }
            }
            if (fieldName === 'telephone') {
                const telephoneRegex = /^\d+$/;
                if (!telephoneRegex.test(newValue)) {
                    showError(field, 'Telephone must contain only numbers.');
                    return;
                }
            }

            // Submit updates
            fetch('/admin_update_field', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ user_id: userId, field: fieldName, value: newValue }),
            })
                .then((response) => response.json())
                .then((data) => {
                    if (data.message.includes('updated successfully')) {
                        alert(`${fieldName} updated successfully!`);
                        field.setAttribute('readonly', true);
                        button.textContent = 'Change';
                    } else {
                        alert(data.message);
                    }
                })
                .catch((error) => {
                    console.error('Error:', error);
                    alert('Failed to update. Please try again.');
                });
        }
    }

    /**
     * Change the avatar
     */
    function changeAvatar() {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';

        fileInput.addEventListener('change', () => {
            const file = fileInput.files[0];
            if (file) {
                const formData = new FormData();
                formData.append('avatar', file);

                // Upload avatar to server
                fetch(`/admin_update_avatar/${userId}`, {
                    method: 'POST',
                    body: formData,
                })
                    .then((response) => response.json())
                    .then((data) => {
                        if (data.message.includes('updated successfully')) {
                            alert('Avatar updated successfully!');
                            document.querySelector('#avatar').src = data.new_avatar_url;
                        } else {
                            alert(data.message);
                        }
                    })
                    .catch((error) => {
                        console.error('Error:', error);
                        alert('Failed to update avatar. Please try again.');
                    });
            }
        });

        fileInput.click();
    }

    /**
     * Delete user
     */
    function deleteUser() {
        if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            fetch(`/admin_account/${userId}`, { method: 'DELETE' })
                .then((response) => response.json())
                .then((data) => {
                    if (data.message.includes('deleted successfully')) {
                        alert('User deleted successfully!');
                        window.location.href = '/admin_accounts';
                    } else {
                        alert(data.message);
                    }
                })
                .catch((error) => {
                    console.error('Error:', error);
                    alert('Failed to delete user. Please try again.');
                });
        }
    }

    /**
     * Return user list
     */
    function goBack() {
        window.history.back();
    }

    /**
     * Assign category to cook
     */
    function assignCategory() {
        const selectedCategory = categorySelect.value;

        fetch('/admin_assign_category', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ user_id: userId, category: selectedCategory }),
        })
            .then((response) => response.json())
            .then((data) => {
                if (data.message.includes('successfully')) {
                    alert('Category assigned successfully!');
                    document.querySelector('#current-category').textContent = selectedCategory;
                } else {
                    alert(data.message);
                }
            })
            .catch((error) => {
                console.error('Error:', error);
                alert('Failed to assign category. Please try again.');
            });
    }

    /**
     * Ban/Unban user
     */
    function toggleBan() {
        const currentText = banButton.textContent.trim().toLowerCase();
        const action = currentText === 'ban' ? 'ban' : 'unban';

        fetch(`/admin_ban_user/${userId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: action })
        })
        .then(response => response.json())
        .then(data => {
            alert(data.message);
            // Toggle button text
            if (action === 'ban') {
                banButton.textContent = 'Unban';
            } else {
                banButton.textContent = 'Ban';
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Failed to update ban status. Please try again.');
        });
    }

    changeButtons.forEach((button) => {
        const fieldId = button.getAttribute('data-field-id');
        const field = document.getElementById(fieldId);

        button.addEventListener('click', () => enableEditing(field, button));
    });

    avatarChangeButton.addEventListener('click', changeAvatar);

    if (deleteButton) {
        deleteButton.addEventListener('click', deleteUser);
    }

    returnButton.addEventListener('click', goBack);

    if (assignCategoryButton) {
        assignCategoryButton.addEventListener('click', assignCategory);
    }

    // Add event listener for ban button
    const banButtonElement = document.getElementById('ban-button');
    if (banButtonElement) {
        banButtonElement.addEventListener('click', toggleBan);
    }
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
