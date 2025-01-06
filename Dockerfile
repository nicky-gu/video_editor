FROM python:3.9-slim

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    ffmpeg \
    tree \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 分层复制以利用缓存
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 复制源代码
COPY . .

# 显示完整的目录结构
RUN echo "=== 显示完整目录结构 ===" && \
    tree /app && \
    echo "=== 显示 Python 路径 ===" && \
    python -c "import sys; print('\n'.join(sys.path))" && \
    echo "=== 显示 src 目录内容 ===" && \
    ls -la /app/src/

# 设置环境变量
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1

EXPOSE 8000

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]