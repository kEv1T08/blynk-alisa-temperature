addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  // ��� ����� Blynk
  const BLYNK_TOKEN = "EremRbRJFC37NaFHMTPKbMKPJni6AwmC";
  const url = `https://blynk.cloud/external/api/get?token=EremRbRJFC37NaFHMTPKbMKPJni6AwmCpin=V0`;

  // ����������� ����������� � Blynk
  const response = await fetch(url);
  const temp = await response.text();

  // ������ ������ ��� �����
  const jsonResponse = {
    "text": `�����������: ${temp} ��������`,
    "tts": `����������� ������ ${temp} ��������`
  };

  return new Response(JSON.stringify(jsonResponse), {
    headers: { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*' // ��� CORS
    }
  });
}