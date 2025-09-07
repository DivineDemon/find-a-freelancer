import time
from typing import Callable
from uuid import uuid4

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.logger import get_logger

logger = get_logger(__name__)


class LoggingMiddleware(BaseHTTPMiddleware):
    """Middleware for logging HTTP requests and responses."""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        request_id = str(uuid4())
        request.state.request_id = request_id
        
        start_time = time.time()
        client_host = request.client.host if request.client else 'unknown'
        logger.info(
            f"Request started - ID: {request_id}, "
            f"Method: {request.method}, "
            f"URL: {request.url}, "
            f"Client: {client_host}"
        )
        
        try:
            response = await call_next(request)
            
            process_time = time.time() - start_time
            
            logger.info(
                f"Request completed - ID: {request_id}, "
                f"Status: {response.status_code}, "
                f"Duration: {process_time:.3f}s"
            )
            
            response.headers["X-Request-ID"] = request_id
            response.headers["X-Process-Time"] = str(process_time)
            
            return response
            
        except Exception as e:
            process_time = time.time() - start_time
            logger.error(
                f"Request failed - ID: {request_id}, "
                f"Error: {str(e)}, "
                f"Duration: {process_time:.3f}s"
            )
            raise


class SecurityMiddleware(BaseHTTPMiddleware):
    """Middleware for adding security headers."""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)
        
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = (
            "geolocation=(), microphone=(), camera=()"
        )
        
        return response


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Basic rate limiting middleware."""
    
    def __init__(self, app, requests_per_minute: int = 60):
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        self.request_counts = {}
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        client_ip = request.client.host if request.client else "unknown"
        current_time = int(time.time() / 60)  # Current minute
        
        if client_ip not in self.request_counts:
            self.request_counts[client_ip] = {}
        
        if current_time not in self.request_counts[client_ip]:
            self.request_counts[client_ip] = {current_time: 0}
        
        if self.request_counts[client_ip][current_time] >= self.requests_per_minute:
            logger.warning(f"Rate limit exceeded for client: {client_ip}")
            from fastapi import HTTPException, status
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded. Please try again later."
            )
        
        self.request_counts[client_ip][current_time] += 1
        
        old_time = current_time - 2
        if old_time in self.request_counts[client_ip]:
            del self.request_counts[client_ip][old_time]
        
        return await call_next(request)
