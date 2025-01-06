#!/bin/bash

# 设置错误时退出
set -e

# 检查必要的环境变量
if [ -z "$GITHUB_TOKEN" ] || [ -z "$ZHIPUAI_API_KEY" ]; then
    echo "Error: Missing required environment variables"
    exit 1
fi

# 获取 issue 信息
ISSUE_NUMBER=$1
REPO_FULL_NAME=$GITHUB_REPOSITORY
API_URL="https://api.github.com/repos/${REPO_FULL_NAME}/issues/${ISSUE_NUMBER}"

echo "Processing issue #${ISSUE_NUMBER}"

# 获取 issue 内容
ISSUE_DATA=$(curl -s -H "Authorization: token ${GITHUB_TOKEN}" "${API_URL}")
VIDEO_URL=$(echo "${ISSUE_DATA}" | jq -r '.body' | grep -o 'http[s]\?://[^[:space:]]*')

if [ -z "$VIDEO_URL" ]; then
    echo "No video URL found in issue"
    exit 1
fi

# 下载视频
echo "Downloading video..."
VIDEO_PATH="temp_video.mp4"
curl -L -o "${VIDEO_PATH}" "${VIDEO_URL}"

# 提取音频
echo "Extracting audio..."
AUDIO_PATH="temp_audio.wav"
ffmpeg -i "${VIDEO_PATH}" -vn -acodec pcm_s16le -ar 16000 -ac 1 "${AUDIO_PATH}"

# 转录音频
echo "Transcribing audio..."
python3 -c "
import whisper
import json

model = whisper.load_model('base')
result = model.transcribe('${AUDIO_PATH}')

with open('transcription.json', 'w') as f:
    json.dump(result, f, ensure_ascii=False, indent=2)
"

# 格式化转录结果
TRANSCRIPTION=$(cat transcription.json | jq -r '.text')

# 更新 issue
echo "Updating issue..."
COMMENT="音频转录结果：\n\n\`\`\`\n${TRANSCRIPTION}\n\`\`\`"

curl -X POST \
  -H "Authorization: token ${GITHUB_TOKEN}" \
  -H "Accept: application/vnd.github.v3+json" \
  "${API_URL}/comments" \
  -d "{\"body\": \"${COMMENT}\"}"

# 清理临时文件
rm -f "${VIDEO_PATH}" "${AUDIO_PATH}" "transcription.json"

echo "Done!" 