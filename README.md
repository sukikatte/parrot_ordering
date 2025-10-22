# Parrot Ordering - Online Campus Food Ordering Platform

A comprehensive web application for campus food ordering with multi-user role-based access control, built using Flask, SQLAlchemy, and modern web technologies.

## 🚀 Features

### Multi-User System
- **Role-Based Access Control**: Customer, Cook, Administrator roles with specific permissions
- **Secure Authentication**: User registration, login, and session management with password encryption
- **Profile Management**: User profiles with avatar upload and personal information editing

### Menu Management
- **Daily Menu Publishing**: Cooks can publish daily menus with available dishes and quantities
- **Real-time Inventory**: Dynamic inventory tracking with automatic updates when orders are placed
- **Category Management**: Organized dish categories (Desserts, Fast Food, Beverages, Hot Dishes, Vegetarian)

### Ordering System
- **Smart Shopping Cart**: Add, update, and remove items with quantity validation
- **Order Processing**: Complete order workflow from cart to submission with inventory updates
- **Order History**: Comprehensive order tracking and history for customers

### Social Features
- **Friend System**: Add friends, send friend requests, and manage friendships
- **Messaging System**: Real-time messaging between customers with conversation history
- **Review System**: Customer reviews for dishes with chef reply functionality

### Administrative Features
- **User Management**: Comprehensive user account management with ban/unban functionality
- **Menu Oversight**: Admin control over all menu items and categories
- **System Monitoring**: User activity tracking and system administration tools

## 🛠️ Technology Stack

- **Backend**: Flask 3.1.2, Python 3.x
- **Database**: SQLAlchemy 2.0.43, SQLite
- **Frontend**: JavaScript, HTML5, CSS3, Bootstrap
- **Security**: Werkzeug 3.1.3 for password hashing
- **File Management**: Secure file upload handling

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ordering_parrot
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Run setup script**
   ```bash
   python setup.py
   ```

4. **Start the application**
   ```bash
   python run.py
   ```

5. **Access the platform**
   Open your browser and navigate to `http://localhost:5000`

## 🔑 Default Test Accounts

- **Administrator**: `admin` / `admin123`
- **Cook**: `cook1` / `cook123`
- **Customer**: `customer1` / `customer123`

## 📁 Project Structure

```
ordering_parrot/
├── app.py                 # Main Flask application
├── models.py             # Database models and relationships
├── requirements.txt      # Python dependencies
├── run.py               # Application startup script
├── setup.py             # Automated setup script
├── templates/           # HTML templates
├── static/              # Static assets
│   ├── css/            # Stylesheets
│   ├── js/             # JavaScript files
│   └── uploads/        # User uploaded files
└── instance/           # Database files
```

## 🎨 Theme System

The platform includes multiple theme options:
- **Classic Theme**: Clean, professional design
- **Night Mode**: Dark theme for better night usage
- **Animal Theme**: Cute animal backgrounds with three variants (bg01.jpg, bg02.jpg, bg03.jpg)

## 🔧 Key Features in Detail

### Customer Features
- Browse daily menus organized by chef
- Add items to shopping cart with quantity selection
- Place orders with real-time inventory validation
- View order history and track order status
- Add friends and send messages
- Write reviews for dishes

### Cook Features
- Upload dishes with images and descriptions
- Set daily menu availability and quantities
- View and respond to customer reviews
- Monitor order statistics and customer feedback

### Administrator Features
- Manage user accounts (view, edit, ban/unban)
- Oversee all menu items and categories
- Monitor system activity and user statistics
- Assign categories to cooks

## 🏗️ Technical Highlights

- **Scalable Architecture**: Modular design supporting future expansion
- **Security**: Secure authentication with password hashing
- **Responsive Design**: Cross-platform compatibility for desktop and mobile
- **Real-time Updates**: Dynamic content loading with AJAX
- **File Management**: Secure image upload and management
- **Database Optimization**: Efficient queries and relationships

## 📝 Development

This project was developed as a team effort with the following key components:

- **Backend Development**: Flask routes, database models, business logic
- **Frontend Development**: Responsive UI, JavaScript interactions, AJAX communication
- **Database Design**: Relational database with proper relationships and constraints
- **Security Implementation**: Secure authentication and data protection

## 🤝 Contributing

This project was developed as part of a team effort. For questions or contributions, please contact the development team.

## 📄 License

This project is developed for educational purposes as part of a team project.

## 📞 Contact

For more information about this project, please refer to the project documentation or contact the development team.

---

**Parrot Ordering** - Bringing campus dining into the digital age! 🦜