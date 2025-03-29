addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  // Ваш токен Blynk
  const BLYNK_TOKEN = "EremRbRJFC37NaFHMTPKbMKPJni6AwmC";
  const url = `https://blynk.cloud/external/api/get?token=EremRbRJFC37NaFHMTPKbMKPJni6AwmCpin=V0`;

  // Запрашиваем температуру с Blynk
  const response = await fetch(url);
  const temp = await response.text();

  // Формат ответа для Алисы
  const jsonResponse = {
    "text": `Температура: ${temp} градусов`,
    "tts": `Температура сейчас ${temp} градусов`
  };

  return new Response(JSON.stringify(jsonResponse), {
    headers: { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*' // Для CORS
    }
  });
}