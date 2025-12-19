"""
ScholarShield Orchestrator: The "Brain" that coordinates all agents

This module orchestrates the complete student financial case processing workflow,
coordinating multiple agents to provide a comprehensive assessment.
"""
import logging
from typing import Dict, Any, Optional
from datetime import datetime
from io import BytesIO
from agents.document_parser import analyze_tuition_bill
from agents.policy_rag import search_handbook, generate_advice
from agents.negotiator import draft_negotiation_email
from agents.constants import (
    CRITICAL_RISK_AMOUNT_THRESHOLD,
    CRITICAL_RISK_DAYS_THRESHOLD,
    WARNING_RISK_DAYS_THRESHOLD,
    RISK_LEVEL_SAFE,
    RISK_LEVEL_WARNING,
    RISK_LEVEL_CRITICAL,
    DATE_FORMAT,
    DEFAULT_BILL_AMOUNT,
    ASSESSMENT_STATUS_PROCESSING,
    ASSESSMENT_STATUS_COMPLETED,
    ASSESSMENT_STATUS_ERROR,
)

logger = logging.getLogger(__name__)


class ScholarShieldOrchestrator:
    """
    The main orchestrator that coordinates all agents to process a student's financial case.
    """
    
    def __init__(self) -> None:
        """
        Initialize the orchestrator.
        
        The orchestrator is stateless and can be reused across multiple requests.
        """
        pass
    
    def _calculate_risk_level(self, bill_data: Dict[str, Any]) -> str:
        """
        Calculate financial risk level based on bill amount and days until due.
        
        Risk levels are determined by:
        - CRITICAL: Amount exceeds threshold AND due within critical days threshold
        - WARNING: Amount exceeds threshold AND due within warning days threshold
        - SAFE: All other cases
        
        Args:
            bill_data: Dictionary containing TotalAmount and DueDate fields
            
        Returns:
            Risk level constant (RISK_LEVEL_SAFE, RISK_LEVEL_WARNING, or RISK_LEVEL_CRITICAL)
        """
        if not bill_data:
            return RISK_LEVEL_SAFE
        
        amount = bill_data.get("TotalAmount", DEFAULT_BILL_AMOUNT)
        due_date_str = bill_data.get("DueDate")
        
        if not due_date_str:
            logger.warning("Missing due date in bill data, defaulting to SAFE risk level")
            return RISK_LEVEL_SAFE
        
        days_until_due = self._calculate_days_until_due(due_date_str)
        if days_until_due is None:
            return RISK_LEVEL_SAFE
        
        # Determine risk level based on amount and urgency
        if (amount > CRITICAL_RISK_AMOUNT_THRESHOLD and 
            days_until_due <= CRITICAL_RISK_DAYS_THRESHOLD):
            return RISK_LEVEL_CRITICAL
        elif (amount > CRITICAL_RISK_AMOUNT_THRESHOLD and 
              days_until_due <= WARNING_RISK_DAYS_THRESHOLD):
            return RISK_LEVEL_WARNING
        else:
            return RISK_LEVEL_SAFE
    
    def _calculate_days_until_due(self, due_date_str: str) -> Optional[int]:
        """
        Calculate days until the due date from today.
        
        Args:
            due_date_str: Date string in YYYY-MM-DD format
            
        Returns:
            Number of days until due date, or None if parsing fails
        """
        try:
            due_date = datetime.strptime(due_date_str, DATE_FORMAT)
            today = datetime.now()
            days_until_due = (due_date - today).days
            return days_until_due
        except (ValueError, TypeError) as e:
            logger.warning(f"Could not parse due date '{due_date_str}': {e}")
            return None
    
    async def process_student_case(self, file_stream: BytesIO, university_index: Optional[str] = None) -> Dict[str, Any]:
        """
        Process a complete student financial case by chaining all agents.
        
        Steps:
        1. Analyze tuition bill
        2. Calculate risk level
        3. Search policies if risk is CRITICAL or WARNING
        4. Generate advice if policies found
        5. Draft negotiation email if risk is CRITICAL
        6. Return comprehensive assessment
        
        Args:
            file_stream: Binary stream of the uploaded PDF bill
            
        Returns:
            Comprehensive FinancialAssessment dictionary with:
            - bill_data: Extracted bill information
            - risk_level: SAFE, WARNING, or CRITICAL
            - policy_findings: Policy search results and advice
            - recommended_actions: List of actionable steps
            - negotiation_email: Drafted email (if risk is CRITICAL)
        """
        assessment: Dict[str, Any] = {
            "bill_data": None,
            "risk_level": RISK_LEVEL_SAFE,
            "policy_findings": None,
            "recommended_actions": [],
            "negotiation_email": None,
            "status": ASSESSMENT_STATUS_PROCESSING,
        }
        
        try:
            # Step 1: Analyze tuition bill
            logger.info("Step 1: Analyzing tuition bill...")
            bill_data = await analyze_tuition_bill(file_stream)
            assessment["bill_data"] = bill_data
            
            # Step 2: Calculate risk level
            logger.info("Step 2: Calculating risk level...")
            risk_level = self._calculate_risk_level(bill_data)
            assessment["risk_level"] = risk_level
            
            # Step 3 & 4: Search policies and generate advice if risk is elevated
            if risk_level in [RISK_LEVEL_CRITICAL, RISK_LEVEL_WARNING]:
                await self._process_policy_search(assessment, bill_data, risk_level, university_index)
            
            # Add default recommended actions for safe cases
            if assessment["risk_level"] == RISK_LEVEL_SAFE:
                assessment["recommended_actions"] = self._get_safe_case_actions()
            
            assessment["status"] = ASSESSMENT_STATUS_COMPLETED
            logger.info("Student case processed successfully")
            
        except Exception as e:
            logger.error(f"Error processing student case: {e}", exc_info=True)
            assessment["status"] = ASSESSMENT_STATUS_ERROR
            assessment["error"] = str(e)
        
        return assessment
    
    async def _process_policy_search(
        self, 
        assessment: Dict[str, Any], 
        bill_data: Dict[str, Any], 
        risk_level: str,
        university_index: Optional[str] = None
    ) -> None:
        """
        Process policy search and advice generation for elevated risk cases.
        
        This method searches university policies and generates actionable advice
        when the student's financial risk is elevated. For critical cases, it also
        drafts a negotiation email.
        
        Args:
            assessment: The assessment dictionary to update with policy findings
            bill_data: Extracted bill data containing amount and due date
            risk_level: Current risk level (RISK_LEVEL_WARNING or RISK_LEVEL_CRITICAL)
        """
        logger.info(f"Step 3: Searching policies (risk: {risk_level})...")
        
        # Create search query from bill context
        amount = bill_data.get("TotalAmount", DEFAULT_BILL_AMOUNT)
        due_date = bill_data.get("DueDate", "")
        query = f"tuition payment extension policies for ${amount:.2f} due on {due_date}"
        
        # Search handbook for relevant policies (use custom index if provided)
        search_results = await search_handbook(query, index_name=university_index)
        
        if not search_results:
            logger.info("No policy search results found")
            return
        
        logger.info("Step 4: Generating policy advice...")
        policy_advice = await generate_advice(search_results, query)
        assessment["policy_findings"] = {
            "search_results": search_results,
            "advice": policy_advice,
        }
        
        # Build recommended actions from policy advice
        if policy_advice:
            assessment["recommended_actions"] = self._build_recommended_actions(policy_advice)
        
        # Step 5: Draft negotiation email for critical cases only
        if risk_level == RISK_LEVEL_CRITICAL and assessment["policy_findings"]:
            await self._draft_negotiation_email(assessment, bill_data)
    
    def _build_recommended_actions(self, policy_advice: Dict[str, Any]) -> list[Dict[str, str]]:
        """
        Build recommended actions list from policy advice.
        
        Args:
            policy_advice: Policy advice dictionary containing actionable steps
            
        Returns:
            List of recommended action dictionaries
        """
        actions = [
            {
                "action": "Request Extension",
                "description": "Submit a written request to the Bursar's Office",
                "priority": "high",
            }
        ]
        
        actionable_step = policy_advice.get("actionable_step")
        if actionable_step:
            actions.append({
                "action": actionable_step,
                "description": policy_advice.get("summary", ""),
                "priority": "high",
            })
        
        return actions
    
    async def _draft_negotiation_email(
        self, 
        assessment: Dict[str, Any], 
        bill_data: Dict[str, Any]
    ) -> None:
        """
        Draft negotiation email for critical risk cases.
        
        This method attempts to draft a professional negotiation email. If it fails,
        the error is logged but processing continues without the email.
        
        Args:
            assessment: The assessment dictionary to update with negotiation email
            bill_data: Extracted bill data for email context
        """
        logger.info("Step 5: Drafting negotiation email...")
        try:
            policy_advice = assessment["policy_findings"]["advice"]
            negotiation_email = await draft_negotiation_email(
                bill_data=bill_data,
                policy_advice=policy_advice,
            )
            assessment["negotiation_email"] = negotiation_email
        except Exception as e:
            # Continue processing even if email generation fails
            logger.error(f"Error drafting negotiation email: {e}", exc_info=True)
    
    def _get_safe_case_actions(self) -> list[Dict[str, str]]:
        """
        Get default recommended actions for safe risk cases.
        
        Returns:
            List of low-priority recommended actions
        """
        return [
            {
                "action": "Monitor Payment Due Date",
                "description": "Ensure payment is submitted before the due date",
                "priority": "low",
            }
        ]

