import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), 'daily_data.db')


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_connection()
    conn.execute('''
        CREATE TABLE IF NOT EXISTS daily_log (
            id                  INTEGER PRIMARY KEY AUTOINCREMENT,
            log_date            TEXT NOT NULL UNIQUE,

            sleep_hours         REAL,
            sleep_quality       INTEGER,

            ate_breakfast       INTEGER,
            breakfast_food      TEXT,

            worked_today        INTEGER,
            worked_in_office    INTEGER,

            exercised           INTEGER,
            exercise_type       TEXT,
            exercise_minutes    INTEGER,

            ate_lunch           INTEGER,
            lunch_food          TEXT,

            drank_alcohol       INTEGER,
            alcohol_drinks      INTEGER,

            ate_dinner          INTEGER,
            dinner_food         TEXT,

            snacked             INTEGER,
            snack_food          TEXT,

            read_today          INTEGER,
            read_minutes        INTEGER,

            learned_today       INTEGER,
            learning_topic      TEXT,
            learning_minutes    INTEGER,

            bowel_movements     INTEGER,
            caffeine_cups       INTEGER,
            water_cups          INTEGER,
            outdoor_minutes     INTEGER,
            weight_lbs          REAL,

            energy_level        INTEGER,
            stress_level        INTEGER,
            anxiety_level       INTEGER,
            overall_mood        INTEGER,

            personal_notes      TEXT,

            created_at          TEXT DEFAULT (datetime('now')),
            updated_at          TEXT DEFAULT (datetime('now'))
        )
    ''')
    conn.commit()
    conn.close()


def get_entry_for_date(date_str):
    conn = get_connection()
    row = conn.execute('SELECT * FROM daily_log WHERE log_date = ?', (date_str,)).fetchone()
    conn.close()
    return dict(row) if row else None


def upsert_entry(data):
    conn = get_connection()
    fields = [k for k in data.keys() if k != 'id']
    placeholders = ', '.join(['?' for _ in fields])
    updates = ', '.join([f'{f} = excluded.{f}' for f in fields if f != 'log_date'])
    sql = f'''
        INSERT INTO daily_log ({", ".join(fields)})
        VALUES ({placeholders})
        ON CONFLICT(log_date) DO UPDATE SET {updates},
            updated_at = datetime('now')
    '''
    conn.execute(sql, [data[f] for f in fields])
    conn.commit()
    row = conn.execute('SELECT id FROM daily_log WHERE log_date = ?', (data['log_date'],)).fetchone()
    conn.close()
    return row['id']


def get_recent_entries(limit=30):
    conn = get_connection()
    rows = conn.execute(
        'SELECT * FROM daily_log ORDER BY log_date DESC LIMIT ?', (limit,)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_all_entries(start=None, end=None):
    conn = get_connection()
    if start and end:
        rows = conn.execute(
            'SELECT * FROM daily_log WHERE log_date BETWEEN ? AND ? ORDER BY log_date',
            (start, end)
        ).fetchall()
    else:
        rows = conn.execute('SELECT * FROM daily_log ORDER BY log_date').fetchall()
    conn.close()
    return [dict(r) for r in rows]
