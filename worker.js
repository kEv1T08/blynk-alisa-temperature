// worker.js для Cloudflare Workers
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

// Конфигурация (лучше использовать Secrets в настройках Workers)
const config = {
  BLYNK_TOKEN: 'R6F5kbeohy_siGHlaP43XiZ4ZrtguEqP',
  CACHE_TTL: 30 // Кэш 30 секунд
};

// Кэш в памяти (используется глобальный объект Worker)
let cache = {
  temperature: null,
  lastUpdated: 0
};

async function fetchBlynkTemperature() {
  try {
    const url = new URL('https://blynk.cloud/external/api/get');
    url.searchParams.append('token', config.BLYNK_TOKEN);
    url.searchParams.append('pin', 'V0');

    // Настраиваем HTTPS с проверкой сертификата
    const response = await fetch(url.toString(), {
      cf: {
        cacheTtl: config.CACHE_TTL,
        minify: { javascript: true }
      },
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Blynk API error: ${response.status}`);
    }

    const tempText = await response.text();
    const temperature = parseFloat(tempText);

    if (isNaN(temperature)) {
      throw new Error('Invalid temperature data');
    }

    // Обновляем кэш
    cache = {
      temperature,
      lastUpdated: Date.now()
    };

    return temperature;

  } catch (error) {
    console.error('Blynk request failed:', error);
    throw error;
  }
}

async function handleRequest(request) {
  // Проверяем метод запроса
  if (request.method !== 'GET') {
    return new Response(JSON.stringify({
      response: {
        tts: 'Метод не поддерживается',
        end_session: true
      }
    }), { status: 405, headers: { 'Content-Type': 'application/json' } });
  }

  // Проверяем HTTPS (в Cloudflare всегда HTTPS)
  const protocol = request.headers.get('x-forwarded-proto');
  if (protocol !== 'https') {
    return new Response(JSON.stringify({
      response: {
        tts: 'Требуется HTTPS соединение',
        end_session: true
      }
    }), { status: 426, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    // Проверяем кэш
    let temperature;
    if (cache.lastUpdated + config.CACHE_TTL * 1000 > Date.now()) {
      temperature = cache.temperature;
    } else {
      temperature = await fetchBlynkTemperature();
    }

    // Формируем ответ для Алисы
    const response = {
      response: {
        text: `Текущая температура: ${temperature}°C`,
        tts: `Сейчас в комнате ${temperature} градусов`,
        end_session: true
      },
      version: "1.0"
    };

    return new Response(JSON.stringify(response), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': `public, max-age=${config.CACHE_TTL}`
      }
    });

  } catch (error) {
    console.error('Handler error:', error);
    
    const ttsMessage = error.message.includes('timeout') 
      ? "Датчик не отвечает, попробуйте позже" 
      : "Ошибка получения данных";

    return new Response(JSON.stringify({
      response: {
        tts: ttsMessage,
        end_session: true
      }
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}