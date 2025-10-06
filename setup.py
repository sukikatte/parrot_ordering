#!/usr/bin/env python3
"""
Parrot Ordering 项目安装脚本
自动检查依赖、创建目录、初始化数据库
"""

import os
import sys
import subprocess
import platform

def run_command(command, description):
    """运行命令并显示结果"""
    print(f"🔧 {description}...")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {description} 成功")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} 失败: {e}")
        if e.stdout:
            print(f"输出: {e.stdout}")
        if e.stderr:
            print(f"错误: {e.stderr}")
        return False

def check_python_version():
    """检查Python版本"""
    print("🐍 检查Python版本...")
    version = sys.version_info
    if version.major < 3 or (version.major == 3 and version.minor < 8):
        print(f"❌ Python版本过低: {version.major}.{version.minor}")
        print("请安装Python 3.8或更高版本")
        return False
    print(f"✅ Python版本: {version.major}.{version.minor}.{version.micro}")
    return True

def create_directories():
    """创建必要的目录"""
    print("📁 创建必要目录...")
    directories = [
        'instance',
        'static/uploads/avatars',
        'static/uploads/dishes'
    ]
    
    for directory in directories:
        if not os.path.exists(directory):
            os.makedirs(directory, exist_ok=True)
            print(f"✅ 创建目录: {directory}")
        else:
            print(f"✅ 目录已存在: {directory}")
    return True

def install_dependencies():
    """安装依赖包"""
    print("📦 安装依赖包...")
    if not os.path.exists('requirements.txt'):
        print("❌ requirements.txt 文件不存在")
        return False
    
    return run_command("pip install -r requirements.txt", "安装Python依赖包")

def init_database():
    """初始化数据库"""
    print("🗄️ 初始化数据库...")
    
    # 检查Flask-Migrate是否可用
    try:
        import flask_migrate
    except ImportError:
        print("❌ Flask-Migrate 未安装，跳过数据库迁移")
        return True
    
    # 初始化迁移（如果不存在）
    if not os.path.exists('migrations'):
        if run_command("flask db init", "初始化数据库迁移"):
            print("✅ 数据库迁移初始化完成")
    
    # 创建迁移
    if run_command("flask db migrate -m \"Initial migration\"", "创建数据库迁移"):
        print("✅ 数据库迁移创建完成")
    
    # 应用迁移
    if run_command("flask db upgrade", "应用数据库迁移"):
        print("✅ 数据库迁移应用完成")
    
    return True

def main():
    """主函数"""
    print("=" * 60)
    print("🦜 Parrot Ordering - 校园在线订餐系统安装程序")
    print("=" * 60)
    
    # 检查Python版本
    if not check_python_version():
        sys.exit(1)
    
    # 创建目录
    if not create_directories():
        sys.exit(1)
    
    # 安装依赖
    if not install_dependencies():
        print("❌ 依赖安装失败，请手动运行: pip install -r requirements.txt")
        sys.exit(1)
    
    # 初始化数据库
    if not init_database():
        print("⚠️ 数据库初始化失败，但项目仍可运行")
    
    print("=" * 60)
    print("🎉 安装完成！")
    print("=" * 60)
    print("🚀 启动项目:")
    print("   python run.py")
    print("   或")
    print("   python app.py")
    print("")
    print("📱 访问地址: http://localhost:5000")
    print("🔑 默认账户:")
    print("   管理员: admin / admin123")
    print("   厨师: cook1 / cook123")
    print("   顾客: customer1 / customer123")
    print("=" * 60)

if __name__ == '__main__':
    main()
