async function checkServer() {
  const status = document.getElementById('server-status');

  try {
    const response = await fetch('/api/health');

    if (!response.ok) {
      throw new Error('Server unavailable');
    }

    const data = await response.json();

    status.textContent = data.status === 'online'
      ? 'جميع الأنظمة تعمل'
      : 'الخادم غير متاح';

  } catch (error) {
    status.textContent = 'تعذر الاتصال بالخادم';
    console.error(error);
  }
}

checkServer();
