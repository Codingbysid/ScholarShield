"""
Parent Explainer Agent: Translates and speaks financial situations to parents in their native language

This module handles multilingual communication to help students explain their financial
situation to family members who may not speak English or understand technical financial terms.
"""
import os
import base64
import logging
from typing import Dict, Optional
from openai import AzureOpenAI
from agents.constants import (
    LANGUAGE_VOICE_MAP,
    SUPPORTED_LANGUAGES,
    AZURE_OPENAI_API_VERSION,
    AZURE_TRANSLATOR_API_VERSION,
    AZURE_TRANSLATOR_DEFAULT_REGION,
    AZURE_SPEECH_DEFAULT_REGION,
)

# Mock mode flag - allows testing without Azure credentials
MOCK_MODE = os.getenv("MOCK_MODE", "true").lower() == "true"

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are a bilingual financial aid assistant helping a student explain a bill to their parents. 
DO NOT use technical terms like 'Bursar', 'Arrears', or 'Deductible'. 
DO use simple, family-oriented language. 
Example Input: 'Risk Critical. $1200 due.' 
Example Output: 'Mom, Dad, we have a school bill due soon, but I found a plan to extend the deadline so we can handle it safely.'

Keep responses to maximum 2 sentences. Be calm, reassuring, and focus on the solution, not just the debt."""


async def explain_to_parent(risk_summary: str, target_language: str = "es") -> Dict[str, str]:
    """
    Explains the financial situation to parents in their native language.
    
    This function orchestrates a three-step process:
    1. Summarizes the risk_summary into a calm, reassuring script (max 2 sentences)
    2. Translates the script to target_language using Azure Translator
    3. Converts translated text to speech audio using Azure Speech Services
    
    The function uses mock mode when Azure credentials are not configured, allowing
    the system to be tested without actual API calls.
    
    Args:
        risk_summary: Summary of the financial situation/risk level (e.g., "Risk CRITICAL. $1200 due on 2024-12-16")
        target_language: Language code (e.g., 'es' for Spanish, 'hi' for Hindi). 
                         Must be one of the supported languages.
        
    Returns:
        Dictionary containing:
        - translated_text: The translated explanation text in the target language
        - audio_base64: Base64 encoded audio data (WAV format) ready for playback
    """
    if MOCK_MODE:
        logger.info("Using mock mode for parent explanation")
        return _mock_explain_to_parent(risk_summary, target_language)
    
    try:
        # Step 1: Summarize using Azure OpenAI
        summary_text = await _summarize_for_parent(risk_summary)
        
        # Step 2: Translate
        translated_text = await _translate_text(summary_text, target_language)
        
        # Step 3: Convert to speech
        audio_base64 = await _text_to_speech(translated_text, target_language)
        
        return {
            "translated_text": translated_text,
            "audio_base64": audio_base64
        }
        
    except Exception as e:
        logger.error(f"Error explaining to parent: {str(e)}")
        return _mock_explain_to_parent(risk_summary, target_language)


async def _summarize_for_parent(risk_summary: str) -> str:
    """Summarize the risk summary into a calm, reassuring script for parents."""
    endpoint = os.getenv("AZURE_OPENAI_ENDPOINT")
    key = os.getenv("AZURE_OPENAI_KEY")
    deployment = os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME", "gpt-4o")
    
    if not endpoint or not key:
        raise ValueError("Azure OpenAI credentials not configured")
    
    client = AzureOpenAI(
        api_key=key,
        api_version=AZURE_OPENAI_API_VERSION,
        azure_endpoint=endpoint
    )
    
    user_prompt = f"""Explain this financial situation to a parent in simple, reassuring language (max 2 sentences):
    
{risk_summary}

