from flask import Flask, jsonify, request, render_template, Response
from database import init_db, get_entry_for_date, upsert_entry, get_recent_entries, get_all_entries
from export import rows_to_csv
from datetime import date

app = Flask(__name__)


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/history')
def history():
    entries = get_recent_entries(60)
    return render_template('history.html', entries=entries)


@app.route('/api/today')
def api_today():
    today = request.args.get('date', date.today().isoformat())
    entry = get_entry_for_date(today)
    return jsonify({'exists': entry is not None, 'data': entry})


@app.route('/api/save', methods=['POST'])
def api_save():
    data = request.get_json()
    if not data or 'log_date' not in data:
        return jsonify({'error': 'log_date required'}), 400
    entry_id = upsert_entry(data)
    return jsonify({'success': True, 'id': entry_id})


@app.route('/api/history')
def api_history():
    entries = get_recent_entries(30)
    return jsonify({'records': entries})


@app.route('/api/export/csv')
def api_export_csv():
    start = request.args.get('start')
    end = request.args.get('end')
    numeric = request.args.get('format') == 'numeric'
    rows = get_all_entries(start, end)
    csv_data = rows_to_csv(rows, numeric=numeric)
    filename = 'daily_data.csv'
    if start and end:
        filename = f'daily_data_{start}_to_{end}.csv'
    return Response(
        csv_data,
        mimetype='text/csv',
        headers={'Content-Disposition': f'attachment; filename="{filename}"'}
    )


if __name__ == '__main__':
    init_db()
    print('\n  Daily Data App running at http://localhost:5000\n')
    app.run(debug=True, port=5000)
