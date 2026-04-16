import csv
import io

COLUMN_HEADERS = [
    ('log_date',          'Date'),
    ('sleep_hours',       'Sleep Hours'),
    ('sleep_quality',     'Sleep Quality (1-5)'),
    ('ate_breakfast',     'Ate Breakfast'),
    ('breakfast_food',    'Breakfast Food'),
    ('worked_today',      'Worked Today'),
    ('worked_in_office',  'In Office'),
    ('exercised',         'Exercised'),
    ('exercise_type',     'Exercise Type'),
    ('exercise_minutes',  'Exercise Minutes'),
    ('ate_lunch',         'Ate Lunch'),
    ('lunch_food',        'Lunch Food'),
    ('drank_alcohol',     'Drank Alcohol'),
    ('alcohol_drinks',    'Number of Drinks'),
    ('ate_dinner',        'Ate Dinner'),
    ('dinner_food',       'Dinner Food'),
    ('snacked',           'Snacked'),
    ('snack_food',        'Snack Food'),
    ('read_today',        'Read Today'),
    ('read_minutes',      'Minutes Read'),
    ('learned_today',     'Spent Time Learning'),
    ('learning_topic',    'Learning Topic'),
    ('learning_minutes',  'Learning Minutes'),
    ('bowel_movements',   'Bowel Movements'),
    ('caffeine_cups',     'Caffeine Cups'),
    ('water_cups',        'Water Cups'),
    ('outdoor_minutes',   'Outdoor Minutes'),
    ('weight_lbs',        'Weight (lbs)'),
    ('energy_level',      'Energy Level (1-10)'),
    ('stress_level',      'Stress Level (1-10)'),
    ('anxiety_level',     'Anxiety Level (1-10)'),
    ('overall_mood',      'Overall Mood (1-10)'),
    ('personal_notes',    'Notes'),
]

BOOL_FIELDS = {
    'ate_breakfast', 'worked_today', 'worked_in_office', 'exercised',
    'ate_lunch', 'drank_alcohol', 'ate_dinner', 'snacked',
    'read_today', 'learned_today',
}


def rows_to_csv(rows, numeric=False):
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([label for _, label in COLUMN_HEADERS])
    for row in rows:
        csv_row = []
        for field, _ in COLUMN_HEADERS:
            val = row.get(field)
            if val is None:
                csv_row.append('')
            elif field in BOOL_FIELDS and not numeric:
                csv_row.append('Yes' if val == 1 else 'No')
            else:
                csv_row.append(val)
        writer.writerow(csv_row)
    return output.getvalue()
