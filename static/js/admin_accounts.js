document.addEventListener('DOMContentLoaded', function () {
    const roleFilter = document.getElementById('role-filter'); // Dropdown for role filtering
    const searchBox = document.getElementById('search-box'); // Search input box
    const searchButton = document.getElementById('search-button'); // Search button
    const clearButton = document.getElementById('clear-button'); // Clear button
    const userList = document.getElementById('user-list'); // Container for user list

    // Fetch users from the backend and render them
    function fetchUsers() {
        const role = roleFilter.value; // Get selected role
        const search = searchBox.value.trim(); // Get search query

        let query = '/api/admin_accounts'; // Base API endpoint
        const params = [];
        if (role) params.push(`role=${encodeURIComponent(role)}`);
        if (search) params.push(`search=${encodeURIComponent(search)}`);
        if (params.length) query += `?${params.join('&')}`;

        // Fetch data from the server
        fetch(query)
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`Failed to fetch users: ${response.statusText}`);
                }
                return response.json();
            })
            .then((users) => {
                // Clear the user list
                userList.innerHTML = '';

                // Handle no users case
                if (users.length === 0) {
                    userList.innerHTML = '<p>No users found.</p>';
                    return;
                }

                // Render each user card
                users.forEach((user) => {
                    const userCard = document.createElement('div');
                    userCard.className = 'user-card';
                    userCard.innerHTML = `
                        <img src="${user.avatar_url || '/static/images/default_avatar.png'}" alt="Avatar">
                        <div class="user-info">
                            <p><strong>User Name:</strong> ${user.username}</p>
                            <p><strong>Email:</strong> ${user.email}</p>
                        </div>
                        <button class="view-details" data-user-id="${user.user_id}">View</button>
                    `;
                    userList.appendChild(userCard);
                });

                // Add event listeners to "View" buttons
                const viewButtons = document.querySelectorAll('.view-details');
                viewButtons.forEach((button) => {
                    button.addEventListener('click', function () {
                        const userId = this.getAttribute('data-user-id');
                        viewUserDetails(userId);
                    });
                });
            })
            .catch((error) => {
                console.error('Error:', error);
                userList.innerHTML = '<p>An error occurred while fetching users. Please try again later.</p>';
            });
    }

    // Redirect to user details page
    function viewUserDetails(userId) {
        window.location.href = `/admin_account/${userId}`;
    }

    // Clear search and reload all users
    clearButton.addEventListener('click', function () {
        roleFilter.value = '';
        searchBox.value = '';
        fetchUsers(); // Reload all users
    });

    // Event listeners for role filter and search button
    searchButton.addEventListener('click', fetchUsers);
    roleFilter.addEventListener('change', fetchUsers);

    // Load all users on initial page load
    fetchUsers();
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
