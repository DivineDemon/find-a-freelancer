"""Content filtering utility for chat messages."""

import re
from typing import List, Tuple

from app.core.logger import get_logger

logger = get_logger(__name__)


class ContentFilter:
    """Filters chat content to prevent sharing of URLs and contact information."""
    
    def __init__(self):
        # Patterns to detect and filter
        self.url_patterns = [
            r'https?://[^\s]+',  # HTTP/HTTPS URLs
            r'www\.[^\s]+',      # WWW URLs
            r'[^\s]+\.(com|org|net|io|co|me|app|dev|tech|ai|ml)',  # Common TLDs
        ]
        
        self.contact_patterns = [
            r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',  # Email
            r'\+?[1-9]\d{1,14}',  # Phone numbers (international format)
            r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b',  # US phone format
            r'@[A-Za-z0-9_]+',  # Social media handles
        ]
        
        # Compile patterns for efficiency
        self.url_regex = re.compile('|'.join(self.url_patterns), re.IGNORECASE)
        self.contact_regex = re.compile('|'.join(self.contact_patterns), re.IGNORECASE)
    
    def filter_message(self, content: str) -> Tuple[str, List[str], bool]:
        """
        Filter a message content and return filtered content, violations, 
        and is_clean status.
        
        Args:
            content: The message content to filter
            
        Returns:
            Tuple of (filtered_content, violations, is_clean)
        """
        violations = []
        filtered_content = content
        is_clean = True
        
        # Check for URLs
        url_matches = self.url_regex.findall(content)
        if url_matches:
            violations.append(
                f"URLs detected: {', '.join(url_matches)}"
            )
            filtered_content = self.url_regex.sub(
                '[URL REMOVED]', filtered_content
            )
            is_clean = False
        
        # Check for contact information
        contact_matches = self.contact_regex.findall(content)
        if contact_matches:
            violations.append(
                f"Contact information detected: {', '.join(contact_matches)}"
            )
            filtered_content = self.contact_regex.sub(
                '[CONTACT INFO REMOVED]', filtered_content
            )
            is_clean = False
        
        # Log violations for moderation
        if violations:
            logger.warning(
                f"Content filtering violations: {violations}"
            )
        
        return filtered_content, violations, is_clean
    
    def contains_violations(self, content: str) -> bool:
        """Quick check if content contains any violations."""
        return bool(
            self.url_regex.search(content) or 
            self.contact_regex.search(content)
        )
    
    def get_violation_details(self, content: str) -> List[str]:
        """Get detailed information about content violations."""
        violations = []
        
        # Check URLs
        url_matches = self.url_regex.findall(content)
        if url_matches:
            violations.append(
                f"URLs: {', '.join(url_matches)}"
            )
        
        # Check contact info
        contact_matches = self.contact_regex.findall(content)
        if contact_matches:
            violations.append(
                f"Contact info: {', '.join(contact_matches)}"
            )
        
        return violations
    
    def sanitize_filename(self, filename: str) -> str:
        """Sanitize filename to prevent path traversal and other security issues."""
        # Remove path separators and other dangerous characters
        dangerous_chars = ['/', '\\', ':', '*', '?', '"', '<', '>', '|']
        sanitized = filename
        for char in dangerous_chars:
            sanitized = sanitized.replace(char, '_')
        
        # Limit length
        if len(sanitized) > 100:
            if '.' in sanitized:
                name, ext = sanitized.rsplit('.', 1)
            else:
                name, ext = sanitized, ''
            sanitized = name[:95] + '.' + ext if ext else name[:100]
        
        return sanitized


# Global content filter instance
content_filter = ContentFilter()
