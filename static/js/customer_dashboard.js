// static/js/customer_dashboard.js

function loadDishesAjax() {
    fetch('/api/customer_menu')
        .then(response => {
            if(!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            // data[{cook_name: 'X', dishes: [ {...}, {...} ]}, ...]
            const container = document.getElementById('menu-container');
            container.innerHTML = '';

            if (data.length === 0) {
                // If no dishes, show prompt message
                const noMenuMessage = document.createElement('div');
                noMenuMessage.className = 'no-menu-message';
                noMenuMessage.innerHTML = `
                    <h2>No dishes available today</h2>
                    <p>Chefs haven't uploaded today's menu yet, please check back later~</p>
                `;
                container.appendChild(noMenuMessage);
                return;
            }

            data.forEach(chefGroup => {
                const section = document.createElement('div');
                section.className = 'chef-section';

                const heading = document.createElement('h2');
                heading.textContent = `Dishes by Chef: ${chefGroup.cook_name}`;
                section.appendChild(heading);

                const dishGrid = document.createElement('div');
                dishGrid.className = 'dish-grid';

                chefGroup.dishes.forEach(dish => {
                    const dishItem = document.createElement('div');
                    dishItem.className = 'dish';

                    const dishInfo = `
                        <div class="dish-info">
                            <img src="${dish.image_url}" alt="${dish.dish_name}">
                            <h3>${dish.dish_name}</h3>
                            <p><strong>Category:</strong> ${dish.category}</p>
                            <p><strong>Price:</strong> $${dish.price}</p>
                            <p><strong>Available:</strong> ${dish.quantity}</p>
                            <p><strong>Cooked by:</strong> ${dish.cook_name}</p>
                        </div>
                    `;

                    let actionsHTML = '';
                    if (dish.quantity > 0) {
                        actionsHTML = `
                            <div class="dish-actions">
                                <input type="number" id="quantity_${dish.dish_id}" value="1" min="1" max="${dish.quantity}">
                                <button onclick="addToCart('${dish.dish_id}')">Add to Cart</button>
                                <a href="/dish/${dish.dish_id}" class="view-description-btn">View Description</a>
                            </div>
                        `;
                    } else {
                        actionsHTML = `
                            <div class="dish-actions">
                                <p style="color: red; font-weight: bold; margin: 0; text-align: center; font-size: 0.8rem;">Out of Stock</p>
                                <a href="/dish/${dish.dish_id}" class="view-description-btn">View Description</a>
                            </div>
                        `;
                    }

                    dishItem.innerHTML = `<div class="dish-content">${dishInfo}${actionsHTML}</div>`;
                    dishGrid.appendChild(dishItem);
                });

                section.appendChild(dishGrid);
                container.appendChild(section);
            });
        })
        .catch(error => {
            console.error('Error loading dishes:', error);
        });
}

function addToCart(dishId) {
    const quantityInput = document.getElementById('quantity_' + dishId);
    let quantity = parseInt(quantityInput.value);
    const maxQuantity = parseInt(quantityInput.getAttribute('max'));

    if (quantity > maxQuantity) {
        alert(`The number of selections exceeds the number available. A maximum of ${maxQuantity} can be selected`);
        quantityInput.value = maxQuantity;
        quantity = maxQuantity;
    }

    fetch('/add_to_cart', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ dish_id: dishId, quantity: quantity })
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred. Please try again later.');
    });
}

function viewCart() {
    window.location.href = '/view_cart';
}

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
