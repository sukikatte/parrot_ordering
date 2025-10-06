#!/usr/bin/env python3
"""
Parrot Ordering - 校园在线订餐系统启动脚本
"""

import os
import sys
from app import app

if __name__ == '__main__':
    # 检查数据库文件是否存在
    db_path = os.path.join('instance', 'users.db')
    if not os.path.exists(db_path):
        print("警告：数据库文件不存在，正在创建...")
        os.makedirs('instance', exist_ok=True)
    
    # 检查uploads目录是否存在
    uploads_dirs = ['static/uploads/avatars', 'static/uploads/dishes']
    for upload_dir in uploads_dirs:
        if not os.path.exists(upload_dir):
            print(f"创建上传目录: {upload_dir}")
            os.makedirs(upload_dir, exist_ok=True)
    
    print("=" * 50)
    print("🦜 Parrot Ordering - 校园在线订餐系统")
    print("=" * 50)
    print("🚀 正在启动服务器...")
    print("📱 访问地址: http://localhost:5000")
    print("🔑 默认管理员账户: admin / admin123")
    print("👨‍🍳 默认厨师账户: cook1 / cook123")
    print("👤 默认顾客账户: customer1 / customer123")
    print("=" * 50)
    print("按 Ctrl+C 停止服务器")
    print("=" * 50)
    
    try:
        # 启动Flask应用
        app.run(debug=True, host='0.0.0.0', port=5000)
    except KeyboardInterrupt:
        print("\n👋 服务器已停止，感谢使用！")
    except Exception as e:
        print(f"❌ 启动失败: {e}")
        print("请检查依赖是否安装正确：pip install -r requirements.txt")
        sys.exit(1)
