document.addEventListener('DOMContentLoaded', (event) => {
            loadDishes();  // Load all dishes
            loadTodayMenu();  // Load today's menu if needed
            document.getElementById('dishForm').onsubmit = handleDishFormSubmit; // Set form submit handler
        });
// 加载所有菜品列表
function loadDishes() {
    fetch('/api/cook_dashboard')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(dishes => {
            console.log(dishes); // 输出加载的菜品数据
            const menuList = document.getElementById('menu-list');
            menuList.innerHTML = ''; // 清空当前菜单
            dishes.forEach(dish => {
                const dishItem = document.createElement('article');
                dishItem.className = 'menu-item';
                dishItem.innerHTML = `  
                    <img src="${dish.image_url}" alt="${dish.dish_name}" />  
                    <h3>${dish.dish_name}</h3>  
                    <p>Category: ${dish.category}</p>  
                    <p>Price: $${dish.price}</p>  
                    <div class="dish-details">  
                        <label>  
                            Select for Today's Menu  
                            <input type="checkbox" name="dish_ids[]" value="${dish.dish_id}">  
                        </label>  
                        <label>  
                            Quantity:  
                            <input type="number" name="quantities[]" min="0" value="0">  
                        </label>  
                        <button type="button" onclick="toggleDescription(this, ${dish.dish_id})">View Description</button>
                        <div id="description-${dish.dish_id}" class="description" style="display: none;">
                            <p>${dish.description}</p>
                        </div>
                    </div>
                `;
                menuList.appendChild(dishItem);
            });
        })
        .catch(error => console.error('Error loading dishes:', error));
}


// 切换描述的显示和隐藏
function toggleDescription(button, dishId) {
    const descriptionElement = document.getElementById('description-' + dishId);
    if (descriptionElement.style.display === 'none') {
        descriptionElement.style.display = 'block';
        button.textContent = 'Hide Description';
    } else {
        descriptionElement.style.display = 'none';
        button.textContent = 'View Description';
    }
}


// 处理表单提交，将选中的菜品和数量提交到服务器
function submitMenu() {
    const formData = new FormData();
    const dishItems = document.querySelectorAll('.dish-item');

    dishItems.forEach(dishItem => {
        const checkbox = dishItem.querySelector('input[name="dish_ids[]"]');
        const quantityInput = dishItem.querySelector('input[name="quantities[]"]');

        if (checkbox.checked) {
            const quantity = quantityInput.value;
            if (quantity > 0) {
                formData.append('dish_ids[]', checkbox.value);
                formData.append('quantities[]', quantity);
            } else {
                alert(`Please enter a valid quantity for ${checkbox.value}`);
            }
        }
    });

    if (formData.has('dish_ids[]')) {
        fetch('/cook_dashboard', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(data => { throw new Error(data.message); });
            }
            return response.json();
        })
        .then(data => {
            alert(data.message);
            // Optionally reload the page or update the UI
            location.reload();
        })
        .catch(error => {
            console.error('Error:', error);
            alert("An error occurred while submitting the menu: " + error.message);
        });
    } else {
        alert('Please select at least one dish and enter a valid quantity.');
    }
}


// Loads and displays the chef's menu of the day
function loadTodayMenu() {
    fetch('/api/cook_menu')
        .then(response => response.json())
        .then(dishes => {
            const todayMenuSection = document.getElementById('today-menu');
            todayMenuSection.innerHTML = ''; // Clear current content
            if (dishes.length > 0) {
                todayMenuSection.innerHTML = '<h2>Your Menu for Today:</h2>';
                dishes.forEach(dish => {
                    const dishItem = document.createElement('div');
                    dishItem.className = 'dish-item';
                    dishItem.innerHTML = `
                        <img src="${dish.image_url}" alt="${dish.dish_name}" />
                        <h3>${dish.dish_name}</h3>
                        <p>Category: ${dish.category}</p>
                        <p>Price: $${dish.price}</p>
                        <label>Quantity: ${dish.quantity}</label>
                        <button type="button" onclick="toggleDescription(this, ${dish.dish_id})">View Description</button>
                        <div id="description-${dish.dish_id}" class="description" style="display: none;">
                            <p>${dish.description}</p>
                        </div>
                    `;
                    todayMenuSection.appendChild(dishItem);
                });
            } else {
                todayMenuSection.innerHTML = '<p>You have not selected any dishes for today.</p>';
            }
        })
        .catch(error => console.error('Error loading today\'s menu:', error));
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
