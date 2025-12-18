#!/bin/bash
# Helper script to update Translator and Speech keys in .env file

echo "🔧 Azure Translator & Speech Keys Updater"
echo "=========================================="
echo ""

# Check if .env exists
if [ ! -f "../.env" ]; then
    echo "❌ Error: .env file not found in root directory"
    exit 1
fi

echo "Enter your Azure Translator Key:"
read -s TRANSLATOR_KEY
echo ""

echo "Enter your Azure Speech Key:"
read -s SPEECH_KEY
echo ""

# Update .env file
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s/AZURE_TRANSLATOR_KEY=.*/AZURE_TRANSLATOR_KEY=$TRANSLATOR_KEY/" ../.env
    sed -i '' "s/AZURE_SPEECH_KEY=.*/AZURE_SPEECH_KEY=$SPEECH_KEY/" ../.env
else
    # Linux
    sed -i "s/AZURE_TRANSLATOR_KEY=.*/AZURE_TRANSLATOR_KEY=$TRANSLATOR_KEY/" ../.env
    sed -i "s/AZURE_SPEECH_KEY=.*/AZURE_SPEECH_KEY=$SPEECH_KEY/" ../.env
fi

echo "✅ Keys updated in .env file!"
echo ""
echo "Verifying..."
python3 -c "
import os
from pathlib import Path
from dotenv import load_dotenv

env_path = Path('../.env')
load_dotenv(dotenv_path=env_path)

translator_key = os.getenv('AZURE_TRANSLATOR_KEY', '')
speech_key = os.getenv('AZURE_SPEECH_KEY', '')

if translator_key and translator_key != 'your_translator_key_here':
    print('✅ Translator key: Configured')
else:
    print('❌ Translator key: Not configured')

if speech_key and speech_key != 'your_speech_key_here':
    print('✅ Speech key: Configured')
else:
    print('❌ Speech key: Not configured')
"

