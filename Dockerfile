FROM python:3.9-slim

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 分层复制以利用缓存
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 首先只复制 src 目录
COPY src/ /app/src/

# 确保 __init__.py 存在
RUN touch /app/src/__init__.py

# 设置 Python 路径
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1

# 测试模块导入
RUN python -c "from src.issue_processor import IssueProcessor"

# 复制其他必要文件
COPY . .

EXPOSE 8000

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]