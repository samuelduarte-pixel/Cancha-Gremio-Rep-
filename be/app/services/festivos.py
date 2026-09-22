# ¿Qué? Cálculo de festivos colombianos para cualquier año
# ¿Para qué? La franja de domingos aplica también a los días festivos nacionales
# ¿Impacto? Permite aplicar la tarifa de domingos/festivos a un día entre semana festivo

import datetime


def _easter(year: int) -> datetime.date:
    """Domingo de Pascua con el algoritmo de la Anonymous Gregorian method."""
    a = year % 19
    b, c = year // 100, year % 100
    d, e = b // 4, b % 4
    f = (b + 8) // 25
    g = (b - f + 1) // 3
    h = (19 * a + b - d - g + 15) % 30
    i, k = c // 4, c % 4
    l = (32 + 2 * e + 2 * i - h - k) % 7
    m = (a + 11 * h + 22 * l) // 451
    month = (h + l - 7 * m + 114) // 31
    day = ((h + l - 7 * m + 114) % 31) + 1
    return datetime.date(year, month, day)


def _siguiente_lunes(fecha: datetime.date) -> datetime.date:
    """Ley Emiliani: si la fecha cae entre lunes y viernes, se celebra el lunes siguiente."""
    return fecha + datetime.timedelta(days=(7 - fecha.weekday()) % 7)


def get_holidays(year: int) -> set:
    """Devuelve las fechas festivas nacionales de Colombia para el año indicado."""
    festivos = {
        datetime.date(year, 1, 1),    # Año Nuevo
        datetime.date(year, 5, 1),    # Día del Trabajo
        datetime.date(year, 7, 20),   # Independencia
        datetime.date(year, 8, 7),    # Batalla de Boyacá
        datetime.date(year, 12, 8),   # Inmaculada Concepción
        datetime.date(year, 12, 25),  # Navidad
    }

    # Festivos trasladables (Ley Emiliani)
    for mes, dia in [(1, 6), (3, 19), (6, 29), (8, 15), (10, 12), (11, 1), (11, 11)]:
        festivos.add(_siguiente_lunes(datetime.date(year, mes, dia)))

    # Festivos ligados a la Pascua
    easter = _easter(year)
    festivos.add(easter - datetime.timedelta(days=3))  # Jueves Santo
    festivos.add(easter - datetime.timedelta(days=2))  # Viernes Santo
    festivos.add(easter + datetime.timedelta(days=43))  # Ascensión del Señor
    festivos.add(easter + datetime.timedelta(days=64))  # Corpus Christi
    festivos.add(easter + datetime.timedelta(days=71))  # Sagrado Corazón

    return festivos


def es_festivo(fecha: datetime.date) -> bool:
    return fecha in get_holidays(fecha.year)