from flask import Flask, render_template, request, jsonify, redirect, url_for, session
from models import db, migrate, User, Customer, Cook, Administrator, Dish, Menu, ShoppingCartItem, Order, OrderItem, \
    Friendship, Message, DishReview, ChefReply
import re
import os
import uuid
from werkzeug.utils import secure_filename
from datetime import datetime, date, timedelta
from werkzeug.security import generate_password_hash, check_password_hash


app = Flask(__name__, static_folder='static')
app.secret_key = 'your_secret_key'  # 设置安全密钥

# Configure the SQLite database
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///users.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER_AVATARS'] = os.path.join('static', 'uploads', 'avatars')
app.config['UPLOAD_FOLDER_DISHES'] = os.path.join('static', 'uploads', 'dishes')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

# Initialize the database and migration tool
db.init_app(app)
migrate.init_app(app, db)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/')
def login_page():
    return render_template('login.html')

@app.route('/register')
def register_page():
    return render_template('register.html')

@app.route('/login', methods=['POST'])
def login():
    username = request.form.get('username')
    password = request.form.get('password')

    # Check if user exists
    user = User.query.filter_by(username=username).first()
    if user and check_password_hash(user.password, password):
        if user.user_id in banned_users:
            return jsonify({"message": "This account has been banned."}), 403
        # Determine user role
        role = None
        if user.customer:
            role = "Customer"
        elif user.cook:
            role = "Cook"
        elif user.administrator:
            role = "Administrator"

        session['user'] = {"username": user.username, "role": role, "user_id": user.user_id}  # Store user information in session
        session['user_id'] = user.user_id  # Directly store user_id in session
        return jsonify({"message": "Login Success", "role": role})

    return jsonify({"message": "Invalid username or password"}), 401


@app.route('/register', methods=['POST'])
def register():
    role = request.form.get('role')
    username = request.form.get('username', '').strip()
    email = request.form.get('email', '').strip()
    telephone = request.form.get('telephone', '').strip()
    password = request.form.get('password', '').strip()
    confirm_password = request.form.get('confirm_password', '').strip()

    if not username:
        return jsonify({"field": "username", "message": "Username cannot be empty."}), 400

    if not email or not re.match(r'^[\w\.-]+@[\w\.-]+\.\w+$', email):
        return jsonify({"field": "email", "message": "Invalid email format."}), 400

    if not re.match(r'^\d+$', telephone):
        return jsonify({"field": "telephone", "message": "Telephone can only contain numbers."}), 400

    if len(password) < 8 or not re.search(r'[0-9]', password) or not re.search(r'[A-Za-z]', password) or not re.search(r'[@&#]', password):
        return jsonify({
            "field": "password",
            "message": "Password must be at least 8 characters long and include letters, numbers, and special symbols (@, &, #)."
        }), 400

    if password != confirm_password:
        return jsonify({"field": "confirm_password", "message": "Passwords do not match."}), 400

    # Proper hash method
    hashed_password = generate_password_hash(password, method='pbkdf2:sha256')

    try:
        # Add to User table
        new_user = User(username=username, password=hashed_password, email=email, telephone=telephone)
        db.session.add(new_user)
        db.session.flush()  # Commit to the database to generate User ID

        # Add to the corresponding table based on role
        if role == 'Customer':
            new_customer = Customer(user_id=new_user.user_id)
            db.session.add(new_customer)
        elif role == 'Cook':
            new_cook = Cook(user_id=new_user.user_id, category='')
            db.session.add(new_cook)
        elif role == 'Administrator':
            new_admin = Administrator(user_id=new_user.user_id)
            db.session.add(new_admin)
        else:
            return jsonify({"field": "role", "message": "Invalid role provided."}), 400

        db.session.commit()
        return jsonify({"message": "Registration successful"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"message": "Registration failed", "error": str(e)}), 500


@app.route('/unlog_dashboard')
def unlog_dashboard():
    # Get today's date
    today = date.today()

    # Query all available menu items today
    menus = Menu.query.filter_by(date=today).all()

    # Extract menu information from menu items and count the total number of each menu item
    dish_quantities = {}
    for menu_item in menus:
        dish_id = menu_item.dish_id
        if dish_id in dish_quantities:
            dish_quantities[dish_id]['quantity'] += menu_item.quantity
        else:
            dish = Dish.query.get(dish_id)
            dish_quantities[dish_id] = {
                'dish_id': dish.dish_id,
                'name': dish.dish_name,
                'image_url': dish.image_url,
                'category': dish.category,
                'price': dish.price,
                'description': dish.description,
                'quantity': menu_item.quantity
            }

    # Pass the menu list to the template
    dishes = list(dish_quantities.values())

    return render_template('unlog_dashboard.html', dishes=dishes)

@app.route('/delete_profile', methods=['POST'])
def delete_profile():
    if 'user' not in session:
        return jsonify({"message": "User not logged in"}), 403

    user_id = session['user']['user_id']
    user = User.query.filter_by(user_id=user_id).first()

    if not user:
        return jsonify({"message": "User not found"}), 404

    try:
        # Delete customer-related records
        if user.customer:
            customer_id = user.customer.customer_id
            # Clear shopping cart items
            ShoppingCartItem.query.filter_by(customer_id=customer_id).delete()
            #Cleaning messages (as sender or receiver)
            Message.query.filter_by(sender_id=customer_id).delete()
            Message.query.filter_by(receiver_id=customer_id).delete()
            #Unfriending (as initiator or recipient)
            Friendship.query.filter_by(customer_id=customer_id).delete()
            Friendship.query.filter_by(friend_id=customer_id).delete()
            #Clean up Order items (delete OrderItem and then Order)
            order_ids = [o.order_id for o in Order.query.filter_by(customer_id=customer_id).all()]
            for oid in order_ids:
                OrderItem.query.filter_by(order_id=oid).delete()
            #Clearing order
            Order.query.filter_by(customer_id=customer_id).delete()
            # Clean-up evaluation
            DishReview.query.filter_by(customer_id=customer_id).delete()
            db.session.delete(user.customer)

        # Delete records related to the chef
        if user.cook:
            cook_id = user.cook.cook_id
            Menu.query.filter_by(cook_id=cook_id).delete()
            OrderItem.query.filter_by(cook_id=cook_id).delete()
            DishReview.query.filter_by(cook_id=cook_id).delete()
            ChefReply.query.filter_by(cook_id=cook_id).delete()
            db.session.delete(user.cook)

        # Delete records related to administrators
        if user.administrator:
            db.session.delete(user.administrator)

        db.session.delete(user)
        db.session.commit()

        # 清除会话
        session.pop('user', None)

        return jsonify({"success": True, "message": "Your account has been deleted successfully."})
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": f"Error deleting account: {e}"}), 500

