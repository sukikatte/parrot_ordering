document.addEventListener('DOMContentLoaded', (event) => {
    loadMenu(); // Load menu on page load
});

let allDishes = []; // Array to store all dishes

// Function to load the menu items (unchanged)
function loadMenu() {
    fetch('/menu')
        .then(response => response.json())
        .then(dishes => {
            allDishes = dishes; // Save all dishes to the global variable
            displayMenu(dishes); // Display all dishes by default
        })
        .catch(error => console.error('Error loading menu:', error));
}

// Function to display menu based on the dishes passed
function displayMenu(dishes) {
    const menuList = document.getElementById('menu-list');
    menuList.innerHTML = ''; // Clear the current list

    dishes.forEach(dish => {
        const dishItem = document.createElement('div');
        dishItem.className = 'menu-item';
        dishItem.innerHTML = `    
            <img src="${dish.image_url}" alt="${dish.name}" />  
            <h3>${dish.name}</h3>  
            <p>Category: ${dish.category}</p>  
            <p>Price: $${dish.price}</p>  
            <button onclick="promptLogin('viewDescription')">View Description</button>  
            <button onclick="promptLogin('startOrdering')">Add to Cart</button>  
        `;
        menuList.appendChild(dishItem);
    });
}

// Function to filter the menu based on category
function filterMenu(category) {
    // Reset button states
    const buttons = document.querySelectorAll('#category-buttons button');
    buttons.forEach(button => {
        button.classList.remove('selected'); // Remove 'selected' class from all buttons
    });

    if (category === 'View All') {
        displayMenu(allDishes); // Show all dishes
    } else {
        const filteredDishes = allDishes.filter(dish => dish.category === category);
        displayMenu(filteredDishes); // Display filtered dishes
    }

    // Highlight the selected category button
    const selectedButton = Array.from(buttons).find(button => button.textContent === category);
    if (selectedButton) {
        selectedButton.classList.add('selected'); // Add 'selected' class to the clicked button
    }
}


// Function to handle search functionality
function searchDishes(query) {
    // Filter dishes based on the search query
    const filteredDishes = allDishes.filter(dish =>
        dish.name.toLowerCase().includes(query.toLowerCase())
    );
    displayMenu(filteredDishes); // Display filtered dishes
}

// Event listener for the search button
document.getElementById('search-button').addEventListener('click', () => {
    const query = document.getElementById('search-box').value;
    searchDishes(query); // Call the search function with the query
});

// Event listener for the 'Enter' key to trigger the search (optional but useful for user experience)
document.getElementById('search-box').addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        const query = event.target.value;
        searchDishes(query); // Trigger search when 'Enter' is pressed
    }
});

// Function to show the menu overview (unchanged)
function showMenuOverview() {
    displayMenu(allDishes); // Show all dishes
    document.getElementById('todaysMenuSection').style.display = 'none';
    document.getElementById('category-buttons').style.display = 'block'; // Show category buttons
    document.getElementById('menu-list').style.display = 'block'; // Ensure the menu list is displayed
    window.scrollTo(); // Scroll to the top of the page
}

// Function to toggle Today's Menu (unchanged)
function toggleTodaysMenu() {
    document.getElementById('todaysMenuSection').style.display = 'block';
    document.getElementById('menu-list').style.display = 'none';
}


// Function to prompt login (unchanged)
function promptLogin(action) {
    var modal = document.getElementById("loginModal");
    var loginMessage = document.getElementById("loginMessage");

    if (action === 'viewDescription') {
        loginMessage.innerText = "Please login to view the description\n" +"𓅩 𓅪 𓅫 𓅭 𓅮 𓅯 𓅩 𓅪 𓅫";
    } else if (action === 'startOrdering') {
        loginMessage.innerText = "Please login to start ordering\n" +"𓅩 𓅪 𓅫 𓅭 𓅮 𓅯 𓅩 𓅪 𓅫";
    } else if (action === 'My Profile') {
        loginMessage.innerText = "Please login to view your account details\n" +"𓅩 𓅪 𓅫 𓅭 𓅮 𓅯 𓅩 𓅪 𓅫";
    } else if (action === 'todaysMenuLogin') {
        loginMessage.innerText = "Please login to view today's menu\n" +"𓅩 𓅪 𓅫 𓅭 𓅮 𓅯 𓅩 𓅪 𓅫";
    }

    modal.style.display = "flex"; // Change display to flex to align at center
}

// Close login modal and keep the page content unchanged (unchanged)
var closeLoginModal = document.getElementById("closeLoginModal");
closeLoginModal.onclick = function() {
    var modal = document.getElementById("loginModal");
    modal.style.display = "none"; // Just close the modal without changing the page content
}

// Click outside of modal to do nothing (unchanged)
window.onclick = function(event) {
    var modal = document.getElementById("loginModal");
    if (event.target == modal) {
        // do nothing
    }
}

// Initial load of the menu (unchanged)
document.addEventListener('DOMContentLoaded', () => {
    loadMenu(); // Load all dishes on initial page load
});
