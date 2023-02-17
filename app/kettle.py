import logging
import sqlite3

import settings


class Kettle:
    """Реализация сущности 'чайник'."""
    max_water_level = settings.max_water_level
    t_stop = settings.t_stop if settings.t_stop <= 100 else 100
    boil_time = int(settings.boil_time)
    t_water_beginning = settings.t_water_beginning

    sqlite_conn: sqlite3.Connection
    sqlite_cursor: sqlite3.Cursor

    def __init__(self):
        logging.basicConfig(
            filename='../logs.txt',
            format='[%(asctime)s][%(levelname)s] %(message)s',
            datefmt='%d.%m.%y %H:%M:%S',
            level=logging.DEBUG
        )
        self.sqlite_init()
        # создание списка температур нагревания чайника
        self.t_list = []
        t_water = self.t_water_beginning
        t_step = (self.t_stop - t_water) / self.boil_time
        for x in range(self.boil_time + 1):
            self.t_list.append(round(t_water))
            t_water += t_step
        
    def sqlite_init(self):
        """Инициализация sqlite, создание таблицы логов"""
        self.sqlite_conn = sqlite3.connect('../orders.db', check_same_thread=False)
        self.sqlite_cursor = self.sqlite_conn.cursor()
        self.sqlite_cursor.execute(
            'CREATE TABLE IF NOT EXISTS logs ('
            'id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,'
            'message VARCHAR(64),'
            'datetime TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL );'
        )
        self.sqlite_conn.commit()

    def is_on(self):
        """Включение чайника."""
        self.log_message('Kettle is turned on')

    def is_change_t(self, t):
        """Изменение температуры воды в чайнике."""
        self.log_message(f't water: {t}°C')

    def is_boiled(self):
        """Закипание чайника."""
        self.log_message('Kettle is boiled')

    def is_stop(self):
        """Остановка чайника."""
        self.log_message('Kettle is stopped')

    def is_off(self):
        """Выключение чайника."""
        self.log_message('Kettle is turned off')

    def pour_water(self, water_level: float):
        """Наполнение чайника водой."""
        self.water_level = water_level
        self.log_message(f'{water_level} liters of water is poured into the kettle')

    def log_message(self, message: str):
        """Запись сообщений чайника в файл и таблицу логов."""
        try:
            self.sqlite_cursor.execute('INSERT INTO logs(message) VALUES (?);', [message])
            self.sqlite_conn.commit()
        except sqlite3.ProgrammingError:
            logging.error('Cursor recursiv error')
        logging.info(message)
