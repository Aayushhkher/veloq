import re
import httpx
from typing import Dict, List, Tuple, Any
from sqlalchemy.orm import Session
from app.models.survey import Survey, SurveyQuestion
from app.core.config import settings

class VerificationService:
    @staticmethod
    def verify_response(
        db: Session,
        survey: Survey,
        answers: Dict[str, Any],
        time_taken_seconds: int = None,
        paste_count: int = 0,
        pasted_questions: List[int] = None
    ) -> Tuple[float, bool, List[str]]:
        """
        Evaluates a survey submission.
        Returns:
            quality_score (float): 0.0 to 1.0
            is_flagged (bool): True if suspicious
            flag_reasons (list of strings): Details of why it was flagged
        """
        pasted_questions = pasted_questions or []
        flag_reasons = []
        quality_score = 1.0

        questions = {q.id: q for q in survey.questions}
        num_questions = len(questions)

        # 1. Completion Time Check
        if time_taken_seconds is not None:
            # Min average time per question is 3 seconds, or 10% of estimated time, whichever is greater
            min_allowed_time = max(num_questions * 3.0, (survey.estimated_time_minutes or 5) * 60 * 0.1)
            if time_taken_seconds < min_allowed_time:
                flag_reasons.append("Completed too quickly")
                quality_score -= 0.35

        # Extract text answers for analysis
        text_answers = []
        all_text_answers = {}
        for q_id_str, val in answers.items():
            try:
                q_id = int(q_id_str)
            except ValueError:
                continue
            
            if q_id in questions:
                q = questions[q_id]
                # Keep text answers for analysis
                if q.question_type.value == "text" and isinstance(val, str) and val.strip():
                    text_answers.append(val.strip())
                    all_text_answers[q_id] = val.strip()

        # 2. AI Phrase Detection (Heuristic)
        ai_patterns = [
            r"\bas\s+an\s+ai\b",
            r"\blanguage\s+model\b",
            r"\bhelpful\s+assistant\b",
            r"\bcannot\s+fulfill\s+this\s+request\b",
            r"\bdo\s+not\s+have\s+personal\s+opinions\b",
            r"\bmy\s+knowledge\s+cutoff\b",
            r"\bmy\s+training\s+data\b",
            r"\bopenai\b",
            r"\bchatgpt\b"
        ]
        
        ai_phrase_found = False
        for text in text_answers:
            for pattern in ai_patterns:
                if re.search(pattern, text, re.IGNORECASE):
                    ai_phrase_found = True
                    break
            if ai_phrase_found:
                break
                
        if ai_phrase_found:
            flag_reasons.append("AI-generated phrasing detected")
            quality_score -= 0.6

        # 3. Repetition & Gibberish Text Checks
        if text_answers:
            # Check for identical answers across multiple questions
            unique_answers = set(text_answers)
            if len(text_answers) > 1 and len(unique_answers) == 1:
                flag_reasons.append("Repetitive answers across questions")
                quality_score -= 0.3

            # Check for character repeating gibberish (e.g. "aaaaaa", "asdfasdf")
            gibberish_found = False
            low_effort_found = False
            for text in text_answers:
                text_clean = text.lower().strip()
                # Character repetition (e.g., "hhhhh")
                if len(text_clean) > 5 and len(set(text_clean)) <= 2:
                    gibberish_found = True
                # Pattern repetition (e.g. "asdfasdfasdf")
                elif len(text_clean) >= 10:
                    if re.search(r"(.{3,})\1{2,}", text_clean):
                        gibberish_found = True
                    elif len(text_clean) <= 25 and len(set(text_clean)) / len(text_clean) < 0.35:
                        gibberish_found = True

                # Simple words of low effort for long questions (e.g., "ok", "good", "nice", "n/a", "no")
                if len(text) < 4 and text.lower() in ["ok", "good", "nice", "n/a", "no", "yes", "none", "-"]:
                    low_effort_found = True

            if gibberish_found:
                flag_reasons.append("Gibberish/character repetition detected")
                quality_score -= 0.4
            if low_effort_found:
                flag_reasons.append("Low-effort/extremely short answer detected")
                quality_score -= 0.2

        # 4. Attention Check / Honeypot Check
        failed_attention = False
        for q_id, q in questions.items():
            q_text_lower = q.question_text.lower()
            # Look for indicators of an attention check
            is_attention_check = any(k in q_text_lower for k in ["attention check", "verification question", "select option", "choose option", "prove you are human"])
            
            if is_attention_check and str(q_id) in answers:
                user_ans = answers[str(q_id)]
                options = q.options or []
                
                # Try to parse instructions like: select 'Option A' or select option 'A' or click "Blue"
                # Look for text in single/double quotes or uppercase option name
                match = re.search(r"['\"‘“]([^'\"’“”]+)['\"’“”]", q.question_text)
                target = match.group(1).strip() if match else None
                
                if not target:
                    # Alternative: search for words from option list mentioned in the instruction
                    for opt in options:
                        if opt.lower() in q_text_lower and "select" in q_text_lower:
                            target = opt
                            break
                            
                # Also check numeric instructions for scale/rating, e.g. "select 4"
                if not target and q.question_type.value in ["rating", "scale"]:
                    num_match = re.search(r"\b(select|choose|click)\s+(\d+)\b", q_text_lower)
                    if num_match:
                        target = int(num_match.group(2))

                if target:
                    # Compare
                    if isinstance(user_ans, str) and isinstance(target, str):
                        if user_ans.strip().lower() != target.lower():
                            failed_attention = True
                    elif isinstance(user_ans, list) and isinstance(target, str):
                        # For checkbox
                        user_ans_lower = [str(x).strip().lower() for x in user_ans]
                        if target.lower() not in user_ans_lower:
                            failed_attention = True
                    elif (isinstance(user_ans, int) or isinstance(user_ans, float)) and (isinstance(target, int) or isinstance(target, float)):
                        if int(user_ans) != int(target):
                            failed_attention = True
                    elif str(user_ans).strip().lower() != str(target).strip().lower():
                        failed_attention = True

        if failed_attention:
            flag_reasons.append("Failed attention check")
            quality_score -= 0.7

        # 5. Copy-Paste Detection
        if paste_count > 0 or len(pasted_questions) > 0:
            flag_reasons.append(f"Pasted content detected ({paste_count} times)")
            quality_score -= 0.25

        # 6. Gemini AI Advanced Audit
        if settings.GEMINI_API_KEY and text_answers:
            try:
                # Build the prompt
                prompt_parts = []
                for q_id, text in all_text_answers.items():
                    q = questions[q_id]
                    prompt_parts.append(f"Question: {q.question_text}\nAnswer: {text}")
                
                qa_block = "\n\n".join(prompt_parts)
                
                system_prompt = (
                    "You are an expert quality audit system for a survey platform.\n"
                    "Your job is to analyze the user's survey responses and determine if they are genuine, human-written, and high quality, or if they are AI-generated, bot-generated, or low-effort filler text.\n\n"
                    f"Survey Title: {survey.title}\n"
                    f"Survey Description: {survey.description or 'N/A'}\n\n"
                    f"Responses:\n{qa_block}\n\n"
                    "Analyze the responses for:\n"
                    "1. AI language model markers (e.g., robotic phrasing, template answers, bullet points typical of ChatGPT, 'As an AI...', etc.).\n"
                    "2. Copy-pasted or irrelevant answers to the questions.\n"
                    "3. Low-effort gibberish or non-sensical answers.\n\n"
                    "Respond ONLY with a JSON object in this format:\n"
                    "{\n"
                    "  \"is_genuine\": true/false,\n"
                    "  \"confidence_score\": 0.0 to 1.0,\n"
                    "  \"reasons\": [\"reason1\", \"reason2\"]\n"
                    "}"
                )

                # Send direct REST request to Gemini API
                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={settings.GEMINI_API_KEY}"
                headers = {"Content-Type": "application/json"}
                payload = {
                    "contents": [{"parts": [{"text": system_prompt}]}],
                    "generationConfig": {
                        "responseMimeType": "application/json"
                    }
                }
                
                # Execute HTTP POST request using httpx (timeout of 5 seconds to avoid hanging the submit flow)
                response = httpx.post(url, json=payload, headers=headers, timeout=5.0)
                
                if response.status_code == 200:
                    res_json = response.json()
                    candidates = res_json.get("candidates", [])
                    if candidates:
                        text_response = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "{}")
                        import json
                        gemini_res = json.loads(text_response.strip())
                        
                        is_genuine = gemini_res.get("is_genuine", True)
                        confidence = gemini_res.get("confidence_score", 1.0)
                        gemini_reasons = gemini_res.get("reasons", [])
                        
                        if not is_genuine:
                            flag_reasons.append(f"Gemini AI Audit flags: {', '.join(gemini_reasons)}")
                            quality_score -= (1.0 - confidence) * 0.7
            except Exception as e:
                # Graceful fallback: do not crash if Gemini API fails
                import sys
                print(f"Gemini verification error: {e}", file=sys.stderr)

        # Normalize score
        quality_score = max(0.0, min(1.0, round(quality_score, 2)))
        
        # Decide if flagged
        is_flagged = len(flag_reasons) > 0 or quality_score < 0.8
        
        return quality_score, is_flagged, flag_reasons