Focus on the solution and stay calm and reassuring."""
    
    response = client.chat.completions.create(
        model=deployment,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt}
        ],
        temperature=0.7,
        max_tokens=100
    )
    
    return response.choices[0].message.content.strip()


async def _translate_text(text: str, target_language: str) -> str:
    """Translate text to target language using Azure Translator."""
    try:
        import requests
        
        translator_endpoint = os.getenv(
            "AZURE_TRANSLATOR_ENDPOINT", 
            "https://api.cognitive.microsofttranslator.com"
        )
        translator_key = os.getenv("AZURE_TRANSLATOR_KEY")
        translator_region = os.getenv("AZURE_TRANSLATOR_REGION", AZURE_TRANSLATOR_DEFAULT_REGION)
        
        if not translator_key:
            # Fallback: if translator not configured, return original text
            logger.warning("Azure Translator not configured, returning original text")
            return text
        
        # Use Azure Translator REST API
        url = f"{translator_endpoint}/translate"
        headers = {
            "Ocp-Apim-Subscription-Key": translator_key,
            "Ocp-Apim-Subscription-Region": translator_region,
            "Content-Type": "application/json"
        }
        params = {
            "api-version": AZURE_TRANSLATOR_API_VERSION,
            "from": "en",
            "to": target_language
        }
        body = [{"text": text}]
        
        response = requests.post(url, headers=headers, params=params, json=body, timeout=10)
        response.raise_for_status()
        
        result = response.json()
        if result and len(result) > 0:
            translations = result[0].get("translations", [])
            if translations and len(translations) > 0:
                return translations[0].get("text", text)
        
        return text
        
    except Exception as e:
        logger.error(f"Translation error: {str(e)}")
        # Fallback: return original text
        return text


async def _text_to_speech(text: str, target_language: str) -> str:
    """Convert text to speech using Azure Cognitive Services Speech."""
    try:
        import azure.cognitiveservices.speech as speechsdk
        
        speech_key = os.getenv("AZURE_SPEECH_KEY")
        speech_region = os.getenv("AZURE_SPEECH_REGION", AZURE_SPEECH_DEFAULT_REGION)
        
        if not speech_key:
            raise ValueError("Azure Speech key not configured")
        
        # Get voice for language
        voice_name = LANGUAGE_VOICE_MAP.get(target_language, LANGUAGE_VOICE_MAP["en"])
        
        # Configure speech synthesizer
        speech_config = speechsdk.SpeechConfig(
            subscription=speech_key,
            region=speech_region
        )
        speech_config.speech_synthesis_voice_name = voice_name
        
        # Create synthesizer without audio output config (result.audio_data will contain audio bytes)
        synthesizer = speechsdk.SpeechSynthesizer(speech_config=speech_config, audio_config=None)
        
        # Synthesize to memory
        result = synthesizer.speak_text_async(text).get()
        
        if result.reason == speechsdk.ResultReason.SynthesizingAudioCompleted:
            # Get audio data from the result (contains audio bytes)
            audio_data = result.audio_data
            
            # Convert to base64
            audio_base64 = base64.b64encode(audio_data).decode('utf-8')
            return audio_base64
        else:
            cancellation_details = speechsdk.CancellationDetails(result)
            raise Exception(f"Speech synthesis failed: {cancellation_details.reason} - {cancellation_details.error_details}")
            
    except Exception as e:
        logger.error(f"Text-to-speech error: {str(e)}")
        # Fallback: return mock base64
        return _generate_mock_audio_base64()


def _mock_explain_to_parent(risk_summary: str, target_language: str) -> Dict:
    """Mock implementation for testing without Azure credentials."""
    # Generate a simple mock explanation
    if "Critical" in risk_summary or "CRITICAL" in risk_summary:
        explanations = {
            "es": "Mamá, Papá, tenemos una factura escolar que vence pronto, pero encontré un plan para extender la fecha límite para que podamos manejarla de manera segura.",
            "hi": "माँ, पापा, हमारे पास जल्द ही एक स्कूल बिल है, लेकिन मुझे समय सीमा बढ़ाने का एक तरीका मिला है ताकि हम इसे सुरक्षित रूप से संभाल सकें।",
            "zh-Hans": "妈妈，爸爸，我们有一张学校账单很快就要到期了，但我找到了一个延长截止日期的计划，这样我们就能安全地处理它。",
            "ar": "أمي، أبي، لدينا فاتورة مدرسية مستحقة قريبًا، لكنني وجدت خطة لتمديد الموعد النهائي حتى نتمكن من التعامل معها بأمان.",
        }
    else:
        explanations = {
            "es": "Tenemos una factura escolar, pero tenemos tiempo y opciones para manejarla.",
            "hi": "हमारे पास एक स्कूल बिल है, लेकिन हमारे पास समय और विकल्प हैं।",
            "zh-Hans": "我们有一张学校账单，但我们有时间来处理它。",
            "ar": "لدينا فاتورة مدرسية، لكن لدينا الوقت للتعامل معها.",
        }
    
    translated_text = explanations.get(target_language, explanations["es"])
    
    return {
        "translated_text": translated_text,
        "audio_base64": _generate_mock_audio_base64()
    }


def _generate_mock_audio_base64() -> str:
    """Generate a dummy base64 string for mock audio."""
    # Create a minimal WAV header + some dummy data
    # This is just a placeholder - real implementation would use Azure Speech
    dummy_audio = b"RIFF" + b"\x00" * 36  # Minimal WAV header
    return base64.b64encode(dummy_audio).decode('utf-8')

