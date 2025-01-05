FROM python:3.9-slim

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 分层复制以利用缓存
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 复制源代码到 src 目录
COPY src/ /app/src/
# 确保 Python 能找到模块
ENV PYTHONPATH=/app

# 设置环境变量
ENV PYTHONUNBUFFERED=1

# 暴露端口
EXPOSE 8000

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]