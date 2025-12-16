"""
Constants used across ScholarShield agents.

Centralizing constants here ensures consistency and makes it easier to update
configuration values without searching through multiple files.
"""

# Risk calculation thresholds
# These values determine when a student's financial situation is considered critical
CRITICAL_RISK_AMOUNT_THRESHOLD = 500.0  # USD
CRITICAL_RISK_DAYS_THRESHOLD = 3  # Days until due date
WARNING_RISK_DAYS_THRESHOLD = 7  # Days until due date

# Risk level constants
RISK_LEVEL_SAFE = "SAFE"
RISK_LEVEL_WARNING = "WARNING"
RISK_LEVEL_CRITICAL = "CRITICAL"

# Date format used throughout the system
DATE_FORMAT = "%Y-%m-%d"

# Default values for bill analysis
DEFAULT_BILL_AMOUNT = 0.0
DEFAULT_DUE_DATE_DAYS_EXTENSION = 14  # Days to extend payment date in negotiation emails

# API versions and configuration
AZURE_OPENAI_API_VERSION = "2024-02-15-preview"
AZURE_TRANSLATOR_API_VERSION = "3.0"
AZURE_TRANSLATOR_DEFAULT_REGION = "eastus"
AZURE_SPEECH_DEFAULT_REGION = "eastus"

# Language codes supported for parent communication
SUPPORTED_LANGUAGES = ["es", "hi", "zh-Hans", "ar", "en"]

# Language to voice mapping for empathetic neural voices
# These voices were selected for their empathetic, reassuring tone
LANGUAGE_VOICE_MAP = {
    "es": "es-MX-DaliaNeural",  # Spanish - empathetic female voice
    "hi": "hi-IN-SwaraNeural",  # Hindi - empathetic female voice
    "zh-Hans": "zh-CN-XiaoxiaoNeural",  # Mandarin - empathetic female voice
    "ar": "ar-EG-SalmaNeural",  # Arabic - empathetic female voice
    "en": "en-US-AriaNeural",  # English fallback
}

# Assessment status constants
ASSESSMENT_STATUS_PROCESSING = "processing"
ASSESSMENT_STATUS_COMPLETED = "completed"
ASSESSMENT_STATUS_ERROR = "error"

