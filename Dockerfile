FROM python:3.9-slim

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 分层复制以利用缓存
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 首先复制 src 目录
COPY src/ /app/src/

# 确保 __init__.py 存在
RUN touch /app/src/__init__.py

# 设置 Python 路径
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1

# 复制其他必要文件
COPY . .

# 显示目录结构以便调试
RUN ls -la /app && \
    ls -la /app/src

EXPOSE 8000

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]