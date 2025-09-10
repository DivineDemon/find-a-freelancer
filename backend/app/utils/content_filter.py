import re
from typing import List, Tuple

from app.core.logger import get_logger

logger = get_logger(__name__)

class ContentFilter:

    def __init__(self):

        self.url_patterns = [
            r'https?://[^\s]+',
            r'www\.[^\s]+',
            r'[^\s]+\.(com|org|net|io|co|me|app|dev|tech|ai|ml)',
        ]
        
        self.contact_patterns = [
            r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
            r'\+?[1-9]\d{1,14}',
            r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b',
            r'@[A-Za-z0-9_]+',
        ]

        self.url_regex = re.compile('|'.join(self.url_patterns), re.IGNORECASE)
        self.contact_regex = re.compile('|'.join(self.contact_patterns), re.IGNORECASE)
    
    def filter_message(self, content: str) -> Tuple[str, List[str], bool]:
        
        violations = []
        filtered_content = content
        is_clean = True

        url_matches = self.url_regex.findall(content)
        if url_matches:
            violations.append(
                f"URLs detected: {', '.join(url_matches)}"
            )
            filtered_content = self.url_regex.sub(
                '[URL REMOVED]', filtered_content
            )
            is_clean = False

        contact_matches = self.contact_regex.findall(content)
        if contact_matches:
            violations.append(
                f"Contact information detected: {', '.join(contact_matches)}"
            )
            filtered_content = self.contact_regex.sub(
                '[CONTACT INFO REMOVED]', filtered_content
            )
            is_clean = False

        if violations:
            logger.warning(
                f"Content filtering violations: {violations}"
            )
        
        return filtered_content, violations, is_clean
    
    def contains_violations(self, content: str) -> bool:
        
        return bool(
            self.url_regex.search(content) or 
            self.contact_regex.search(content)
        )
    
    def get_violation_details(self, content: str) -> List[str]:
        
        violations = []

        url_matches = self.url_regex.findall(content)
        if url_matches:
            violations.append(
                f"URLs: {', '.join(url_matches)}"
            )

        contact_matches = self.contact_regex.findall(content)
        if contact_matches:
            violations.append(
                f"Contact info: {', '.join(contact_matches)}"
            )
        
        return violations
    
    def sanitize_filename(self, filename: str) -> str:

        dangerous_chars = ['/', '\\', ':', '*', '?', '"', '<', '>', '|']
        sanitized = filename
        for char in dangerous_chars:
            sanitized = sanitized.replace(char, '_')

        if len(sanitized) > 100:
            if '.' in sanitized:
                name, ext = sanitized.rsplit('.', 1)
            else:
                name, ext = sanitized, ''
            sanitized = name[:95] + '.' + ext if ext else name[:100]
        
        return sanitized

content_filter = ContentFilter()
