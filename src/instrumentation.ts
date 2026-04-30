export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { initializeMqtt } = await import('@/lib/mqtt/init');
    await initializeMqtt();
  }
}
