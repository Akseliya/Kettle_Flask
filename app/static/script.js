window.onload = function () {
	let button = document.querySelector('.button');
	let t_display = document.querySelector('.t-display');
	let kettle_bottom = document.querySelector('.kettle .bottom');
	let waters = document.querySelectorAll('.water');
	let water_calm = document.querySelector('.water.calm');
	let water_troubled = document.querySelector('.water.troubled');
	let water_boiling = document.querySelector('.water.boiling');
	let t_list;
	let t_i_current = 0;
	let t_stop;

	setTimeout(function() {
		while (true) {
			// получение уровня воды от пользователя
			let max_water_level = water_calm.getAttribute('data-max-water-level');
			let water_level = prompt(`Введите уровень воды (0 - ${max_water_level})`, 1);
			if (water_level === null) {
				continue;
			}
			water_level = +water_level;
			if (isNaN(water_level) || water_level < 0 || water_level > max_water_level) {
				continue;
			}
			// инициализация чайника и получение списка температур
			fetch('/api/init_kettle', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json', },
				body: JSON.stringify({'water_level': water_level}),
			}).then(async (resp) => {
				const body = await resp.json();
				console.log(body.t_list);
				t_list = body.t_list;
				t_stop = body.t_stop;
			});
			// определение уровня воды
			let water_level_step = max_water_level / 3
			if (water_level > 0 && water_level < water_level_step) {
				waters.forEach(water => water.classList.add('bot'));
			} else if (water_level >= water_level_step && water_level < water_level_step * 2) {
				waters.forEach(water => water.classList.add('mid'));
			} else if (water_level >= water_level_step * 2) {
				waters.forEach(water => water.classList.add('top'));
			}
			if (water_level !== 0) {
				water_calm.style.opacity = 1;
			}

			break;
		}
	}, 150);

	let interval;
	let timeout_boiling;
	let timeout_troubled;
	// обработка нажатия кнопки
	button.addEventListener('click', function() {
		function stop_kettle () {
			// остановка чайника
			clearInterval(interval);
			button.classList.remove('active');
			kettle_bottom.classList.remove('active');
			t_display.style.opacity = 0;
			fetch('/api/kettle_is_off', { method: 'POST', });
			if (water_boiling.style.opacity === '1') {
				// если кипел при остановке
				timeout_boiling = setTimeout(function() {
					show_water('troubled');
					timeout_troubled = setTimeout(function() {
						show_water('calm');
						fetch('/api/kettle_is_stop', { method: 'POST', });
					}, 1800);
				}, 1400);
			} else if (water_troubled.style.opacity === '1') {
				// если немного булькал при остановке
				timeout_troubled = setTimeout(function() {
					show_water('calm');
					fetch('/api/kettle_is_stop', { method: 'POST', });
				}, 1800);
			}
		}

		function show_water(water_state) {
			// показ выбранного состояния воды и скрытие остальных
			water_calm.style.opacity = water_state === 'calm' ? 1 : 0;
			water_troubled.style.opacity = water_state === 'troubled' ? 1 : 0;
			water_boiling.style.opacity = water_state === 'boiling' ? 1 : 0;
		}

		function change_state_water() {
			// изменение состояния воды в зависимости от температуры
			if (t_list[t_i_current] >= 97) {
				show_water('boiling');
			} else if (t_list[t_i_current] >= 55) {
				show_water('troubled');
			}
		}

		if (!button.classList.contains('active')) {
			// запуск чайника
			clearTimeout(timeout_boiling);
			clearTimeout(timeout_troubled);
			button.classList.add('active');
			t_display.style.opacity = 1;
			kettle_bottom.classList.add('active');
			fetch('/api/kettle_is_on', { method: 'POST', });
			change_state_water();
			// постепенный нагрев чайника
			interval = setInterval(function() {
				if (t_list[t_i_current] >= t_stop) {
					stop_kettle();
					return;
				}
				t_i_current++;
				t_display.innerHTML = t_list[t_i_current];
				change_state_water()
				fetch('/api/change_t', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json', },
					body: JSON.stringify({'t': t_list[t_i_current]}),
				});
				if (t_list[t_i_current] >= 100) {
					fetch('/api/kettle_is_boiled', { method: 'POST', });
				}
			}, 1000);
		} else {
			stop_kettle();
		}
	});
}