@app.route('/admin_dashboard')
def admin_dashboard():
    if 'user' not in session or session['user']['role'] != 'Administrator':
        return redirect(url_for('login_page'))
    return render_template('admin_dashboard.html')


@app.route('/admin_menu', methods=['GET'])
def admin_menu():
    if 'user' not in session or session['user']['role'] != 'Administrator':
        return redirect(url_for('login_page'))

    # Get today's date
    today = date.today()
    # Query all available menu items today
    menus = Menu.query.filter_by(date=today).all()

    # Extract menu information from menu items and count the total number of each menu item
    dish_quantities = {}
    for menu_item in menus:
        dish_id = menu_item.dish_id
        cook_id = menu_item.cook_id
        if (dish_id, cook_id) in dish_quantities:
            dish_quantities[(dish_id, cook_id)]['quantity'] += menu_item.quantity
        else:
            dish = Dish.query.get(dish_id)
            cook = Cook.query.get(cook_id)
            dish_quantities[(dish_id, cook_id)] = {
                'menu_id': menu_item.menu_id,
                'dish_id': dish.dish_id,
                'name': dish.dish_name,
                'image_url': dish.image_url,
                'category': dish.category,
                'price': dish.price,
                'description': dish.description,
                'quantity': menu_item.quantity,
                'cook_name': cook.user.username
            }

    # Pass the menu list to the template
    dishes = list(dish_quantities.values())

    return render_template('admin_menu.html', dishes=dishes)

@app.route('/admin_delete_menu_item/<int:menu_id>', methods=['POST'])
def admin_delete_menu_item(menu_id):
    if 'user' not in session or session['user']['role'] != 'Administrator':
        return jsonify({"message": "Permission denied"}), 403

    menu_item = Menu.query.get(menu_id)
    if not menu_item:
        return jsonify({"message": "Menu item not found"}), 404

    try:
        db.session.delete(menu_item)
        db.session.commit()
        return redirect(url_for('admin_menu'))
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Error deleting menu item: {e}"}), 500


# Render HTML pages
@app.route('/admin_accounts', methods=['GET'])
def admin_accounts_page():
    if 'user' not in session or session['user']['role'] != 'Administrator':
        return redirect(url_for('login_page'))
    return render_template('admin_accounts.html')  # 渲染 HTML 页面

# apis that provide user data
@app.route('/api/admin_accounts', methods=['GET'])
def admin_accounts_api():
    if 'user' not in session or session['user']['role'] != 'Administrator':
        return jsonify({'error': 'Unauthorized'}), 401

    # Query parameter
    role_filter = request.args.get('role')  # Customer, Cook, Administrator, None
    search_query = request.args.get('search')  # 搜索条件

    # Build query
    query = User.query
    if role_filter:
        if role_filter == "Customer":
            query = query.join(Customer)
        elif role_filter == "Cook":
            query = query.join(Cook)
        elif role_filter == "Administrator":
            query = query.join(Administrator)

    if search_query:
        query = query.filter(
            (User.username.contains(search_query)) | (User.email.contains(search_query))
        )

    users = query.all()

    # Return user data
    user_data = [
        {
            "user_id": user.user_id,
            "username": user.username,
            "email": user.email,
            "role": "Customer" if user.customer else "Cook" if user.cook else "Administrator",
            "avatar_url": user.avatar_url if hasattr(user, 'avatar_url') and user.avatar_url else "/static/images/default_avatar.png"
        }
        for user in users
    ]
    return jsonify(user_data)

banned_users = set()  # 全局集合，存储被ban的用户ID

