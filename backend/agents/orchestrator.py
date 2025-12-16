"""
ScholarShield Orchestrator: The "Brain" that coordinates all agents
"""
import os
import logging
from typing import Dict, List, Optional
from datetime import datetime, timedelta
from io import BytesIO
from agents.document_parser import analyze_tuition_bill
from agents.policy_rag import search_handbook, generate_advice
from agents.negotiator import draft_negotiation_email

logger = logging.getLogger(__name__)


class ScholarShieldOrchestrator:
    """
    The main orchestrator that coordinates all agents to process a student's financial case.
    """
    
    def __init__(self):
        """Initialize the orchestrator."""
        pass
    
    def _calculate_risk_level(self, bill_data: Dict) -> str:
        """
        Calculate financial risk level based on bill data.
        
        Risk calculation:
        - CRITICAL: amount > $500 AND days_until_due <= 3
        - WARNING: amount > $500 AND days_until_due <= 7
        - SAFE: otherwise
        """
        if not bill_data:
            return "SAFE"
        
        amount = bill_data.get("TotalAmount", 0)
        due_date_str = bill_data.get("DueDate")
        
        if not due_date_str:
            return "SAFE"
        
        try:
            due_date = datetime.strptime(due_date_str, "%Y-%m-%d")
            today = datetime.now()
            days_until_due = (due_date - today).days
        except (ValueError, TypeError):
            logger.warning(f"Could not parse due date: {due_date_str}")
            return "SAFE"
        
        if amount > 500 and days_until_due <= 3:
            return "CRITICAL"
        elif amount > 500 and days_until_due <= 7:
            return "WARNING"
        else:
            return "SAFE"
    
    async def process_student_case(self, file_stream: BytesIO) -> Dict:
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
        assessment = {
            "bill_data": None,
            "risk_level": "SAFE",
            "policy_findings": None,
            "recommended_actions": [],
            "negotiation_email": None,
            "status": "processing"
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
            if risk_level in ["CRITICAL", "WARNING"]:
                logger.info(f"Step 3: Searching policies (risk: {risk_level})...")
                
                # Create query based on bill data
                amount = bill_data.get("TotalAmount", 0)
                due_date = bill_data.get("DueDate", "")
                query = f"tuition payment extension policies for {amount} due on {due_date}"
                
                # Search handbook
                search_results = await search_handbook(query)
                
                if search_results:
                    logger.info("Step 4: Generating policy advice...")
                    # Generate advice from search results
                    policy_advice = await generate_advice(search_results, query)
                    assessment["policy_findings"] = {
                        "search_results": search_results,
                        "advice": policy_advice
                    }
                    
                    # Build recommended actions based on advice
                    if policy_advice:
                        actions = [
                            {
                                "action": "Request Extension",
                                "description": "Submit a written request to the Bursar's Office",
                                "priority": "high"
                            }
                        ]
                        
                        if policy_advice.get("actionable_step"):
                            actions.append({
                                "action": policy_advice["actionable_step"],
                                "description": policy_advice.get("summary", ""),
                                "priority": "high"
                            })
                        
                        assessment["recommended_actions"] = actions
                
                # Step 5: Draft negotiation email if risk is CRITICAL
                if risk_level == "CRITICAL" and assessment["policy_findings"]:
                    logger.info("Step 5: Drafting negotiation email...")
                    try:
                        negotiation_email = await draft_negotiation_email(
                            bill_data=bill_data,
                            policy_advice=assessment["policy_findings"]["advice"]
                        )
                        assessment["negotiation_email"] = negotiation_email
                    except Exception as e:
                        logger.error(f"Error drafting negotiation email: {str(e)}")
                        # Continue without email if there's an error
            
            # Add default recommended actions for safe cases
            if assessment["risk_level"] == "SAFE":
                assessment["recommended_actions"] = [
                    {
                        "action": "Monitor Payment Due Date",
                        "description": "Ensure payment is submitted before the due date",
                        "priority": "low"
                    }
                ]
            
            assessment["status"] = "completed"
            logger.info("Student case processed successfully")
            
        except Exception as e:
            logger.error(f"Error processing student case: {str(e)}")
            assessment["status"] = "error"
            assessment["error"] = str(e)
        
        return assessment

