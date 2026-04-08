const API_URL = process.env.EXPO_PUBLIC_API_URL || '';

export function maybeCompleteAuthSession() {}

export async function openAuthSession(handleAuthResult) {
  const authUrl = `${API_URL}/api/auth/google/start?platform=web`;
  const popup = window.open(authUrl, 'google-auth', 'width=500,height=600');

  return new Promise((resolve) => {
    function onMessage(event) {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === 'auth-callback') {
        window.removeEventListener('message', onMessage);
        handleAuthResult(event.data.url).then(resolve);
      }
    }
    window.addEventListener('message', onMessage);
    const checkClosed = setInterval(() => {
      if (popup?.closed) {
        clearInterval(checkClosed);
        window.removeEventListener('message', onMessage);
        resolve();
      }
    }, 500);
  });
}