@app.route('/admin_ban_user/<int:user_id>', methods=['POST'])
def admin_ban_user(user_id):
    if 'user' not in session or session['user']['role'] != 'Administrator':
        return jsonify({"message": "Permission denied"}), 403

    user = User.query.get(user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404

    data = request.get_json()
    action = data.get('action')  # 可能为 'ban' 或 'unban'

    if action == 'ban':
        banned_users.add(user_id)
        return jsonify({"message": f"User banned successfully"}), 200
    elif action == 'unban':
        if user_id in banned_users:
            banned_users.discard(user_id)
        return jsonify({"message": f"User unbanned successfully"}), 200
    else:
        return jsonify({"message": "Invalid action"}), 400


@app.route('/logout')
def logout():
    session.pop('user', None)
    return redirect(url_for('login_page'))


@app.route('/admin_account/<int:user_id>', methods=['GET', 'DELETE', 'POST'])
def admin_user_details(user_id):
    if 'user' not in session or session['user']['role'] != 'Administrator':
        return redirect(url_for('login_page'))

    user = User.query.filter_by(user_id=user_id).first()
    if not user:
        return "User not found", 404

    if request.method == 'DELETE':
        try:

            if user.cook:
                cook_id = user.cook.cook_id
                Menu.query.filter_by(cook_id=cook_id).delete()
                OrderItem.query.filter_by(cook_id=cook_id).delete()
                DishReview.query.filter_by(cook_id=cook_id).delete()
                ChefReply.query.filter_by(cook_id=cook_id).delete()

            # 如果是Customer账号，清理与Customer关联的记录
            if user.customer:
                customer_id = user.customer.customer_id
                # 清理购物车项
                ShoppingCartItem.query.filter_by(customer_id=customer_id).delete()
                # 清理消息（作为发送者或接收者）
                Message.query.filter_by(sender_id=customer_id).delete()
                Message.query.filter_by(receiver_id=customer_id).delete()
                # 清理好友关系（作为发起者或接收者）
                Friendship.query.filter_by(customer_id=customer_id).delete()
                Friendship.query.filter_by(friend_id=customer_id).delete()
                # 清理订单项（需先删OrderItem再删Order）
                order_ids = [o.order_id for o in Order.query.filter_by(customer_id=customer_id).all()]
                for oid in order_ids:
                    OrderItem.query.filter_by(order_id=oid).delete()
                # 清理订单
                Order.query.filter_by(customer_id=customer_id).delete()
                # 清理评价
                DishReview.query.filter_by(customer_id=customer_id).delete()

            # 删除用户相关角色记录
            if user.customer:
                db.session.delete(user.customer)
            elif user.cook:
                db.session.delete(user.cook)
            elif user.administrator:
                db.session.delete(user.administrator)

            # 最后删除User本身
            db.session.delete(user)
            db.session.commit()
            return jsonify({"message": "User deleted successfully"})
        except Exception as e:
            db.session.rollback()
            return jsonify({"message": f"Error deleting user: {e}"}), 500

    # 分配类别的逻辑
    if request.method == 'POST':
        # 验证用户是否为厨师
        cook = Cook.query.filter_by(user_id=user_id).first()
        if not cook:
            return jsonify({"message": "This user is not a cook and cannot be assigned a category."}), 400

        # 获取管理员分配的类别
        category = request.form.get('category')
        if not category:
            return jsonify({"message": "No category selected."}), 400

        try:
            # 更新厨师的类别
            cook.category = category
            db.session.commit()

            # 渲染用户详细信息页面
            categories = ['Desserts', 'Fast Food', 'Beverages', 'Hot Dishes', 'Vegetarian']  # 可分配的类别列表
            return render_template(
                'admin_user_details.html',
                user=user,
                cook=cook,
                categories=categories,
                message=f"Category '{category}' assigned successfully!"
            )
        except Exception as e:
            db.session.rollback()
            return jsonify({"message": f"Error assigning category: {e}"}), 500

    # 渲染用户详情页面
    categories = ['Desserts', 'Fast Food', 'Beverages', 'Hot Dishes', 'Vegetarian']  # 可分配的类别列表
    cook = Cook.query.filter_by(user_id=user_id).first()
    return render_template(
        'admin_user_details.html',
        user=user,
        cook=cook,
        categories=categories
    )


@app.route('/admin_profile', methods=['GET', 'POST'])
def admin_profile():
    if 'user' not in session or session['user']['role'] != 'Administrator':
        return redirect(url_for('login_page'))

    # 获取当前登录的用户数据
    user_data = User.query.filter_by(user_id=session['user']['user_id']).first()
    if not user_data:
        return redirect(url_for('login_page'))  # 如果用户未找到，重定向到登录页面

    if request.method == 'POST':
        # 假设用户在页面上选择了一个主题
        selected_theme = request.form.get('theme')
        session['theme'] = selected_theme  # 存储在 session 中

    return render_template('admin_profile.html', user=user_data)




@app.route('/customer_dashboard', methods=['GET'])
def customer_dashboard():
    if 'user' not in session or session['user']['role'] != 'Customer':
        return redirect(url_for('login_page'))

    # 获取今天的日期
    today = date.today()

    # 查询今日所有可用的菜单项
    menus = Menu.query.filter_by(date=today).all()

    # 从菜单项中提取菜品信息，并统计每个菜品的总数量
    dish_quantities = {}
    for menu_item in menus:
        dish_id = menu_item.dish_id
        if dish_id in dish_quantities:
            dish_quantities[dish_id]['quantity'] += menu_item.quantity
        else:
            dish = Dish.query.get(dish_id)
            dish_quantities[dish_id] = {
                'dish_id': dish.dish_id,
                'name': dish.dish_name,
                'image_url': dish.image_url,
                'category': dish.category,
                'price': dish.price,
                'description': dish.description,
                'quantity': menu_item.quantity  # 可用数量
            }

    # 将菜品列表传递给模板
    dishes = list(dish_quantities.values())

    return render_template('customer_dashboard.html', dishes=dishes)

@app.route('/api/customer_menu', methods=['GET'])
def api_customer_menu():
    if 'user' not in session or session['user']['role'] != 'Customer':
        return jsonify({"message": "Unauthorized"}), 403

    today = date.today()
    menus = Menu.query.filter_by(date=today).all()

    cook_dishes_map = {}
    for menu_item in menus:
        dish = menu_item.dish
        cook = menu_item.cook.user.username  # 获取厨师的用户名
        if cook not in cook_dishes_map:
            cook_dishes_map[cook] = []
        cook_dishes_map[cook].append({
            'dish_id': dish.dish_id,
            'name': dish.dish_name,
            'image_url': dish.image_url,
            'category': dish.category,
            'price': dish.price,
            'description': dish.description,
            'quantity': menu_item.quantity,
            'cook_name': cook
        })

    result = []
    for cook_name, dishes in cook_dishes_map.items():
        result.append({
            'cook_name': cook_name,
            'dishes': dishes
        })

    return jsonify(result), 200

@app.route('/dish/<int:dish_id>', methods=['GET'])
def dish_detail(dish_id):
    # Ensure the user is logged in and is a customer
    if 'user' not in session or session['user']['role'] != 'Customer':
        return redirect(url_for('login_page'))

    # Fetch dish information
    dish = Dish.query.get(dish_id)
    if not dish:
        return "Dish not found", 404  # Handle the case where the dish does not exist

    # Fetch all reviews related to the dish, ordered by creation date
    reviews = DishReview.query.filter_by(dish_id=dish_id).order_by(DishReview.created_at.desc()).all()

    # Prepare data for reviews, including replies from chefs
    reviews_data = []
    for review in reviews:
        customer = review.customer.user  # Accessing the user object of the customer
        replies = ChefReply.query.filter_by(review_id=review.review_id).all()
        review_data = {
            'username': customer.username,
            'avatar_url': customer.avatar_url or '/static/images/default_avatar.png',
            'comment_text': review.comment_text,
            'created_at': review.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            'replies': [{
                'cook': {
                    'username': reply.cook.user.username,  # Accessing username through the user relationship
                    'avatar_url': reply.cook.user.avatar_url or '/static/images/default_avatar.png'
                },
                'reply_text': reply.reply_text,
                'created_at': reply.created_at.strftime('%Y-%m-%d %H:%M:%S')
            } for reply in replies if reply.reply_text]  # Include only if there is a reply text
        }
        reviews_data.append(review_data)

    # Render the dish detail page with dish info and reviews
    return render_template('dish_detail.html', dish=dish, reviews=reviews_data)


# Add dishes to cart
@app.route('/add_to_cart', methods=['POST'])
def add_to_cart():
    if 'user' not in session or session['user']['role'] != 'Customer':
        return jsonify({"message": "Is not logged in or has no permissions"}), 403

    data = request.get_json()
    dish_id = data.get('dish_id')
    quantity = data.get('quantity', 1)

    if not dish_id:
        return jsonify({"message": "Missing menu ID"}), 400

    customer = Customer.query.filter_by(user_id=session['user']['user_id']).first()

    # Get today's date
    today = date.today()
    #Gets the current available quantity of dishes
    menu_item = Menu.query.filter_by(dish_id=dish_id, date=today).first()
    if not menu_item:
        return jsonify({"message": "This dish is not available today"}), 400

    available_quantity = menu_item.quantity

    # 获取购物车中已选择的该菜品数量
    cart_item = ShoppingCartItem.query.filter_by(customer_id=customer.customer_id, dish_id=dish_id).first()
    current_cart_quantity = cart_item.quantity if cart_item else 0

    if quantity + current_cart_quantity > available_quantity:
        return jsonify({"message": f"The number of selections exceeds the number available. Surplus available quantity：{available_quantity - current_cart_quantity}"}), 400

    if cart_item:
        cart_item.quantity += quantity  # 更新数量
    else:
        # 添加新购物车项
        cart_item = ShoppingCartItem(customer_id=customer.customer_id, dish_id=dish_id, quantity=quantity)
        db.session.add(cart_item)

    db.session.commit()
    return jsonify({"message": "Added to cart"}), 200


# 查看购物车
@app.route('/view_cart')
def view_cart():
    if 'user' not in session or session['user']['role'] != 'Customer':
        return redirect(url_for('login_page'))

    customer = Customer.query.filter_by(user_id=session['user']['user_id']).first()
    cart_items = ShoppingCartItem.query.filter_by(customer_id=customer.customer_id).all()

    total_price = sum(float(item.dish.price) * item.quantity for item in cart_items)

    return render_template('view_cart.html', cart_items=cart_items, total_price=total_price)

# 更新购物车项数量
@app.route('/update_cart_item', methods=['POST'])
def update_cart_item():
    if 'user' not in session or session['user']['role'] != 'Customer':
        return jsonify({"message": "Is not logged in or has no permissions"}), 403

    data = request.get_json()
    cart_item_id = data.get('cart_item_id')
    new_quantity = data.get('quantity')

    if not cart_item_id or new_quantity is None:
        return jsonify({"message": "Missing necessary parameters"}), 400

    cart_item = ShoppingCartItem.query.get(cart_item_id)
    if not cart_item:
        return jsonify({"message": "Shopping cart item does not exist"}), 404

    # 验证购物车项属于当前用户
    customer = Customer.query.filter_by(user_id=session['user']['user_id']).first()
    if cart_item.customer_id != customer.customer_id:
        return jsonify({"message": "Do not have permission to modify this shopping cart item"}), 403

    if new_quantity <= 0:
        db.session.delete(cart_item)
    else:
        # 获取今天的日期
        today = date.today()
        # 获取当前菜品的可用数量
        menu_item = Menu.query.filter_by(dish_id=cart_item.dish_id, date=today).first()
        if not menu_item:
            return jsonify({"message": "This dish is not available today"}), 400

        available_quantity = menu_item.quantity

        # 获取购物车中已选择的该菜品的其他数量
        other_cart_items = ShoppingCartItem.query.filter_by(customer_id=customer.customer_id, dish_id=cart_item.dish_id).all()
        other_cart_quantity = sum(item.quantity for item in other_cart_items if item.cart_item_id != cart_item_id)

        if new_quantity + other_cart_quantity > available_quantity:
            return jsonify({"message": f"The number of selections exceeds the number available. Surplus available quantity：{available_quantity - other_cart_quantity}"}), 400

        cart_item.quantity = new_quantity

    db.session.commit()
    return jsonify({"message": "Shopping cart updated"}), 200


# 从购物车中移除菜品
@app.route('/remove_from_cart', methods=['POST'])
def remove_from_cart():
    if 'user' not in session or session['user']['role'] != 'Customer':
        return jsonify({"message": "Is not logged in or has no permissions"}), 403

    data = request.get_json()
    cart_item_id = data.get('cart_item_id')

    if not cart_item_id:
        return jsonify({"message": "Missing shopping cart item ID"}), 400

    cart_item = ShoppingCartItem.query.get(cart_item_id)
    if not cart_item:
        return jsonify({"message": "Shopping cart item does not exist"}), 404

    # 验证购物车项属于当前用户
    customer = Customer.query.filter_by(user_id=session['user']['user_id']).first()
    if cart_item.customer_id != customer.customer_id:
        return jsonify({"message": "Do not have permission to delete this shopping cart item"}), 403

    db.session.delete(cart_item)
    db.session.commit()

    return jsonify({"message": "Removed from shopping cart"}), 200

# 提交订单
@app.route('/submit_order', methods=['POST'])
def submit_order():
    if 'user' not in session or session['user']['role'] != 'Customer':
        return jsonify({"message": "Is not logged in or has no permissions", "success": False}), 403

    customer = Customer.query.filter_by(user_id=session['user']['user_id']).first()
    cart_items = ShoppingCartItem.query.filter_by(customer_id=customer.customer_id).all()

    if not cart_items:
        return jsonify({"message": "Shopping cart is empty", "success": False}), 400

    try:
        total_price = 0
        today = date.today()  # 确保在循环外获取today
        for cart_item in cart_items:
            menu_item = Menu.query.filter_by(dish_id=cart_item.dish_id, date=today).first()
            if not menu_item:
                raise Exception(f"dish {cart_item.dish.dish_name} not available today")

            available_quantity = menu_item.quantity
            current_cart_quantity = cart_item.quantity

            if current_cart_quantity > available_quantity:
                raise Exception(f"dish {cart_item.dish.dish_name} The available quantity is insufficient. Available quantity：{available_quantity}")

            total_price += float(cart_item.dish.price) * cart_item.quantity

        # 创建新订单
        new_order = Order(
            customer_id=customer.customer_id,
            date=datetime.utcnow(),
            total_price=total_price
        )
        db.session.add(new_order)
        db.session.flush()  # 获取新订单的ID

        # 创建订单项并更新菜单的可用数量
        for cart_item in cart_items:
            menu_item = Menu.query.filter_by(dish_id=cart_item.dish_id, date=today).first()
            menu_item.quantity -= cart_item.quantity
            if menu_item.quantity < 0:
                raise Exception(f"dish {cart_item.dish.dish_name} The available quantity is insufficient. ")

            # 从菜单项中获取 cook_id
            cook_id = menu_item.cook_id

            order_item = OrderItem(
                order_id=new_order.order_id,
                dish_id=cart_item.dish_id,
                quantity=cart_item.quantity,
                cook_id=cook_id  # 设置厨师ID
            )
            db.session.add(order_item)

        # 清空购物车
        for item in cart_items:
            db.session.delete(item)

        db.session.commit()
        return jsonify({"message": "Order submitted", "success": True})
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Order submission failure: {str(e)}", "success": False}), 500



@app.route('/customer_profile')
def customer_profile():
    if 'user' not in session or session['user']['role'] != 'Customer':
        return redirect(url_for('login_page'))

    # 获取当前登录的用户数据
    user_data = User.query.filter_by(user_id=session['user']['user_id']).first()
    if not user_data:
        return redirect(url_for('login_page'))

    # 获取客户的订单历史
    customer = Customer.query.filter_by(user_id=session['user']['user_id']).first()
    orders = Order.query.filter_by(customer_id=customer.customer_id).order_by(Order.date.desc()).all()

    # 准备订单数据
    orders_data = []
    for order in orders:
        order_items = OrderItem.query.filter_by(order_id=order.order_id).all()
        items = []
        for item in order_items:
            dish = Dish.query.get(item.dish_id)
            review = DishReview.query.filter_by(order_item_id=item.order_item_id).first()
            items.append({
                'order_item_id': item.order_item_id,
                'dish_name': dish.dish_name,
                'quantity': item.quantity,
                'reviewed': True if review else False,
                'review_text': review.comment_text if review else None
            })
        orders_data.append({
            'order_id': order.order_id,
            'date': order.date,
            'order_items': items,
            'total_price': order.total_price
        })

    return render_template('customer_profile.html', user=user_data, orders=orders_data)

@app.route('/add_review/<int:order_item_id>', methods=['GET', 'POST'])
def add_review(order_item_id):
    if 'user' not in session or session['user']['role'] != 'Customer':
        return redirect(url_for('login_page'))

    order_item = OrderItem.query.get(order_item_id)
    if not order_item:
        return "Order item not found", 404

    # 验证订单是否属于当前顾客
    customer = Customer.query.filter_by(user_id=session['user']['user_id']).first()
    if order_item.order.customer_id != customer.customer_id:
        return "You do not have permission to review this item", 403

    if request.method == 'POST':
        comment_text = request.form.get('comment_text', '').strip()
        if not comment_text:
            return "Comment cannot be empty", 400

        existing_review = DishReview.query.filter_by(order_item_id=order_item_id).first()
        if existing_review:
            existing_review.comment_text = comment_text
        else:
            review = DishReview(
                order_item_id=order_item_id,
                customer_id=customer.customer_id,
                cook_id=order_item.cook_id,
                dish_id=order_item.dish_id,
                comment_text=comment_text
            )
            db.session.add(review)
        db.session.commit()
        return redirect(url_for('customer_profile'))

    existing_review = DishReview.query.filter_by(order_item_id=order_item_id).first()
    return render_template('add_review.html', order_item=order_item, existing_review=existing_review)


@app.route('/customer_messages')
def customer_messages():
    if 'user' not in session or session['user']['role'] != 'Customer':
        return redirect(url_for('login_page'))

    # 获取当前登录的用户数据
    user_data = User.query.filter_by(user_id=session['user']['user_id']).first()
    if not user_data:
        return redirect(url_for('login_page'))  # 如果用户未找到，重定向到登录页面

    # 从 session 中获取 user_id
    user_id = session['user_id']

    # 从数据库中查找对应的 customer_id
    user = User.query.get(user_id)
    if not user or not user.customer:
        return "Customer not found or user is not a customer", 400

    # 获取 customer_id
    customer_id = user.customer.customer_id
    print(f"Customer ID for messages: {customer_id}")  # 调试信息

    # 将 customer_id 传递到模板
    return render_template('customer_message.html', customer_id=customer_id)

# 获取用户的消息列表
@app.route('/messages/<int:customer_id>', methods=['GET'])
def get_messages(customer_id):
    try:
        # 正确处理 coalesce 和 case，调整 whens 参数为位置参数
        subquery = db.session.query(
            db.case(
                (Message.sender_id == customer_id, Message.receiver_id),
                else_=Message.sender_id
            ).label('friend_id'),
            db.func.max(Message.created_at).label('latest_time')
        ).filter(
            (Message.sender_id == customer_id) | (Message.receiver_id == customer_id)
        ).group_by(
            db.case(
                (Message.sender_id == customer_id, Message.receiver_id),
                else_=Message.sender_id
            )
        ).subquery()

        # 获取最新一条消息的数据
        messages = db.session.query(Message).join(
            subquery,
            (Message.created_at == subquery.c.latest_time) &
            (
                (Message.sender_id == customer_id) |
                (Message.receiver_id == customer_id)
            )
        ).order_by(Message.created_at.desc()).all()

        if not messages:
            return jsonify({'messages': [], 'empty': True})

        # 构造响应
        response = {
            'messages': [
                {
                    'friend_id': msg.receiver_id if msg.sender_id == customer_id else msg.sender_id,
                    'friend_avatar': (
                        msg.receiver.user.avatar_url if msg.sender_id == customer_id else msg.sender.user.avatar_url
                    ) or '/static/images/default_avatar.png',
                    'friend_username': (
                        msg.receiver.user.username if msg.sender_id == customer_id else msg.sender.user.username
                    ),
                    'content': msg.content[:50] + ('...' if len(msg.content) > 50 else ''),
                    'created_at': msg.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                }
                for msg in messages
            ],
            'empty': False
        }
        return jsonify(response)

    except Exception as e:
        # 捕获异常并输出到服务器日志
        print(f"Error in /messages/<customer_id>: {e}")
        return jsonify({'error': 'Internal Server Error', 'message': str(e)}), 500

@app.route('/message_details/<int:friend_id>', methods=['GET'])
def message_details(friend_id):
    if 'user' not in session or session['user']['role'] != 'Customer':
        return redirect(url_for('login_page'))

    # 从 session 中获取 user_id
    user_id = session['user_id']

    # 从数据库中查找对应的 customer_id
    user = User.query.get(user_id)
    if not user or not user.customer:
        return "Customer not found or user is not a customer", 400

    # 获取 customer_id
    customer_id = user.customer.customer_id

    # Debugging output
    print(f"Customer ID (logged in): {customer_id}, Friend ID: {friend_id}")

    messages = Message.query.filter(
        ((Message.sender_id == customer_id) & (Message.receiver_id == friend_id)) |
        ((Message.sender_id == friend_id) & (Message.receiver_id == customer_id))
    ).order_by(Message.created_at.asc()).all()

    if not messages:
        print(f"No messages found for Customer ID {customer_id} and Friend ID {friend_id}")
        return jsonify({'messages': [], 'empty': True})

    response = {
        'friend_username': messages[0].sender.user.username if messages[0].sender_id == friend_id else messages[0].receiver.user.username,
        'friend_avatar': messages[0].sender.user.avatar_url if messages[0].sender_id == friend_id else messages[0].receiver.user.avatar_url,
        'messages': [
            {
                'sender_avatar': msg.sender.user.avatar_url,
                'sender_username': msg.sender.user.username,
                'content': msg.content,
                'created_at': msg.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            }
            for msg in messages
        ],
        'empty': False
    }
    print(f"Response Data: {response}")  # Debugging
    return jsonify(response)

@app.route('/send_message', methods=['POST'])
def send_message():
    data = request.json
    sender_id = data.get('sender_id')
    receiver_id = data.get('receiver_id')
    content = data.get('content')

    if not sender_id or not receiver_id or not content:
        return jsonify({'success': False, 'message': 'Invalid data'}), 400

    # 创建消息记录
    message = Message(
        sender_id=sender_id,
        receiver_id=receiver_id,
        content=content
    )
    db.session.add(message)
    db.session.commit()

    sender = User.query.get(sender_id)
    if not sender:
        return jsonify({'success': False, 'message': 'Sender not found'}), 404

    # 返回新消息信息
    return jsonify({
        'success': True,
        'message': 'Message sent successfully!',
        'content': message.content,
        'created_at': message.created_at.strftime('%Y-%m-%d %H:%M:%S'),
        'sender_avatar': sender.avatar_url or '/static/images/default_avatar.png',
        'sender_username': sender.username  # 返回发送者的用户名
    })

@app.route('/get_customer_avatar/<int:customer_id>', methods=['GET'])
def get_customer_avatar(customer_id):
    customer = User.query.get(customer_id)
    avatar_url = customer.avatar_url if customer and customer.avatar_url else '/static/images/default_avatar.png'
    return jsonify({'avatar': avatar_url})

# 搜索顾客
@app.route('/search_customer', methods=['POST'])
def search_customer():
    data = request.json
    username = data.get('username')
    customer = Customer.query.join(User).filter(User.username == username).first()
    if customer:
        avatar = customer.user.avatar_url or '/static/images/default_avatar.png'  # 提供默认头像路径
        return jsonify({
            'found': True,
            'username': customer.user.username,
            'avatar': avatar,
            'customer_id': customer.customer_id
        })
    return jsonify({'found': False, 'message': 'The customer could not be found.'})

# 添加好友
@app.route('/add_friend', methods=['POST'])
def add_friend():
    data = request.json
    customer_id = data.get('customer_id')
    friend_id = data.get('friend_id')
    # 检查是否已发送好友请求
    existing_request = Friendship.query.filter_by(customer_id=customer_id, friend_id=friend_id, status='Pending').first()
    if existing_request:
        return jsonify({'message': 'Friend request already sent'}), 400

    # 创建好友请求
    friendship = Friendship(customer_id=customer_id, friend_id=friend_id, status='Pending')
    db.session.add(friendship)
    db.session.commit()
    return jsonify({'message': 'Friend request sent successfully!'})

# 获取新朋友请求列表
@app.route('/new_friends/<int:customer_id>', methods=['GET'])
def new_friends(customer_id):
    requests = Friendship.query.filter_by(friend_id=customer_id).all()
    return jsonify({
        'requests': [
            {
                'friendship_id': req.friendship_id,
                'username': req.customer.user.username,
                'avatar': req.customer.user.avatar_url or '/static/images/default_avatar.png',
                'status': req.status  # 添加好友状态
            } for req in requests
        ]
    })

# 接受好友请求
@app.route('/accept_friend/<int:friendship_id>', methods=['POST'])
def accept_friend(friendship_id):
    friendship = Friendship.query.get(friendship_id)
    if not friendship:
        return jsonify({'message': 'Friend request not found'}), 404

    if friendship.status == 'Accepted':
        return jsonify({'message': 'Friend request already accepted', 'status': 'Accepted'})

    # Update friendship status
    friendship.status = 'Accepted'
    db.session.commit()

    # Send message to the requester (customer_id)
    sender_id = friendship.friend_id  # Current user accepting the request
    receiver_id = friendship.customer_id
    content = "I have accepted your friend request."

    # Create a new message from the accepting user
    message = Message(
        sender_id=sender_id,
        receiver_id=receiver_id,
        content=content
    )
    db.session.add(message)
    db.session.commit()

    return jsonify({'message': 'Friend request accepted successfully!', 'status': 'Accepted'})


# 获取用户的好友列表
@app.route('/friends/<int:customer_id>', methods=['GET'])
def get_friends(customer_id):
    friendships = Friendship.query.filter(
        ((Friendship.customer_id == customer_id) | (Friendship.friend_id == customer_id)) &
        (Friendship.status == 'Accepted')
    ).all()
    friends = []
    for friendship in friendships:
        if friendship.customer_id == customer_id:
            friend = friendship.friend
        else:
            friend = friendship.customer
        friends.append({
            'username': friend.user.username,
            'avatar': friend.user.avatar_url,
            'customer_id': friend.customer_id
        })
    return jsonify({'friends': friends})

@app.route('/cook_dashboard', methods=['GET', 'POST'])
def cook_dashboard():
    if 'user' not in session or session['user']['role'] != 'Cook':
        return redirect(url_for('login_page'))

    cook = Cook.query.filter_by(user_id=session['user']['user_id']).first()
    if not cook:
        return "Cook profile not found", 404

    if request.method == 'POST':
        # Get the selected dish ID and quantity
        dish_ids = request.form.getlist('dish_ids[]')
        quantities = request.form.getlist('quantities[]')

        if not dish_ids or not quantities or len(dish_ids) != len(quantities):
            return jsonify({'message': 'Invalid data submitted'}), 400

        today = date.today()

        # Delete the chef's previous menu for the day
        Menu.query.filter_by(cook_id=cook.cook_id, date=today).delete()

        # Add new menu items
        for dish_id, quantity in zip(dish_ids, quantities):
            try:
                quantity = int(quantity)
                if quantity <= 0:
                    continue

                existing_item = Menu.query.filter_by(dish_id=int(dish_id), date=today).first()
                if existing_item and existing_item.cook_id != cook.cook_id:

                    return jsonify({'message': f'Dish with ID {dish_id} is already taken by another cook for today.'}), 400


                menu_item = Menu(
                    cook_id=cook.cook_id,
                    dish_id=int(dish_id),
                    date=today,
                    quantity=quantity
                )
                db.session.add(menu_item)
            except ValueError:
                continue
        db.session.commit()
        return jsonify({'message': 'Menu submitted successfully'}), 200

    dishes = Dish.query.filter_by(category=cook.category).all()
    return render_template('cook_dashboard.html', dishes=dishes)


@app.route('/cook_menu', methods=['GET'])
def cook_menu():
    if 'user' not in session or session['user']['role'] != 'Cook':
        return redirect(url_for('login_page'))

    cook = Cook.query.filter_by(user_id=session['user']['user_id']).first()
    if not cook:
        return "Cook profile not found", 404

    today = date.today()

    menus = Menu.query.filter_by(
        cook_id=cook.cook_id,
        date=today
    ).all()


    print("Menus retrieved:", menus)
    print("Menus retrieved:")
    for menu_item in menus:
        print(f"Menu ID: {menu_item.menu_id}, Date: {menu_item.date}, Cook ID: {menu_item.cook_id}")


    dishes_with_quantities = [{
        'dish_id': menu_item.dish.dish_id,
        'name': menu_item.dish.dish_name,
        'image_url': menu_item.dish.image_url,
        'category': menu_item.dish.category,
        'price': menu_item.dish.price,
        'description': menu_item.dish.description,
        'quantity': menu_item.quantity
    } for menu_item in menus]

    return render_template('cook_menu.html', dishes=dishes_with_quantities)




@app.route('/cook_comments')
def cook_comments():
    if 'user' not in session or session['user']['role'] != 'Cook':
        return redirect(url_for('login_page'))

    cook = Cook.query.filter_by(user_id=session['user']['user_id']).first()
    if not cook:
        return "Cook profile not found", 404

    reviews = DishReview.query.filter_by(cook_id=cook.cook_id).order_by(DishReview.created_at.desc()).all()

    reviews_data = []
    for r in reviews:
        dish_img = r.dish.image_url if r.dish and r.dish.image_url else '/static/images/default_dish.png'
        replies = [{'reply_text': reply.reply_text, 'created_at': reply.created_at} for reply in r.replies]
        reviews_data.append({
            'review_id': r.review_id,
            'dish_name': r.dish.dish_name,
            'customer_username': r.customer.user.username,
            'comment_text': r.comment_text,
            'created_at': r.created_at,
            'dish_image_url': dish_img,
            'replies': replies
        })

    return render_template('cook_comments.html', reviews=reviews_data)

@app.route('/add_reply', methods=['POST'])
def add_reply():
    if 'user' not in session or session['user']['role'] != 'Cook':
        return jsonify({'status': 'error', 'message': 'Unauthorized'}), 403

    cook = Cook.query.filter_by(user_id=session['user']['user_id']).first()
    if not cook:
        return jsonify({'status': 'error', 'message': 'Cook not found'}), 404

    data = request.get_json()
    review_id = data.get('review_id')
    reply_text = data.get('reply_text')

    if not review_id or not reply_text:
        return jsonify({'status': 'error', 'message': 'Invalid input'}), 400

    review = DishReview.query.get(review_id)
    if not review:
        return jsonify({'status': 'error', 'message': 'Review not found'}), 404

    reply = ChefReply(review_id=review_id, cook_id=cook.cook_id, reply_text=reply_text)
    db.session.add(reply)
    db.session.commit()

    return jsonify({
        'status': 'success',
        'message': 'Reply added successfully',
        'reply': {
            'reply_text': reply_text,
            'created_at': reply.created_at.strftime('%Y-%m-%d %H:%M:%S')
        }
    })



@app.route('/cook_profile')
def cook_profile():
    if 'user' not in session or session['user']['role'] != 'Cook':
        return redirect(url_for('login_page'))

    user_id = session['user']['user_id']
    cook = Cook.query.filter_by(user_id=user_id).first()
    if not cook:
        return jsonify({"message": "Cook profile not found"}), 404

    return render_template('cook_profile.html', cook=cook, user=cook.user)

from werkzeug.security import generate_password_hash  # 确保已经导入


def update_user_field(user_id, field, value):
    allowed_fields = ['username', 'email', 'telephone', 'password', 'introduction']
    if field not in allowed_fields:
        return {"message": "Invalid field"}, 400

    # 获取用户
    user = User.query.filter_by(user_id=user_id).first()
    if not user:
        return {"message": "User not found"}, 404

    # 打印调试信息
    print(f"Updating user {user_id}, field: {field}, value: {value}")

    try:
        # 更新字段
        if field == 'password':
            if len(value) < 8 or not re.search(r'[0-9]', value) or not re.search(r'[A-Za-z]', value):
                return {"message": "Password must be at least 8 characters long and include both letters and numbers"}, 400
            # Do password hashing
            user.password = generate_password_hash(value, method='pbkdf2:sha256')
        else:
            setattr(user, field, value)

        # Commit transaction
        db.session.commit()
        print("Database updated successfully.")
        return {"message": f"{field.capitalize()} updated successfully"}, 200
    except Exception as e:
        db.session.rollback()
        print(f"Error updating database: {e}")
        return {"message": f"Database update failed: {e}"}, 500

@app.route('/change_password', methods=['POST'])# No use for the moment, this is to confirm the password
def change_password():
    if 'user' not in session:
        return jsonify({"message": "User not logged in"}), 403

    data = request.get_json()
    current_password = data.get('current_password')
    new_password = data.get('new_password')

    if not current_password or not new_password:
        return jsonify({"message": "Missing current or new password"}), 400

    user_id = session['user']['user_id']
    user = User.query.filter_by(user_id=user_id).first()

    if not user or not check_password_hash(user.password, current_password):
        return jsonify({"message": "Current password is incorrect"}), 400

    if len(new_password) < 8 or not re.search(r'[0-9]', new_password) or not re.search(r'[A-Za-z]', new_password):
        return jsonify({"message": "New password must be at least 8 characters long and include both letters and numbers"}), 400

    try:
        user.password = generate_password_hash(new_password, method='pbkdf2:sha256')
        db.session.commit()
        return jsonify({"message": "Password updated successfully", "success": True}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Failed to update password: {str(e)}"}), 500


@app.route('/update_profile_field', methods=['POST'])
def update_profile_field():
    if 'user' not in session:
        return jsonify({"message": "User not logged in"}), 403

    data = request.get_json()
    field = data.get('field')
    value = data.get('value')

    # 获取当前用户信息
    user_id = session['user']['user_id']
    role = session['user']['role']  # 获取角色信息

    # 检查权限
    if role not in ['Customer', 'Cook', 'Administrator']:
        return jsonify({"message": "Permission denied"}), 403

    # 调用通用函数处理更新
    response, status_code = update_user_field(user_id, field, value)
    return jsonify(response), status_code

@app.route('/admin_update_field', methods=['POST'])
def admin_update_field():
    if 'user' not in session or session['user']['role'] != 'Administrator':
        return jsonify({"message": "Permission denied"}), 403

    data = request.get_json()
    user_id = data.get('user_id')  # 被操作用户的 ID
    field = data.get('field')
    value = data.get('value')

    # 调用通用的字段更新函数
    response, status_code = update_user_field(user_id, field, value)
    return jsonify(response), status_code

@app.route('/update_avatar', methods=['POST'])
def update_avatar():
    if 'user' not in session:
        return jsonify({"message": "User not logged in"}), 403

    user_id = session['user']['user_id']
    user = User.query.filter_by(user_id=user_id).first()

    if not user:
        return jsonify({"message": "User not found"}), 404

    if 'avatar' not in request.files:
        return jsonify({"message": "No avatar file uploaded"}), 400

    avatar_file = request.files['avatar']
    if avatar_file.filename == '':
        return jsonify({"message": "No selected file"}), 400

    if avatar_file and allowed_file(avatar_file.filename):
        try:
            # 保存头像文件到静态目录中
            filename = secure_filename(f'{user_id}_{avatar_file.filename}')
            avatar_path = os.path.join(app.config['UPLOAD_FOLDER_AVATARS'], filename)

            # 确保目录存在
            os.makedirs(app.config['UPLOAD_FOLDER_AVATARS'], exist_ok=True)
            avatar_file.save(avatar_path)

            # 更新数据库中的头像 URL
            user.avatar_url = f'/static/uploads/avatars/{filename}'  # 保存相对路径
            db.session.commit()

            return jsonify({"success": True, "message": "Avatar updated successfully", "new_avatar_url": user.avatar_url})
        except Exception as e:
            db.session.rollback()
            return jsonify({"success": False, "message": f"Failed to update avatar: {str(e)}"}), 500

    return jsonify({"message": "Invalid file type"}), 400

@app.route('/admin_update_avatar/<int:user_id>', methods=['POST'])
def admin_update_avatar(user_id):
    # 验证是否为管理员权限
    if 'user' not in session or session['user']['role'] != 'Administrator':
        return jsonify({"message": "Permission denied"}), 403

    # 查找目标用户
    user = User.query.filter_by(user_id=user_id).first()
    if not user:
        return jsonify({"message": "User not found"}), 404

    # 检查是否有上传文件
    if 'avatar' not in request.files:
        return jsonify({"message": "No avatar file uploaded"}), 400

    avatar_file = request.files['avatar']
    if avatar_file.filename == '':
        return jsonify({"message": "No selected file"}), 400

    try:
        # 保存头像文件到静态目录中
        filename = secure_filename(f'{user_id}_{avatar_file.filename}')
        avatar_path = os.path.join(app.config['UPLOAD_FOLDER_AVATARS'], filename)

        # 确保目录存在
        os.makedirs(app.config['UPLOAD_FOLDER_AVATARS'], exist_ok=True)
        avatar_file.save(avatar_path)

        # 更新数据库中的头像 URL
        user.avatar_url = f'/static/uploads/avatars/{filename}'  # 保存相对路径
        db.session.commit()

        return jsonify({"success": True, "message": "Avatar updated successfully", "new_avatar_url": user.avatar_url})
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": f"Failed to update avatar: {str(e)}"}), 500


@app.route('/add_dish', methods=['POST'])
def add_dish():
    if 'user' not in session or session['user']['role'] != 'Administrator':
        return jsonify({"message": "Permission denied"}), 403

    if 'image' not in request.files:
        return jsonify({"message": "No image file uploaded"}), 400

    file = request.files['image']

    if file.filename == '':
        return jsonify({"message": "No selected file"}), 400

    if file and allowed_file(file.filename):
        try:
            # Save the file with a unique name
            filename = secure_filename(file.filename)
            # Generate a unique filename by appending a UUID
            unique_filename = str(uuid.uuid4()) + "_" + filename
            dish_image_path = os.path.join(app.config['UPLOAD_FOLDER_DISHES'], unique_filename)

            # Ensure the upload directory exists
            os.makedirs(app.config['UPLOAD_FOLDER_DISHES'], exist_ok=True)
            file.save(dish_image_path)

            # Create the dish
            data = request.form
            new_dish = Dish(
                dish_name=data['dish_name'],
                image_url=f'/static/uploads/dishes/{unique_filename}',  # Store the unique filename
                category=data['category'],
                price=data['price'],
                description=data['description']
            )

            db.session.add(new_dish)
            db.session.commit()
            return jsonify({'message': 'Added a new dish successfully'}), 201
        except Exception as e:
            db.session.rollback()
            return jsonify({"message": "Error adding dish: " + str(e)}), 500

    return jsonify({"message": "Invalid file type. Only images are allowed."}), 400

@app.route('/update_dish/<int:dish_id>', methods=['PUT'])
def update_dish(dish_id):
    dish = Dish.query.get(dish_id)
    if not dish:
        return jsonify({"message": "Dish not found"}), 404

    dish_name = request.json.get('dish_name', dish.dish_name)
    category = request.json.get('category', dish.category)
    price = request.json.get('price', dish.price)
    description = request.json.get('description', dish.description)

    # Check if a new image is uploaded
    if 'image' in request.files:
        file = request.files['image']
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            # Generate a unique filename for the new image
            unique_filename = str(uuid.uuid4()) + "_" + filename
            dish_image_path = os.path.join(app.config['UPLOAD_FOLDER_DISHES'], unique_filename)
            os.makedirs(app.config['UPLOAD_FOLDER_DISHES'], exist_ok=True)
            file.save(dish_image_path)
            dish.image_url = f'/static/uploads/dishes/{unique_filename}'  # Update image URL

    # Update other dish details
    dish.dish_name = dish_name
    dish.category = category
    dish.price = price
    dish.description = description

    try:
        db.session.commit()
        return jsonify({"message": "Dish updated successfully"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": "Error updating dish: " + str(e)}), 500

@app.route('/menu', methods=['GET'])
def get_menu():
    dishes = Dish.query.all()
    return jsonify([{
        'id': dish.dish_id,
        'name': dish.dish_name,
        'image_url': dish.image_url,
        'category': dish.category,
        'price': dish.price,
        'description': dish.description
    } for dish in dishes])


@app.route('/delete_dish/<int:dish_id>', methods=['DELETE'])
def delete_dish(dish_id):
    # Find the dish in the database by ID
    dish = Dish.query.get(dish_id)
    if dish is None:
        return jsonify({'message': 'Dish not found'}), 404

    db.session.delete(dish)
    db.session.commit()
    return jsonify({'message': 'Dish deleted successfully'}), 200


@app.route('/submit_dish', methods=['POST'])
def submit_dish():
    if 'user' not in session or session['user']['role'] != 'Cook':
        return jsonify({"message": "Unauthorized"}), 403

    data = request.get_json()
    dish_id = data.get('dishId')
    quantity = data.get('quantity')


    return jsonify({"message": "Dish submitted successfully"})

@app.route('/admin_assign_category', methods=['POST'])
def admin_assign_category():
    if 'user' not in session or session['user']['role'] != 'Administrator':
        return jsonify({"message": "Permission denied"}), 403

    data = request.get_json()
    user_id = data.get('user_id')
    category = data.get('category')

    if not user_id or not category:
        return jsonify({"message": "Missing user_id or category"}), 400

    cook = Cook.query.filter_by(user_id=user_id).first()

    if not cook:
        return jsonify({"message": "User is not a cook"}), 404

    try:
        cook.category = category
        db.session.commit()
        return jsonify({"message": "Category assigned successfully"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Failed to assign category: {str(e)}"}), 500


@app.route('/unlog_menu', methods=['GET'])
def unlog_menu():
    # 获取今天的日期
    today = date.today()
    # 查询今日所有可用的菜单项
    menus = Menu.query.filter_by(date=today).all()

    # 从菜单项中提取菜品信息，并统计每个菜品的总数量
    dish_quantities = {}
    for menu_item in menus:
        dish_id = menu_item.dish_id
        cook_id = menu_item.cook_id  # 记录厨师 ID
        if (dish_id, cook_id) in dish_quantities:
            dish_quantities[(dish_id, cook_id)]['quantity'] += menu_item.quantity
        else:
            dish = Dish.query.get(dish_id)
            cook = Cook.query.get(cook_id)
            dish_quantities[(dish_id, cook_id)] = {
                'menu_id': menu_item.menu_id,
                'dish_id': dish.dish_id,
                'name': dish.dish_name,
                'image_url': dish.image_url,
                'category': dish.category,
                'price': dish.price,
                'description': dish.description,
                'quantity': menu_item.quantity,
                'cook_name': cook.user.username  # 获取厨师的用户名
            }

    # 将菜品列表传递给模板
    dishes = list(dish_quantities.values())

    return render_template('unlog_menu.html', dishes=dishes)



if __name__ == '__main__':
    with app.app_context():
        db.create_all()  # Create database tables if they don't already exist
    app.run(debug=True)
