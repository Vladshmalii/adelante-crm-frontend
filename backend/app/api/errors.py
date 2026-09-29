"""Ошибка API с машинно-читаемыми деталями: {message, code, details}.

Для случаев, когда фронту нужен не только текст — например, 409 со списком
записей, которые мешают изменить смену.
"""

from typing import Any

from fastapi import HTTPException


class ApiError(HTTPException):
    def __init__(
        self, status_code: int, message: str, *, code: str, details: dict[str, Any] | None = None
    ) -> None:
        super().__init__(status_code, message)
        self.code = code
        self.details = details
