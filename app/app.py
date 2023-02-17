from flask import Flask, render_template, request

import settings
from kettle import Kettle

app = Flask(__name__)
kettle = Kettle()


@app.route('/')
def home():
    return render_template(
        'base.html',
        max_water_level=kettle.max_water_level,
        t_water_beginning=kettle.t_water_beginning
    )


@app.route('/api/init_kettle', methods=['POST'])
def init_kettle():
    water_level = request.get_json()['water_level']
    kettle.pour_water(water_level)

    return {'t_list': kettle.t_list, 't_stop': kettle.t_stop}, 200


@app.route('/api/kettle_is_on', methods=['POST'])
def kettle_is_on():
    kettle.is_on()

    return {'status': 'success'}, 200


@app.route('/api/change_t', methods=['POST'])
def change_t():
    t = request.get_json()['t']
    kettle.is_change_t(t)

    return {'status': 'success'}, 200


@app.route('/api/kettle_is_boiled', methods=['POST'])
def kettle_is_boiled():
    kettle.is_boiled()

    return {'status': 'success'}, 200


@app.route('/api/kettle_is_stop', methods=['POST'])
def kettle_is_stop():
    kettle.is_stop()

    return {'status': 'success'}, 200


@app.route('/api/kettle_is_off', methods=['POST'])
def kettle_is_off():
    kettle.is_off()

    return {'status': 'success'}, 200


if __name__ == '__main__':
    app.run()
