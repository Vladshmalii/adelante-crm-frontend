"""Сортировка украинских названий.

Сортировка по кодам символов ставит «І», «Ї», «Є» перед «А», а «Ґ» после «Я».
Ключ ниже упорядочивает буквы по украинскому алфавиту без учёта регистра;
прочие символы (цифры, латиница) идут по коду символа, раньше кириллицы.
"""

ALPHABET = "абвгґдеєжзиіїйклмнопрстуфхцчшщьюя"
_ORDER = {letter: index for index, letter in enumerate(ALPHABET)}


def uk_sort_key(value: str) -> tuple[tuple[int, int], ...]:
    return tuple(
        (1, _ORDER[ch]) if ch in _ORDER else (0, ord(ch)) for ch in value.casefold().strip()
    )
