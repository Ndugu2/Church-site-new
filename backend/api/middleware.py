import logging
import time


logger = logging.getLogger('api.request')


class RequestLoggingMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        start = time.perf_counter()
        response = self.get_response(request)
        duration_ms = int((time.perf_counter() - start) * 1000)

        if request.path.startswith('/api/'):
            logger.info('%s %s -> %s (%sms)', request.method, request.path, response.status_code, duration_ms)

        return response
